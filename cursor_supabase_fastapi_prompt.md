# Cursor Prompt: Integrate Supabase Backend + Gemini Chat Context (FastAPI Version)

You are editing a codebase for a **Visual System Design Editor** that is currently:

- A **pure frontend React + TypeScript SPA**.
- Built with **Vite**.
- Uses **localStorage** for persistence.
- Has **no backend, no API, no database**.

The goal is to evolve this into a **frontend + backend** setup with:

1. A **`frontend/`** folder for the Vite React app.
2. A **`backend/`** folder for a **Python FastAPI** server that:
   - Integrates with **Supabase** (Postgres + Auth).
   - Exposes an **HTTP chat endpoint** that:
     - Reads **diagram context** from Supabase.
     - Reads **recent chat context** from Supabase.
     - Calls **Gemini** with both, and returns **diagram edit operations** as JSON.

The result should feel like **ArchCoach**:
- User edits the diagram in the canvas.
- User opens chat, asks for changes.
- Backend uses **the latest diagram + recent conversation** to produce **operations** that the frontend applies to the diagram.

---

## 0. High-Level Repo Layout

Refactor the repo into this structure:

```txt
/
  backend/
    app/
      __init__.py
      main.py
      env.py
      supabase_client.py
      routes/
        __init__.py
        health.py
        chat.py
    pyproject.toml or requirements.txt
  frontend/
    index.html
    vite.config.ts
    package.json
    tsconfig.json
    src/
      main.tsx
      App.tsx
      ... (existing React code: components, hooks, contexts, utils)
      lib/
        supabaseClient.ts
      hooks/
        useSupabaseDiagramSync.ts
        useChatWithGemini.ts
  package.json
  README.md
```

> **Important:** Do **not** rewrite everything. Adapt the existing frontend to live under `frontend/` with minimal changes while wiring in Supabase + a FastAPI backend chat endpoint.

---

## 1. Supabase Schema & Data Model

### 1.1. Tables

Create the following tables in Supabase (SQL):

```sql
-- Projects represent a single system design diagram
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,             -- optional for future auth
  session_id text,          -- for anonymous/local users
  name text not null,
  diagram_json jsonb not null, -- full getProject() JSON
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index projects_session_id_idx on projects(session_id);

-- Chat messages associated with a specific project
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index chat_messages_project_id_created_at_idx
  on chat_messages(project_id, created_at);
```

### 1.2. RLS (Row-Level Security)

Turn on RLS and create simple policies:

- For **now**, allow `session_id`-based access (no real auth yet):

```sql
alter table projects enable row level security;
alter table chat_messages enable row level security;

create policy "allow anon session_id read/write projects"
on projects
for all
using (true)
with check (true);

create policy "allow anon session_id read/write chat_messages"
on chat_messages
for all
using (true)
with check (true);
```

> Later, these should be tightened using proper auth and `user_id`.

---

## 2. Backend Setup (`backend/`) with FastAPI

### 2.1. Backend Dependencies

Use either `requirements.txt` or `pyproject.toml`. Example `requirements.txt`:

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.5
supabase-py==2.4.0
python-dotenv==1.0.1
google-generativeai==0.8.3
```

> Versions are examples; pin as needed.

### 2.2. Directory Layout

```txt
backend/
  app/
    __init__.py
    main.py
    env.py
    supabase_client.py
    routes/
      __init__.py
      health.py
      chat.py
  requirements.txt
```

### 2.3. Environment Handling

Create `backend/app/env.py`:

```py
import os
from dotenv import load_dotenv

load_dotenv()

class Env:
    PORT: int = int(os.getenv("PORT", "4000"))
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GOOGLE_GEMINI_API_KEY", "")

    @classmethod
    def validate(cls) -> None:
        missing = []
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_SERVICE_ROLE_KEY:
            missing.append("SUPABASE_SERVICE_ROLE_KEY")
        if not cls.GEMINI_API_KEY:
            missing.append("GOOGLE_GEMINI_API_KEY")
        if missing:
            raise RuntimeError(f"Missing environment variables: {', '.join(missing)}")

Env.validate()
```

In `backend/.env` (not committed):

```env
PORT=4000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_GEMINI_API_KEY=...
```

### 2.4. Supabase Client (Server)

Create `backend/app/supabase_client.py`:

```py
from supabase import create_client, Client
from .env import Env

supabase: Client = create_client(
    Env.SUPABASE_URL,
    Env.SUPABASE_SERVICE_ROLE_KEY,
)
```

### 2.5. FastAPI Application Entry

Create `backend/app/main.py`:

```py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.health import router as health_router
from .routes.chat import router as chat_router

app = FastAPI(
    title="Visual System Editor Backend",
    version="1.0.0",
)

# Configure CORS to allow the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later: [frontend URL]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
```

Run the server locally (from `backend/`):

```bash
uvicorn app.main:app --reload --port 4000
```

---

## 3. Backend Routes (FastAPI)

### 3.1. Health Route

`backend/app/routes/health.py`:

```py
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health():
    return {"ok": True}
