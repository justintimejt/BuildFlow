from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal
from ..supabase_client import supabase
from ..env import Env
import google.generativeai as genai
import traceback
import uuid
from postgrest.exceptions import APIError

# Configure Gemini API - handle errors gracefully
try:
    if Env.GEMINI_API_KEY:
        genai.configure(api_key=Env.GEMINI_API_KEY)
    else:
        print("⚠️  Warning: GOOGLE_GEMINI_API_KEY not set in backend/.env")
except Exception as e:
    print(f"⚠️  Warning: Failed to configure Gemini API: {e}")

router = APIRouter()

class ChatRequest(BaseModel):
    projectId: str
    message: str

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        # Validate projectId is a valid UUID
        try:
            uuid.UUID(req.projectId)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid projectId format. Expected UUID, got: {req.projectId}"
            )
        
        # Check if Supabase is configured
        if supabase is None:
            raise HTTPException(
                status_code=503,
                detail="Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env"
            )
        
        # Check if Gemini API key is configured
        if not Env.GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY in backend/.env"
            )
        
        # 1) Load diagram context
        try:
            project_res = supabase.table("projects").select("diagram_json").eq("id", req.projectId).single().execute()
        except APIError as e:
            # Handle Supabase API errors specifically
            # APIError contains a dict with 'message', 'code', etc.
            error_dict = e.args[0] if e.args and isinstance(e.args[0], dict) else {}
            error_msg = error_dict.get('message', str(e))
            error_code = error_dict.get('code', '')
            
            print(f"Supabase APIError: {error_msg} (code: {error_code})")
            
            # Check if it's a UUID format error (PostgreSQL error code 22P02)
            if "invalid input syntax for type uuid" in error_msg.lower() or error_code == '22P02':
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid projectId format: {req.projectId}. Must be a valid UUID."
                )
            # Check if it's a "not found" error (PostgREST error code PGRST116)
            elif "not found" in error_msg.lower() or "no rows" in error_msg.lower() or "PGRST116" in error_code:
                raise HTTPException(
                    status_code=404,
                    detail=f"Project not found: {req.projectId}"
                )
            else:
                raise HTTPException(status_code=500, detail=f"Database error: {error_msg}")
        except Exception as e:
            # Handle any other exceptions
            error_msg = str(e)
            print(f"Error loading project: {e}")
            print(traceback.format_exc())
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid projectId format: {req.projectId}. Must be a valid UUID."
                )
            raise HTTPException(status_code=500, detail=f"Error loading project: {error_msg}")

        # Supabase Python client raises exceptions on error, so if we get here, check data
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found in database")

        project = project_res.data
        diagram_json = project.get("diagram_json", {})

        # 2) Load recent chat context
        try:
            messages_res = (
                supabase.table("chat_messages")
                .select("role, content, created_at")
                .eq("project_id", req.projectId)
                .order("created_at", desc=False)
                .limit(20)
                .execute()
            )
            history_rows = messages_res.data or []
        except Exception as e:
            print(f"Error loading chat history: {e}")
            history_rows = []

        history_text = (
            "\n".join(f"{row['role'].upper()}: {row['content']}" for row in history_rows)
            if history_rows
            else "No previous messages."
        )

        # 3) Build system prompt for Gemini
        system_instruction = f"""
You are ArchCoach, a friendly and helpful AI assistant that helps users design system architecture diagrams.
The diagram is represented as a JSON "project" with nodes and edges.

Current diagram JSON:
{diagram_json}

Recent chat:
{history_text}

When the user sends an instruction, you should:
1. Provide a friendly, conversational response explaining what you're doing
2. Generate the necessary diagram operations to fulfill their request

You MUST respond with a JSON object in this exact format:
{{
  "message": "A friendly, conversational explanation of what you're doing. Be helpful and clear. Describe what components you're adding, removing, or modifying.",
  "operations": [
    {{"op": "add_node", "payload": {{"type": "web-server", "position": {{"x": 100, "y": 100}}, "data": {{"name": "API Server"}}}}, "metadata": {{"x": 100, "y": 100}}}},
    {{"op": "add_edge", "payload": {{"source": "node-id-1", "target": "node-id-2"}}}}
  ]
}}

Available operations:
- "add_node": {{"op": "add_node", "payload": {{"type": string, "position": {{"x": number, "y": number}}, "data": {{"name": string, "description": string, "attributes": object}}}}, "metadata": {{"x": number, "y": number}}}}
- "update_node": {{"op": "update_node", "payload": {{"id": string, "data": {{"name": string, "description": string, "attributes": object}}}}}}
- "delete_node": {{"op": "delete_node", "payload": {{"id": string}}}}
- "add_edge": {{"op": "add_edge", "payload": {{"source": string, "target": string, "type": string (optional)}}}}
- "delete_edge": {{"op": "delete_edge", "payload": {{"id": string}}}}

Available node types: web-server, database, worker, cache, queue, storage, third-party-api, compute-node, load-balancer, message-broker, cdn, monitoring

IMPORTANT:
- The "message" field should be conversational and helpful, describing what you did (e.g., "I've added a database node to your diagram!")
- The "operations" array should contain the actual diagram modifications
- If the user asks a question or needs help (not a diagram modification), respond with a helpful message and an empty operations array: {{"message": "...", "operations": []}}
- Return ONLY valid JSON. Do NOT wrap it in markdown code blocks (```json or ```).
- Do NOT include any text outside the JSON object.
"""

        # 4) Call Gemini API
        try:
            # First, list all available models to see what's actually available
            available_models = []
            try:
                print("📋 Listing all available Gemini models...")
                for model in genai.list_models():
                    model_display_name = model.name.split('/')[-1] if '/' in model.name else model.name
                    if 'generateContent' in model.supported_generation_methods:
                        available_models.append({
                            'name': model_display_name,
                            'full_name': model.name,
                            'methods': model.supported_generation_methods
                        })
                        print(f"  ✅ {model_display_name} (full: {model.name})")
                
                if not available_models:
                    print("⚠️  No models with generateContent support found")
                else:
                    print(f"📊 Found {len(available_models)} available model(s)")
            except Exception as e:
                print(f"⚠️  Warning: Could not list models: {e}")
                print(traceback.format_exc())
            
            # Prioritize free-tier compatible models
            # Updated list based on actual available models (gemini-1.5-flash is no longer available)
            # Free tier typically supports: gemini-2.5-flash, gemini-2.0-flash, gemini-flash-latest
            preferred_models = [
                "gemini-2.5-flash",           # Latest stable free-tier model
                "gemini-2.0-flash",           # Alternative free-tier option
                "gemini-flash-latest",         # Latest flash model
                "gemini-2.5-flash-lite",      # Lite version
                "gemini-2.0-flash-lite",      # Alternative lite
                "gemini-pro-latest",          # Pro model (may have limits)
                "gemini-1.5-flash",           # Legacy (may not be available)
                "gemini-1.5-pro",             # Legacy (may not be available)
            ]
            
            model_name = None
            model_full_name = None
            
            # First, try to find preferred models from the list
            if available_models:
                for preferred in preferred_models:
                    for model_info in available_models:
                        # Exact match or starts with preferred name
                        if (model_info['name'] == preferred or 
                            model_info['name'].startswith(preferred) or
                            preferred in model_info['name']):
                            # Check if it's a free-tier model (not experimental, not preview)
                            if ('-exp' not in model_info['name'].lower() and 
                                '-preview' not in model_info['name'].lower()):
                                model_name = model_info['name']
                                model_full_name = model_info['full_name']
                                print(f"✅ Selected free-tier model: {model_name} (full: {model_full_name})")
                                break
                    if model_name:
                        break
            
            # If no preferred model found, use the first available non-experimental, non-preview model
            if not model_name and available_models:
                for model_info in available_models:
                    if ('-exp' not in model_info['name'].lower() and 
                        '-preview' not in model_info['name'].lower()):
                        model_name = model_info['name']
                        model_full_name = model_info['full_name']
                        print(f"✅ Selected available model: {model_name} (full: {model_full_name})")
                        break
            
            # Fallback: try creating models directly (for backwards compatibility)
            if not model_name:
                print("⚠️  No model found from list, trying direct model creation...")
                for name in preferred_models:
                    try:
                        test_model = genai.GenerativeModel(name)
                        model_name = name
                        model_full_name = name
                        print(f"✅ Using model (direct): {model_name}")
                        break
                    except Exception as e:
                        print(f"  Model {name} not available: {e}")
                        continue
            
            if not model_name:
                error_detail = "No available Gemini models found. "
                if available_models:
                    error_detail += f"Available models: {', '.join([m['name'] for m in available_models[:5]])}"
                else:
                    error_detail += "Please check your API key and model availability."
                raise HTTPException(status_code=503, detail=error_detail)
            
            # Use display name (GenerativeModel accepts just the model name, not the full path)
            # The full name is like "models/gemini-2.5-flash" but we need just "gemini-2.5-flash"
            model_to_use = model_name  # Use display name, not full path
            print(f"🔧 Creating GenerativeModel with: {model_to_use}")
            model = genai.GenerativeModel(model_to_use)
            prompt = system_instruction + "\nUSER:\n" + req.message
            response = model.generate_content(prompt)
            reply_text = (response.text or "").strip()
            
            # Clean up response: remove markdown code blocks if present
            if reply_text.startswith('```'):
                # Find the first newline after ```
                first_newline = reply_text.find('\n')
                if first_newline != -1:
                    reply_text = reply_text[first_newline + 1:]
                else:
                    reply_text = reply_text[3:]  # Remove ``` if no newline
                # Remove trailing ```
                last_backticks = reply_text.rfind('```')
                if last_backticks != -1:
                    reply_text = reply_text[:last_backticks]
                reply_text = reply_text.strip()
        except Exception as e:
            error_msg = str(e)
            print(f"Error calling Gemini API: {e}")
            print(traceback.format_exc())
            
            # Handle rate limit errors with helpful messages
            if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                if "free_tier" in error_msg.lower():
                    raise HTTPException(
                        status_code=429,
                        detail="Gemini API free tier quota exceeded. Please wait a few minutes or upgrade your API plan. Free tier typically supports gemini-2.5-flash, gemini-2.0-flash, and gemini-flash-latest models."
                    )
                else:
                    raise HTTPException(
                        status_code=429,
                        detail="Gemini API rate limit exceeded. Please wait a few minutes before trying again."
                    )
            
            raise HTTPException(status_code=500, detail=f"Gemini API error: {error_msg}")

        if not reply_text:
            raise HTTPException(status_code=500, detail="Empty response from Gemini")

        # Parse the response JSON
        import json
        try:
            response_data = json.loads(reply_text)
            
            # Extract message and operations
            assistant_message = response_data.get("message", "I've processed your request.")
            operations = response_data.get("operations", [])
            
            # Validate operations is a list
            if not isinstance(operations, list):
                operations = []
            
        except json.JSONDecodeError as e:
            print(f"Warning: Failed to parse AI response as JSON: {e}")
            print(f"Raw response: {reply_text}")
            # Fallback: treat as old format (just operations array)
            try:
                operations = json.loads(reply_text)
                if isinstance(operations, list):
                    assistant_message = "I've updated your diagram."
                else:
                    operations = []
                    assistant_message = "I received your message, but couldn't parse the response format."
            except:
                operations = []
                assistant_message = "I received your message, but encountered an error processing it."

        # 5) Store messages (user + assistant) for history
        try:
            supabase.table("chat_messages").insert([
                {
                    "project_id": req.projectId,
                    "role": "user",
                    "content": req.message,
                },
                {
                    "project_id": req.projectId,
                    "role": "assistant",
                    "content": assistant_message,
                },
            ]).execute()
        except Exception as e:
            print(f"Warning: Failed to save chat history: {e}")
            # Don't fail the request if history save fails

        # Return both the message and operations
        return {
            "message": assistant_message,
            "operations": operations
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Unexpected error in chat endpoint: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

