"""
config.py
─────────
Central configuration loaded from environment variables.
Uses pydantic-settings so every missing required var raises an error
at startup — fail fast rather than fail silently at runtime.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────
    DATABASE_URL: str 

    # ── Embedding model ──────────────────────────────────────────────────────
    EMBEDDING_MODEL: str 
    EMBEDDING_DIM: int         

    # ── Service ──────────────────────────────────────────────────────────────
    HOST: str 
    PORT: int 
    LOG_LEVEL: str 

    # ── Security ─────────────────────────────────────────────────────────────
    # Simple shared secret between Node.js backend and this service.
    # Set the same value in both .env files.
    API_KEY: str 

    # ── Top-K defaults ───────────────────────────────────────────────────────
    DEFAULT_TOP_K: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = True  # DATABASE_URL ≠ database_url


@lru_cache()           # singleton — parse .env only once per process
def get_settings() -> Settings:
    return Settings()