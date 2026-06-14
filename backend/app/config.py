"""Configuration settings loaded from environment variables."""

from pydantic_settings import BaseSettings
import os

# Resolve paths relative to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    UPLOAD_DIR: str = os.path.join(BACKEND_DIR, "uploads")
    MAX_VIDEO_SIZE_MB: int = 100
    MAX_VIDEO_DURATION_SEC: int = 30
    TARGET_FPS: int = 30

    # Supabase (for production)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = os.path.join(BACKEND_DIR, ".env")
        extra = "allow"


settings = Settings()
