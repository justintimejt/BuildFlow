from supabase import create_client, Client
from .env import Env

supabase: Client = create_client(
    Env.SUPABASE_URL,
    Env.SUPABASE_SERVICE_ROLE_KEY,
)