```

### 3.2. Chat Route with Supabase + Gemini Context

`backend/app/routes/chat.py`:

```py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal
from ..supabase_client import supabase
from ..env import Env
import google.generativeai as genai

genai.configure(api_key=Env.GEMINI_API_KEY)

router = APIRouter()

class ChatRequest(BaseModel):
    projectId: str
    message: str

@router.post("/chat")
async def chat(req: ChatRequest):
    # 1) Load diagram context
    project_res = supabase.table("projects").select("diagram_json").eq("id", req.projectId).single().execute()

    if project_res.error or not project_res.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = project_res.data
    diagram_json = project.get("diagram_json", {})

    # 2) Load recent chat context
    messages_res = (
        supabase.table("chat_messages")
        .select("role, content, created_at")
        .eq("project_id", req.projectId)
        .order("created_at", desc=False)
        .limit(20)
        .execute()
    )

    history_rows = messages_res.data or []
    history_text = (
        "\n".join(f"{row['role'].upper()}: {row['content']}" for row in history_rows)
        if history_rows
        else "No previous messages."
    )

    # 3) Build system prompt for Gemini
    system_instruction = f"""
You are ArchCoach, an AI that helps edit a system design diagram.
The diagram is represented as a JSON "project" with nodes and edges.

Current diagram JSON:
{diagram_json}

Recent chat:
{history_text}

User will send a new instruction. You MUST respond with a JSON array
of diagram edit operations ONLY. Each operation must have:
- "op": one of "add_node", "update_node", "delete_node", "add_edge", "delete_edge"
- "payload": the data needed to perform the operation.

Do not include explanations, comments, or non-JSON text. JSON only.
"""

    model = genai.GenerativeModel("gemini-1.5-pro")

    # Note: we use a single prompt combining system + user,
    # but you can also use "system_instruction" parameter with the SDK variant that supports it.
    prompt = system_instruction + "\nUSER:\n" + req.message

    response = model.generate_content(prompt)
    reply_text = (response.text or "").strip()

    if not reply_text:
        raise HTTPException(status_code=500, detail="Empty response from Gemini")

    # 4) Store messages (user + assistant) for history
    supabase.table("chat_messages").insert([
        {
            "project_id": req.projectId,
            "role": "user",
            "content": req.message,
        },
        {
            "project_id": req.projectId,
            "role": "assistant",
            "content": reply_text,
        },
    ]).execute()

    # Return the raw operations JSON string; frontend will parse and apply
    return {"operationsJson": reply_text}
```

> The frontend will parse `operationsJson` as JSON and apply each operation to the local diagram state.

---

## 4. Frontend Refactor (`frontend/`)

### 4.1. Move Existing App into `frontend/`

- Move current SPA files from the root into `frontend/`:
  - `src/` → `frontend/src/`
  - `vite.config.ts` → `frontend/vite.config.ts`
  - `index.html` → `frontend/index.html`
  - `package.json` → `frontend/package.json` (adjust scripts and paths)
- Ensure that any localStorage usage remains for **offline** use.

### 4.2. Supabase Client (Frontend)

Create `frontend/src/lib/supabaseClient.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

Add to `frontend/.env` (example):

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_BACKEND_URL=http://localhost:4000/api
```

### 4.3. Session & Project Bootstrapping

Add a helper to manage a `sessionId` in localStorage (for anonymous users) and create or load a Supabase project row.

Create `frontend/src/lib/session.ts`:

```ts
import { v4 as uuid } from "uuid";

const SESSION_KEY = "vsde-session-id";

export function getOrCreateSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = uuid();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}
```

Create `frontend/src/hooks/useProjectId.ts`:

```ts
import { useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";
import { getOrCreateSessionId } from "../lib/session";

export function useProjectId(initialName: string = "Untitled Project") {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    let cancelled = false;

    async function ensureProject() {
      const { data, error } = await supabaseClient
        .from("projects")
        .select("id")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to load project", error);
      }

      if (!cancelled) {
        if (data?.id) {
          setProjectId(data.id);
          setLoading(false);
          return;
        }

        // No project yet; create one with empty diagram
        const emptyDiagram = {
          version: "1.0.0",
          name: initialName,
          nodes: [],
          edges: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const { data: created, error: createError } = await supabaseClient
          .from("projects")
          .insert({
            session_id: sessionId,
            name: initialName,
            diagram_json: emptyDiagram,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Failed to create project", createError);
        }

        if (!cancelled && created?.id) {
          setProjectId(created.id);
          setLoading(false);
        }
      }
    }

    ensureProject();

    return () => {
      cancelled = true;
    };
  }, [initialName]);

  return { projectId, loading };
}
```

Use this hook in your top-level editor page to get `projectId` and pass it down.

---

## 5. Frontend: Sync Diagram to Supabase

Assuming you have a `ProjectContext` or similar with `getProject()` and `nodes`/`edges` in state, create:

`frontend/src/hooks/useSupabaseDiagramSync.ts`:

```ts
import { useEffect, useRef } from "react";
import { supabaseClient } from "../lib/supabaseClient";
import { useProjectContext } from "../contexts/ProjectContext";

