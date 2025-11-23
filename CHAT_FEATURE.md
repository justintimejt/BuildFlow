# Chat Feature Documentation - Luna AI Assistant

## Overview

The Chat Feature is an AI-powered assistant called **Luna** that allows users to modify system design diagrams using natural language. Users can type commands like "Add a database node" or "Connect the API server to the database", and the AI will automatically generate and apply the necessary diagram operations.

## Architecture

### High-Level Flow

```
User Input (Chat Bar)
    ↓
Frontend: useChatWithGemini Hook
    ↓
HTTP POST to FastAPI Backend
    ↓
Backend: /api/chat Endpoint
    ├── Loads diagram context from Supabase
    ├── Loads recent chat history from Supabase
    └── Calls Gemini API with context
    ↓
Gemini API: Generates Operations JSON
    ↓
Backend: Stores messages in Supabase
    ↓
Backend: Returns operations to Frontend
    ↓
Frontend: Parses and applies operations
    ├── Updates diagram via applyOperations()
    └── Auto-syncs to Supabase
```

## Components

### Frontend Components

#### 1. ChatBar Component
**Location:** `frontend/src/components/Chat/ChatBar.tsx`

A collapsible chat bar fixed at the bottom of the screen.

**Features:**
- **Expandable/Collapsible:** Toggle between minimized (60px) and expanded (300px) states
- **Fixed Position:** Always visible at bottom of screen (z-index: 40)
- **Message History:** Scrollable message area when expanded
- **Input Field:** Always visible, even when minimized
- **Loading States:** Shows animated loading indicator while processing
- **Auto-scroll:** Automatically scrolls to latest message

**State:**
- `isExpanded`: Boolean - Controls expand/collapse
- `input`: String - Current input text
- Messages and loading state from `useChatWithGemini` hook

**Conditional Rendering:**
- Only renders when `projectId` is available (Supabase configured)
- Returns `null` if no `projectId` (hides completely)

#### 2. ChatPanel Component (Alternative)
**Location:** `frontend/src/components/Chat/ChatPanel.tsx`

Full sidebar panel implementation (not currently used in main app, but available).

### Frontend Hooks

#### useChatWithGemini Hook
**Location:** `frontend/src/hooks/useChatWithGemini.ts`

**Purpose:** Manages chat communication with backend and applies operations to diagram.

**API:**
```typescript
const { messages, isLoading, sendMessage } = useChatWithGemini(projectId);
```

**Functions:**
- `sendMessage(text: string)` - Sends message to backend and applies returned operations

**State:**
- `messages`: Array of chat messages (user and assistant)
- `isLoading`: Boolean indicating if request is in progress

**Process:**
1. Adds user message to local state
2. Sends POST request to `${VITE_BACKEND_URL}/chat`
3. Receives `operationsJson` from backend
4. Parses JSON array of operations
5. Applies operations via `applyOperations()` from ProjectContext
6. Adds assistant message to chat history

#### useProjectId Hook
**Location:** `frontend/src/hooks/useProjectId.ts`

**Purpose:** Gets or creates Supabase project ID for the current session.

**Returns:**
- `projectId`: string | null - The Supabase project ID
- `loading`: boolean - Whether project is being loaded/created

**Behavior:**
- If Supabase not available: returns `null` immediately
- If Supabase available: creates or loads project from `projects` table
- Uses session ID from localStorage for anonymous users

### Backend Components

#### Chat Endpoint
**Location:** `backend/app/routes/chat.py`

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "projectId": "uuid-string",
  "message": "Add a database node"
}
```

**Response:**
```json
{
  "operationsJson": "[{\"op\":\"add_node\",\"payload\":{...}}]"
}
```

**Process:**
1. **Load Diagram Context:**
   - Queries `projects` table for `projectId`
   - Extracts `diagram_json` (contains nodes, edges, metadata)

2. **Load Chat History:**
   - Queries `chat_messages` table for last 20 messages
   - Formats as conversation history

3. **Build System Prompt:**
   - Includes current diagram JSON
   - Includes recent chat history
   - Instructions to return JSON operations array only

4. **Call Gemini API:**
   - Uses `google-generativeai` library
   - Model: `gemini-1.5-pro`
   - Sends system prompt + user message

5. **Store Messages:**
   - Inserts both user and assistant messages into `chat_messages` table
   - Links to `project_id` for history tracking

6. **Return Operations:**
   - Returns raw JSON string of operations
   - Frontend parses and applies

## Data Flow

### 1. User Types Message

```
User types: "Add a Redis cache node"
    ↓
