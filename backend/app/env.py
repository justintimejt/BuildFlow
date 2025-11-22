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

