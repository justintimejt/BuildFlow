import os
from dotenv import load_dotenv

load_dotenv()

class Env:
    PORT: int = int(os.getenv("PORT", "4000"))
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    GEMINI_API_KEY: str = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()

    @classmethod
    def validate(cls) -> None:
        missing = []
        if not cls.SUPABASE_URL or cls.SUPABASE_URL == "":
            missing.append("SUPABASE_URL")
        elif not cls.SUPABASE_URL.startswith("http"):
            raise RuntimeError(f"Invalid SUPABASE_URL format: must start with http:// or https://")
        if not cls.SUPABASE_SERVICE_ROLE_KEY:
            missing.append("SUPABASE_SERVICE_ROLE_KEY")
        if not cls.GEMINI_API_KEY:
            missing.append("GOOGLE_GEMINI_API_KEY")
        if missing:
            raise RuntimeError(f"Missing environment variables: {', '.join(missing)}. Check your backend/.env file.")

# Only validate if env vars are actually needed (don't fail at import time if optional)
# Env.validate()  # Commented out - validate on demand instead