ChatBar component calls sendMessage("Add a Redis cache node")
    ↓
useChatWithGemini hook processes
```

### 2. Frontend Sends to Backend

```typescript
fetch(`${VITE_BACKEND_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: "abc-123-uuid",
    message: "Add a Redis cache node"
  })
})
```

### 3. Backend Processes

```python
# Load diagram context
project = supabase.table("projects").select("diagram_json").eq("id", projectId).single()

# Load chat history
history = supabase.table("chat_messages")
  .select("role, content, created_at")
  .eq("project_id", projectId)
  .order("created_at", desc=False)
  .limit(20)

# Build prompt for Gemini
system_prompt = f"""
Current diagram JSON:
{project.diagram_json}

Recent chat:
{history}

User will send instruction. Respond with JSON array of operations ONLY.
"""

# Call Gemini
response = model.generate_content(system_prompt + user_message)

# Store messages
supabase.table("chat_messages").insert([
  {"project_id": projectId, "role": "user", "content": user_message},
  {"project_id": projectId, "role": "assistant", "content": response.text}
])

# Return operations
return {"operationsJson": response.text}
```

### 4. Frontend Receives and Applies

```typescript
const data = await response.json();
const operations = JSON.parse(data.operationsJson);

// Example operations array:
[
  {
    "op": "add_node",
    "payload": {
      "type": "cache",
      "position": { "x": 300, "y": 200 },
      "data": { "name": "Redis Cache" }
    }
  }
]

// Apply operations
applyOperations(operations);
```

### 5. Diagram Updates

```typescript
// In ProjectContext
applyOperations(operations) {
  for (const op of operations) {
    switch (op.op) {
      case "add_node":
        // Add node to canvas
        break;
      case "update_node":
        // Update node properties
        break;
      // ... other operations
    }
  }
}
```

### 6. Auto-Sync to Supabase

```typescript
// useSupabaseDiagramSync hook detects changes
useEffect(() => {
  // Debounced: waits 400ms after changes
  const project = getProject();
  supabase.table("projects").update({
    diagram_json: project,
    updated_at: new Date().toISOString()
  }).eq("id", projectId);
}, [nodes, edges]);
```

## Operation Types

The AI can generate these operation types:

### 1. add_node
Adds a new node to the diagram.

**Format:**
```json
{
  "op": "add_node",
  "payload": {
    "type": "database",           // Node type ID (e.g., "web-server", "database")
    "position": { "x": 100, "y": 200 },
    "data": {                      // Optional: overrides default node data
      "name": "PostgreSQL",
      "description": "Main database"
    }
  }
}
```

### 2. update_node
Updates properties of an existing node.

**Format:**
```json
{
  "op": "update_node",
  "payload": {
    "id": "node-uuid",
    "data": {
      "name": "Updated Name",
      "description": "New description",
      "attributes": { "port": 5432 }
    }
  }
}
```

### 3. delete_node
Removes a node from the diagram (and connected edges).

**Format:**
```json
{
  "op": "delete_node",
  "payload": {
    "id": "node-uuid"
  }
}
```

### 4. add_edge
Creates a connection between two nodes.

**Format:**
```json
{
  "op": "add_edge",
  "payload": {
    "source": "node-1-uuid",
    "target": "node-2-uuid",
    "type": "smoothstep"          // Optional: edge style
  }
}
```

### 5. delete_edge
Removes a connection between nodes.

**Format:**
```json
{
  "op": "delete_edge",
  "payload": {
    "id": "edge-uuid"
  }
}
```

## Usage Guide

### For End Users

#### Starting a Chat Session

1. **Prerequisites:**
   - Supabase must be configured (chat bar only appears when configured)
   - Backend server must be running
   - Project ID must be available

2. **Accessing Chat:**
   - Chat bar appears at bottom of screen automatically
   - If not visible, check that Supabase is configured in `.env`

#### Using the Chat

1. **Minimized State (Default):**
   - Shows input field and send button
   - Click chevron up (↑) to expand

2. **Expanded State:**
   - Shows full chat history
   - Scrollable message area
   - Input field at bottom
   - Click chevron down (↓) to minimize

3. **Sending Messages:**
   - Type your command in the input field
   - Press Enter or click Send button
   - Loading indicator appears while processing

4. **Keyboard Shortcuts:**
   - **Enter:** Send message
   - **Escape:** Minimize chat (when expanded)

#### Example Commands

```
"Add a database node"
"Connect the web server to the database"
"Delete the cache node"
"Update the API server name to 'REST API'"
"Add a Redis cache and connect it to the web server"
"Remove the connection between the API and database"
```

### For Developers

#### Adding Chat to a Component

```tsx
import { ChatBar } from './components/Chat';
import { useProjectId } from './hooks/useProjectId';

function MyComponent() {
  const { projectId } = useProjectId();
  
  return (
    <div>
      {/* Your content */}
      {projectId && <ChatBar projectId={projectId} />}
    </div>
  );
}
```

#### Customizing Chat Behavior

**Change Chat Position:**
```tsx
// In ChatBar.tsx, modify className:
className="fixed top-0 ..." // Instead of bottom-0
```

**Change Default Expand State:**
```tsx
const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
```

**Customize Height:**
```tsx
className={`... ${isExpanded ? 'h-[400px]' : 'h-[60px]'}`} // Larger expanded size
```

## Configuration

### Frontend Environment Variables

**Required in `frontend/.env`:**
```env
VITE_BACKEND_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend Environment Variables

**Required in `backend/.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

## Gemini API Integration

### System Prompt

The backend constructs a system prompt that includes:

1. **Current Diagram State:**
   - Full JSON representation of nodes and edges
   - Node positions, types, names, descriptions
   - Edge connections

2. **Recent Chat History:**
   - Last 20 messages from `chat_messages` table
   - Provides context for conversation continuity

3. **Instructions:**
   - Must respond with JSON array only
   - No explanations or comments
   - Each operation must have `op` and `payload` fields

### Example Prompt

```
You are Luna, an AI that helps edit a system design diagram.
The diagram is represented as a JSON "project" with nodes and edges.

Current diagram JSON:
{
  "version": "1.0.0",
  "nodes": [
    {"id": "node-1", "type": "web-server", "position": {...}, "data": {...}}
  ],
  "edges": [...]
}

Recent chat:
USER: Add a database
ASSISTANT: [{"op":"add_node","payload":{...}}]

User will send a new instruction. You MUST respond with a JSON array
of diagram edit operations ONLY. Each operation must have:
- "op": one of "add_node", "update_node", "delete_node", "add_edge", "delete_edge"
- "payload": the data needed to perform the operation.

Do not include explanations, comments, or non-JSON text. JSON only.

USER:
Add a Redis cache node
```

### Model Configuration

**Model:** `gemini-1.5-pro`

**Why Gemini:**
- Advanced reasoning capabilities
- Good at understanding context
- Reliable JSON generation
- Supports system instructions

## Error Handling

### Frontend Errors

1. **Backend Not Available:**
   - Error logged to console
   - User sees no response (could be improved with error message in chat)

2. **Invalid Operations JSON:**
   - Error logged: "Failed to parse operations JSON"
   - Operations not applied
   - Chat message still displayed

3. **Network Errors:**
   - Caught in try/catch
   - Logged to console
   - `isLoading` state reset

### Backend Errors

1. **Project Not Found:**
   - Returns 404 HTTP error
   - Frontend handles error

2. **Supabase Connection Error:**
   - Error raised, frontend receives error response

3. **Gemini API Error:**
   - Returns 500 HTTP error
   - Error detail in response

4. **Empty Gemini Response:**
   - Returns 500 error
   - Frontend handles gracefully

## Database Schema

### chat_messages Table

```sql
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
```

**Purpose:** Stores chat history for context in subsequent requests.

**Indexes:**
- `chat_messages_project_id_created_at_idx` - Fast history retrieval

**RLS:** Enabled (permissive policies for development)

### projects Table (relevant columns)

```sql
create table projects (
  id uuid primary key,
  diagram_json jsonb not null,  -- Current diagram state
  ...
);
```

**Purpose:** Stores diagram state that Gemini uses as context.

## Performance Considerations

### Debouncing
- Diagram sync to Supabase is debounced (400ms delay)
- Prevents excessive API calls during rapid changes

### Message History
- Only loads last 20 messages for context
- Prevents prompt from becoming too long

### Operation Batching
- Multiple operations can be sent in single array
- Reduces number of state updates

## Security

### API Keys
- **Frontend:** Only has `anon` key (safe for client, limited permissions)
- **Backend:** Has `service_role` key (keep secret, never expose to client)
- **Gemini Key:** Only in backend `.env`, never exposed to frontend

### RLS Policies
- Currently permissive for development
- Should be tightened for production with proper authentication

## Testing

### Manual Testing Checklist

- [ ] Chat bar appears when Supabase configured
- [ ] Chat bar hidden when Supabase not configured
- [ ] Expand/collapse works smoothly
- [ ] Messages send to backend
- [ ] Operations applied to diagram
- [ ] Messages stored in Supabase
- [ ] Chat history persists across page refresh
- [ ] Loading states display correctly
- [ ] Error handling works (disconnect backend, invalid JSON, etc.)
- [ ] Auto-scroll to latest message
- [ ] Keyboard shortcuts work (Enter, Escape)

### Test Scenarios

1. **Add Node:**
   ```
   User: "Add a database node"
   Expected: Database node appears on canvas
   ```

2. **Connect Nodes:**
   ```
   User: "Connect web server to database"
   Expected: Edge created between nodes
   ```

3. **Update Node:**
   ```
   User: "Rename the database to PostgreSQL"
   Expected: Node name updates in inspector
   ```

4. **Delete Node:**
   ```
   User: "Delete the cache node"
   Expected: Node removed, connected edges also removed
   ```

5. **Complex Operation:**
   ```
   User: "Add a Redis cache and connect it to the API server"
   Expected: New cache node added, edge created to API server
   ```

## Troubleshooting

### Chat Bar Not Visible

**Possible Causes:**
1. Supabase not configured - Check `frontend/.env` has valid keys
2. `projectId` is null - Check browser console for errors
3. Component not imported - Verify `ChatBar` import in `App.tsx`

**Solution:**
- Check browser console for warnings about Supabase
- Verify `.env` file has correct values
- Restart dev server after changing `.env`

### Messages Not Sending

**Possible Causes:**
1. Backend not running - Check `http://localhost:4000/api/health`
2. `VITE_BACKEND_URL` incorrect - Check `frontend/.env`
3. CORS error - Check backend CORS configuration

**Solution:**
- Verify backend is running: `cd backend && uvicorn app.main:app --reload`
- Check `VITE_BACKEND_URL` in frontend `.env`
- Check browser console for network errors

### Operations Not Applied

**Possible Causes:**
1. Invalid JSON from Gemini - Check console for parse errors
2. Operations not array - Check backend response format
3. `applyOperations` not working - Check ProjectContext

**Solution:**
- Check browser console for errors
- Verify backend returns valid JSON array
- Test `applyOperations` manually in console

### Diagram Not Syncing

**Possible Causes:**
1. Supabase not configured
2. `projectId` null
3. Network errors

**Solution:**
- Check Supabase connection
- Verify `projectId` is available
- Check browser console for sync errors

## Future Enhancements

### Planned Features

- [ ] **Error Messages in Chat:** Show user-friendly errors in chat UI
- [ ] **Message Editing:** Allow editing/deleting messages
- [ ] **Undo/Redo:** Undo AI-generated changes
- [ ] **Operation Preview:** Show operations before applying
- [ ] **Streaming Responses:** Stream Gemini response for better UX
- [ ] **Context Window:** Show diagram context to user
- [ ] **Suggested Commands:** Provide command suggestions
- [ ] **Voice Input:** Support voice commands
- [ ] **Multi-turn Conversations:** Better conversation continuity

### Technical Improvements

- [ ] **Rate Limiting:** Prevent abuse of Gemini API
- [ ] **Caching:** Cache common operations
- [ ] **Validation:** Validate operations before applying
- [ ] **Logging:** Better error logging and monitoring
- [ ] **Testing:** Unit tests for operation application
- [ ] **Type Safety:** Stronger TypeScript types for operations

## Related Documentation

- **Backend Setup:** See `SETUP_GUIDE.md`
- **Supabase Schema:** See `SUPABASE_SCHEMA.sql`
- **Integration Guide:** See `INTEGRATE_CHAT_BAR_PROMPT.md`
- **Implementation:** See `IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** 2024  
**Feature Version:** 1.0.0  
**Status:** ✅ Fully Implemented and Functional