export function useSupabaseDiagramSync(projectId: string | null) {
  const { nodes, edges, getProject } = useProjectContext();
  const lastPayloadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const timeout = setTimeout(async () => {
      const project = getProject();
      const payload = JSON.stringify(project);
      if (payload === lastPayloadRef.current) return;
      lastPayloadRef.current = payload;

      await supabaseClient
        .from("projects")
        .update({
          diagram_json: project,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }, 400);

    return () => clearTimeout(timeout);
  }, [nodes, edges, getProject, projectId]);
}
```

In your main editor component:

```tsx
import { useProjectId } from "./hooks/useProjectId";
import { useSupabaseDiagramSync } from "./hooks/useSupabaseDiagramSync";

export function EditorPage() {
  const { projectId, loading } = useProjectId("My Project");

  useSupabaseDiagramSync(projectId || null);

  if (loading || !projectId) return <div>Loading...</div>;

  return (
    <>
      {/* existing layout: canvas, toolbox, etc. */}
      {/* pass projectId to chat panel */}
      <ChatPanel projectId={projectId} />
    </>
  );
}
```

---

## 6. Frontend: Chat Hook to Call FastAPI & Apply Operations

### 6.1. Chat Hook

Create `frontend/src/hooks/useChatWithGemini.ts`:

```ts
import { useState } from "react";
import { useProjectContext } from "../contexts/ProjectContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChatWithGemini(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { applyOperations } = useProjectContext(); // implement this

  async function sendMessage(text: string) {
    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, message: text }),
        }
      );

      if (!res.ok) {
        throw new Error(`Chat failed with status ${res.status}`);
      }

      const data = await res.json();
      const operationsJson = data.operationsJson as string;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: operationsJson,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Parse operations and apply to diagram
      let operations;
      try {
        operations = JSON.parse(operationsJson);
      } catch (e) {
        console.error("Failed to parse operations JSON", e, operationsJson);
        return;
      }

      applyOperations(operations);
    } catch (err) {
      console.error("Chat error", err);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
```

### 6.2. Implement `applyOperations` in Project Context

Extend your `ProjectContext` (or equivalent) with a function that takes an array of operations:

```ts
type DiagramOperation =
  | { op: "add_node"; payload: any }
  | { op: "update_node"; payload: { id: string; data: any } }
  | { op: "delete_node"; payload: { id: string } }
  | { op: "add_edge"; payload: any }
  | { op: "delete_edge"; payload: { id: string } };

function applyOperations(ops: DiagramOperation[]) {
  for (const op of ops) {
    switch (op.op) {
      case "add_node":
        // call your existing addNode(...) logic
        break;
      case "update_node":
        // call existing updateNode(id, data)
        break;
      case "delete_node":
        // call existing deleteNode(id)
        break;
      case "add_edge":
        // call existing addEdge(...)
        break;
      case "delete_edge":
        // call existing deleteEdge(id)
        break;
    }
  }
}
```

Expose `applyOperations` via context so `useChatWithGemini` can use it.

---

## 7. Root-Level Tooling

At the repo root, have a `package.json` that wires both apps:

```json
{
  "name": "visual-system-editor-monorepo",
  "private": true,
  "scripts": {
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && uvicorn app.main:app --reload --port 4000",
    "dev": "concurrently "npm run dev:backend" "npm run dev:frontend"",
    "build:frontend": "cd frontend && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

> Backend is Python so there is no JS/TS build step there; you just run `uvicorn` with reload in dev and a process manager in prod.

---

## 8. Important Constraints

When modifying the code:

1. **Preserve existing UX and canvas behavior**:
   - Do not break current diagram editing, saving/loading, or localStorage usage.
   - Supabase adds **cloud persistence + chat context**, but localStorage can remain as a secondary mechanism.

2. **Keep frontend & backend cleanly separated**:
   - No backend secrets or env vars in `frontend/` except `VITE_*` public env values.
   - Backend uses `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_GEMINI_API_KEY` (never exposed to client).

3. **Gemini responses MUST be machine-parseable JSON only**:
   - System prompt should enforce that the model returns **only JSON**.
   - Frontend must robustly `JSON.parse` and handle errors.

4. **Focus on MVP**:
   - NO complex auth flows yet.
   - NO multi-user collaboration yet.
   - Just enough to:
     - Create/load a project row in Supabase.
     - Keep `diagram_json` updated.
     - Use `diagram_json + chat_messages` as context for Gemini.
     - Apply returned operations to the canvas.

---

**End of Cursor Prompt**

Use this document as instructions to refactor the codebase and wire Supabase + Gemini with a clean `backend/` (FastAPI) and `frontend/` split.
