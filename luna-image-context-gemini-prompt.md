# Gemini Image Context Chat – Cursor-ready Prompt

You are an AI pair programmer working in the **BuildFlow / Luna** repo.

Your task: **Extend the existing Gemini chat endpoint and frontend chat UI so that a user can attach one or more images as context to their prompt.** The backend must accept these images, pass them to Gemini in a multimodal request, and return the analyzed result.

Assume:

- Frontend: React/TypeScript (Vite) with an existing chat input for text in `frontend/src/components/Chat/`.
- Backend: Python + FastAPI already talking to Gemini for text-only chat in `backend/app/routes/chat.py`.
- The existing endpoint is `/api/chat` and accepts `{ projectId: string, message: string }`.
- Images do **not** need to be stored permanently for now; just used as context for the current request.

---

## High-level behavior

1. In the chat UI, the user can:
   - Type a message, **and**
   - Attach one or more image files (e.g. PNG/JPEG).

2. When the user sends:
   - The frontend sends **text + images** to the backend (multipart/form-data).
   - The backend:
     - Reads the text.
     - Reads the image bytes.
     - Builds a **multimodal Gemini prompt** that includes both text and image parts.
     - Calls Gemini and returns the model’s response.
3. The assistant response is displayed as normal chat text (no need to render images in the reply right now).

---

## Backend: FastAPI + Gemini (multimodal)

### 1. Update the FastAPI route to accept images

Locate the existing Gemini chat route at `backend/app/routes/chat.py`. **Extend the existing `/api/chat` endpoint** to handle optional file uploads while maintaining backward compatibility with text-only requests.

The current endpoint accepts JSON: `{ projectId: string, message: string }`. Extend it to also accept `multipart/form-data` with:

- `projectId`: text field (required)
- `message`: text field (required)
- `images`: one or more uploaded files (optional)

Example FastAPI route update:

```py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
import base64
import google.generativeai as genai
from pydantic import BaseModel

router = APIRouter()

# Existing request model for JSON requests
class ChatRequest(BaseModel):
    projectId: str
    message: str

# The model is already configured in the existing code
# Use the same model selection logic (gemini-2.5-flash, etc.)

@router.post("/api/chat")
async def chat(
    # Support both JSON and multipart/form-data
    request: Optional[ChatRequest] = None,
    projectId: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
):
    # Handle both JSON and form-data requests
    if request:
        # JSON request (existing format)
        project_id = request.projectId
        prompt = request.message
        image_files = None
    else:
        # Form-data request (new format with images)
        if not projectId or not message:
            raise HTTPException(status_code=400, detail="projectId and message are required")
        project_id = projectId
        prompt = message
        image_files = images

    # Read image bytes (if any)
    image_parts = []
    if image_files:
        for img in image_files:
            content = await img.read()
            if not content:
                continue

            # Inline data for Gemini multimodal
            image_parts.append(
                {
                    "mime_type": img.content_type or "image/png",
                    "data": base64.b64encode(content).decode("utf-8"),
                }
            )

    # Build parts list for Gemini: text + images
    parts = []

    # User text prompt first
    parts.append(prompt)

    # Then each image as a separate part
    for p in image_parts:
        parts.append(
            genai.types.Part.from_data(
                mime_type=p["mime_type"],
                data=base64.b64decode(p["data"]),
            )
        )

    # Use the existing model selection logic from the current code
    # The model is already created in the existing route
    try:
        # Get the model instance (use existing model selection logic)
        model = genai.GenerativeModel("gemini-2.5-flash")  # or use existing model selection
        response = model.generate_content(parts)
        text = response.text or ""
    except Exception as e:
        # Use existing error handling pattern
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    # Return in the same format as existing endpoint
    return {
        "message": text,
        "operations": []  # Maintain existing response structure
    }
```

Notes:

- Use the **same model** you already use for text-only chat (e.g. `"gemini-2.5-flash"`).
- `generate_content` accepts a list of parts; mixing strings and `Part.from_data` is allowed for multimodal prompts.
- Maintain backward compatibility: existing JSON requests should still work.
- Integrate with existing error handling and response format.
- The existing route already handles project context loading from Supabase - preserve that logic.

---

## Frontend: Chat UI updates

### 1. Extend message composer to support image attachments

Locate the **chat input** components:
- `frontend/src/components/Chat/ChatPanel.tsx` - Full chat panel
- `frontend/src/components/Chat/ChatBar.tsx` - Collapsible chat bar

Add image attachment support to both components:

- A "paperclip" / "image" button that opens a file picker (use `FaPaperclip` from `react-icons/fa`).
- A hidden `<input type="file" multiple accept="image/*" />`.
- Image preview thumbnails above the input.

Example integration for `ChatPanel.tsx`:

```tsx
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FaPaperPlane, FaPaperclip } from "react-icons/fa";

type AttachedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export function ChatPanel({ projectId }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<AttachedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { messages, isLoading, sendMessage } = useChatWithGemini(projectId);

  const handleClickAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files) return;

    const next: AttachedImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const previewUrl = URL.createObjectURL(file);
      next.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
      });
    });

    setImages((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed && images.length === 0 || isLoading) return;
    
    // Send message with images
    sendMessage(trimmed, images.map(i => i.file));
    
    // Cleanup
    setInput('');
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border rounded-r-lg overflow-hidden">
      {/* ... existing header and messages ... */}
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
        {/* Attached image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((img) => (
              <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                <img
                  src={img.previewUrl}
                  alt="Attached"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-xs text-white hover:bg-black/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClickAttach}
            className="h-10 w-10 shrink-0"
            aria-label="Attach image"
          >
            <FaPaperclip className="h-4 w-4" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Luna to modify your diagram... (Shift+Enter for new line)"
            disabled={isLoading}
            className="resize-none min-h-[40px] max-h-[120px]"
            rows={1}
          />

          <Button
            type="submit"
            disabled={isLoading || (!input.trim() && images.length === 0)}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label="Send message"
          >
            <FaPaperPlane className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
```

Apply similar changes to `ChatBar.tsx` to maintain consistency.

---

### 2. Update the chat hook to support images

Modify `frontend/src/hooks/useChatWithGemini.ts` to accept and send images when present.

Update the `sendMessage` function signature:

```ts
async function sendMessage(text: string, images?: File[]) {
  // ... existing validation and user message logic ...

  try {
    // Get backend URL with fallback to default
    let backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

    let res: Response;
    
    if (images && images.length > 0) {
      // Send multipart/form-data when images are present
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("message", text);
      
      images.forEach((file) => {
        formData.append("images", file);
      });

      res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        body: formData,
      });
    } else {
      // Send JSON for text-only requests (existing format)
      res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: text }),
      });
    }

    if (!res.ok) {
      let errorMessage = `Chat failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If response is not JSON, use default message
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    
    // Handle response (existing logic for operations, etc.)
    // ... rest of existing response handling ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

Update the hook return type:

```ts
return {
  messages,
  isLoading,
  sendMessage: (text: string, images?: File[]) => sendMessage(text, images),
  // ... other returns ...
};
```

This ensures:

- Text + image files go together to `/api/chat` using `multipart/form-data`.
- Text-only requests continue using JSON format (backward compatible).
- The backend passes images to Gemini in a multimodal request.
- The assistant response is displayed as a normal chat message.

---

## Prompt construction for Gemini

You can control how Gemini uses the images by **wrapping the prompt text** with clear instructions. Integrate this into the existing system prompt in `backend/app/routes/chat.py`:

```py
# In the existing route, modify the system_instruction to include image context
system_instruction = f"""
You are Luna, a friendly and helpful AI assistant that helps users design system architecture diagrams.
The diagram is represented as a JSON "project" with nodes and edges.

Current diagram JSON:
{diagram_json}

The user may attach one or more images containing diagrams, screenshots, or code.
Use both the text prompt and the image(s) when formulating your answer.
Be explicit when you are referring to visual details from the images.
When images are provided, analyze them in the context of the current diagram state.
"""

# When building parts for multimodal request:
parts = [system_instruction, prompt]
# Then append image parts as shown earlier.
```

The existing system prompt already includes diagram context - extend it to handle image context when images are present.

---

## Definition of done

- Users can **attach one or more images** in the chat UI from their filesystem.
- Attached images show up as small thumbnails above the input, with a way to remove them before sending.
- When the user sends:
  - If images are present: Frontend posts `multipart/form-data` with `projectId`, `message`, and `images[]` to `/api/chat`.
  - If no images: Frontend continues using JSON format `{ projectId, message }` (backward compatible).
  - Backend uses Gemini's **multimodal** capability (text + image Part objects) to generate a response.
- The assistant's reply is rendered as normal text in the chat stream.
- The existing text-only flow still works if no images are attached.
- Both `ChatPanel.tsx` and `ChatBar.tsx` support image attachments.
- Image preview URLs are properly cleaned up to prevent memory leaks.
