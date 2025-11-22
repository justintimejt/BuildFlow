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

