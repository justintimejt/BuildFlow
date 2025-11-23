# Prompt: Integrate Chat Bar Component at Bottom of Screen

## Objective

Integrate a chat bar component at the bottom of the Visual System Design Editor screen. The chat bar will allow users to prompt Luna (AI assistant) to modify their diagrams using natural language. The chat connects to the FastAPI backend which uses Supabase for context and Gemini API for generating diagram edit operations.

## Current State

### ✅ Already Implemented:

1. **Backend Integration**
   - FastAPI chat endpoint at `/api/chat` (in `backend/app/routes/chat.py`)
   - Reads diagram context from Supabase `projects` table
   - Reads chat history from Supabase `chat_messages` table
   - Uses Gemini API to generate diagram operations
   - Returns operations as JSON array

2. **Frontend Hooks**
   - `useChatWithGemini` hook (in `frontend/src/hooks/useChatWithGemini.ts`)
   - Handles sending messages to backend
   - Parses and applies operations to diagram
   - Manages chat state (messages, loading)

3. **Chat Component**
   - `ChatPanel` component exists (in `frontend/src/components/Chat/ChatPanel.tsx`)
   - Full sidebar panel implementation
   - Not yet integrated into main app layout

4. **Project Context**
   - `useProjectId` hook gets Supabase project ID
   - `applyOperations` function in ProjectContext applies AI-generated changes

## Task: Create Bottom Chat Bar

### Requirements

1. **New Component:** `ChatBar.tsx` - A collapsible chat bar at the bottom of the screen
2. **Layout Update:** Modify `App.tsx` to include the chat bar
3. **Functionality:** Hook up with existing backend, Supabase, and Gemini integration
4. **UX Considerations:**
   - Collapsible/expandable chat bar
   - Minimized state: input field visible
   - Expanded state: shows chat history
   - Smooth animations
   - Non-intrusive design

### Step 1: Create ChatBar Component

Create `frontend/src/components/Chat/ChatBar.tsx`:

**Key Features:**
- Fixed position at bottom of screen
- Collapsible with toggle button
- Input field always visible (when expanded)
- Message history scrollable
- Uses existing `useChatWithGemini` hook
- Requires `projectId` prop

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [Minimize/Maximize Button]  Luna     │
├─────────────────────────────────────────────┤
│  [Chat Messages Area - Scrollable]          │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ You: "Add..." │  │ Luna:...│        │
│  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────┤
│  [Input Field] [Send Button]                │
└─────────────────────────────────────────────┘
```

**Minimized State:**
```
┌─────────────────────────────────────────────┐
│  [Expand Button] [Input Field] [Send]       │
└─────────────────────────────────────────────┘
```

### Step 2: Implementation Details

#### Component Structure

```typescript
interface ChatBarProps {
  projectId: string | null;  // From useProjectId hook
}

export function ChatBar({ projectId }: ChatBarProps) {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  
  // Use existing chat hook (only if projectId available)
  const { messages, isLoading, sendMessage } = useChatWithGemini(
    projectId || 'dummy'  // Handle null case gracefully
  );
  
  // Scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Component JSX...
}
```

#### Key Behaviors:

1. **Conditional Rendering:**
   - Only show if `projectId` is available (Supabase connected)
   - Show message: "Supabase not configured" if unavailable
   - Or hide entirely if not configured (optional)

2. **Message Handling:**
   - Display messages in scrollable area (when expanded)
   - Auto-scroll to bottom on new messages
   - Show loading indicator when processing

3. **Input Handling:**
   - Always visible (even when minimized)
   - Disable input when loading or no projectId
   - Clear input after sending

4. **Styling:**
   - Fixed position at bottom: `fixed bottom-0 left-0 right-0`
   - Height: ~300px when expanded, ~60px when minimized
   - Smooth transitions for expand/collapse
   - Z-index above canvas but below modals

### Step 3: Update App.tsx

Modify `frontend/src/App.tsx` to include the ChatBar:

**Current Layout:**
```tsx
<div className="h-screen flex flex-col">
  <Toolbar />
  <div className="flex-1 flex overflow-hidden">
    <ComponentLibrary />
    <Canvas />
    <InspectorPanel />
  </div>
</div>
```

**Updated Layout:**
```tsx
<div className="h-screen flex flex-col">
  <Toolbar />
  <div className="flex-1 flex overflow-hidden relative">
    <ComponentLibrary />
    <Canvas />
    <InspectorPanel />
    {/* Chat Bar at bottom */}
    {projectId && <ChatBar projectId={projectId} />}
  </div>
