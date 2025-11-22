from supabase import create_client, Client
from .env import Env
from typing import Optional

# Validate environment variables before creating client
try:
    Env.validate()
    supabase: Optional[Client] = create_client(
        Env.SUPABASE_URL,
        Env.SUPABASE_SERVICE_ROLE_KEY,
    )
except (RuntimeError, Exception) as e:
    print(f"⚠️  Warning: Failed to initialize Supabase client: {e}")
    print(f"   The backend will work, but chat/backend features requiring Supabase will not function.")
    print(f"   To fix: Create backend/.env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    supabase: Optional[Client] = None

