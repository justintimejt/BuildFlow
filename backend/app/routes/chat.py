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

        # 4) Call Gemini API
        try:
            # List available models and find one that supports generateContent
            model_name = None
            try:
                print("Listing available Gemini models...")
                for model in genai.list_models():
                    if 'generateContent' in model.supported_generation_methods:
                        model_name = model.name
                        print(f"Found available model: {model_name}")
                        break
            except Exception as e:
                print(f"Warning: Could not list models: {e}")
            
            # If no model found from listing, try common model names
            if not model_name:
                model_names_to_try = [
                    "gemini-1.5-flash",
                    "gemini-1.5-flash-latest", 
                    "gemini-pro",
                    "gemini-pro-latest",
                    "gemini-1.0-pro",
                ]
                
                for name in model_names_to_try:
                    try:
                        # Try to create the model - if it fails, it doesn't exist
                        test_model = genai.GenerativeModel(name)
                        model_name = name
                        print(f"Using model: {model_name}")
                        break
                    except Exception as e:
                        print(f"Model {name} not available: {e}")
                        continue
            
            if not model_name:
                raise HTTPException(
                    status_code=503,
                    detail="No available Gemini models found. Please check your API key and model availability."
                )
            
            model = genai.GenerativeModel(model_name)
            prompt = system_instruction + "\nUSER:\n" + req.message
            response = model.generate_content(prompt)
            reply_text = (response.text or "").strip()
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

        if not reply_text:
            raise HTTPException(status_code=500, detail="Empty response from Gemini")

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
                    "content": reply_text,
                },
            ]).execute()
        except Exception as e:
            print(f"Warning: Failed to save chat history: {e}")
            # Don't fail the request if history save fails

        # Return the raw operations JSON string; frontend will parse and apply
        return {"operationsJson": reply_text}
    
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Unexpected error in chat endpoint: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