</div>
```

**Important:** Ensure the Canvas area accounts for chat bar height (padding-bottom or adjust flex layout).

### Step 4: Component File Structure

Create/modify these files:

1. **`frontend/src/components/Chat/ChatBar.tsx`** - New bottom chat bar component
2. **`frontend/src/components/Chat/index.ts`** - Update to export both ChatPanel and ChatBar
3. **`frontend/src/App.tsx`** - Add ChatBar import and integration

### Step 5: Styling Specifications

#### Expanded State (Default)
- Height: 300px (max-height)
- Width: Full width of viewport
- Background: White with shadow
- Border: Top border to separate from canvas

#### Minimized State
- Height: 60px
- Shows only: Toggle button, input field, send button
- Chat history hidden

#### Animation
- Use CSS transitions or Tailwind's transition classes
- `transition-all duration-300 ease-in-out`
- Transform or height-based animation

#### Responsive Design
- On mobile: Full width, maybe full screen overlay
- On desktop: Bottom bar as described

### Step 6: Integration Points

#### Backend Connection
- Uses existing `useChatWithGemini` hook
- Hook calls: `${import.meta.env.VITE_BACKEND_URL}/chat`
- Backend endpoint: `POST /api/chat`
- Payload: `{ projectId: string, message: string }`
- Response: `{ operationsJson: string }`

#### Supabase Connection
- `projectId` comes from `useProjectId` hook
- Backend uses `projectId` to:
  1. Load diagram context from `projects.diagram_json`
  2. Load chat history from `chat_messages` table
  3. Store new messages in `chat_messages` table

#### Gemini Integration
- Backend (`backend/app/routes/chat.py`) uses Gemini API
- System prompt includes:
  - Current diagram JSON
  - Recent chat history
  - Instructions to return JSON operations
- Returns array of operations like:
  ```json
  [
    { "op": "add_node", "payload": { "type": "database", "position": {...} } },
    { "op": "add_edge", "payload": { "source": "...", "target": "..." } }
  ]
  ```

#### Diagram Updates
- Operations are parsed and applied via `applyOperations()` from ProjectContext
- Changes are automatically synced to Supabase via `useSupabaseDiagramSync`
- Canvas updates in real-time

### Step 7: Error Handling

Handle these cases:

1. **No Project ID (Supabase not configured)**
   - Show message: "Chat requires Supabase configuration"
   - Disable input field
   - Provide link to setup guide

2. **Backend Not Available**
   - Show error in chat messages
   - Retry button or automatic retry
   - Fallback message

3. **Invalid Operations Response**
   - Log error to console
   - Show user-friendly error in chat
   - Don't crash the app

4. **Network Errors**
   - Show "Connection error" message
   - Disable send button temporarily
   - Allow retry

### Step 8: Accessibility

- Keyboard shortcuts:
  - Enter to send (or Shift+Enter for new line)
  - Escape to minimize chat
- ARIA labels for screen readers
- Focus management when expanding/collapsing

### Step 9: Testing Checklist

- [ ] Chat bar appears when Supabase is configured
- [ ] Chat bar hidden/collapsed when Supabase unavailable
- [ ] Expand/collapse animation works smoothly
- [ ] Messages send to backend correctly
- [ ] Operations are applied to diagram
- [ ] Chat history persists in Supabase
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] Auto-scroll to latest message works
- [ ] Input clears after sending
- [ ] Disabled states work (loading, no projectId)

## Implementation Steps Summary

1. **Create `ChatBar.tsx` component**
   - Implement expand/collapse state
   - Use `useChatWithGemini` hook
   - Style with Tailwind CSS
   - Add scroll handling

2. **Update `App.tsx`**
   - Import ChatBar component
   - Add conditional rendering based on projectId
   - Adjust layout to accommodate chat bar

3. **Update exports**
   - Export ChatBar from `components/Chat/index.ts`

4. **Test Integration**
   - Verify backend connection
   - Test with real Gemini responses
   - Test error cases

## Example User Flow

1. User opens app → Chat bar appears at bottom (minimized or expanded)
2. User types: "Add a database node"
3. User clicks Send or presses Enter
4. Loading indicator shows in chat
5. Message appears in chat history
6. Backend processes:
   - Loads current diagram from Supabase
   - Loads recent chat history
   - Sends to Gemini with context
   - Receives operations JSON
   - Stores messages in Supabase
7. Frontend receives operations
8. Operations applied to diagram (node appears on canvas)
9. Assistant message shows in chat
10. Diagram auto-syncs to Supabase

## Notes

- **Backend URL:** Ensure `VITE_BACKEND_URL` is set in `frontend/.env`
- **Project ID:** Chat only works when Supabase is configured and projectId is available
- **Performance:** Consider debouncing or limiting message history display
- **UX:** Keep chat bar unobtrusive - don't block diagram editing

## Files to Create/Modify

### New Files:
- `frontend/src/components/Chat/ChatBar.tsx`

### Modified Files:
- `frontend/src/components/Chat/index.ts` (add ChatBar export)
- `frontend/src/App.tsx` (integrate ChatBar)

### Files Already Exists (No Changes Needed):
- `frontend/src/hooks/useChatWithGemini.ts` ✅
- `frontend/src/hooks/useProjectId.ts` ✅
- `backend/app/routes/chat.py` ✅
- `frontend/src/contexts/ProjectContext.tsx` ✅

---

**Implementation Priority:** Medium  
**Estimated Time:** 2-3 hours  
**Dependencies:** Backend must be running, Supabase configured, Gemini API key set

