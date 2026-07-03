"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolves to the `backend/` project root regardless of the process cwd
# (this file lives at backend/app/core/config.py).
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Central application settings.

    Values are read from environment variables first, falling back to a
    local `.env` file (see `backend/.env.example` for documented keys).
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "NailsSegmentationAI"
    API_V1_PREFIX: str = "/api"

    DATABASE_URL: str = "postgresql+psycopg://nails_user:nails_password@localhost:5432/nails_segmentation"

    SECRET_KEY: str = "change-me-to-a-long-random-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Path to the trained YOLOv8 segmentation weights. Relative paths are
    # resolved against the backend project root, not the process cwd.
    MODEL_PATH: str = "app/ml/weights/best.pt"
    MODEL_CONFIDENCE_THRESHOLD: float = 0.25
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        """Rewrite `postgres://`/`postgresql://` URLs (as provided by most hosting
        platforms, e.g. Railway) to explicitly use the psycopg3 driver, which is
        what's installed (`psycopg[binary]`), not the default psycopg2."""
        if value.startswith("postgres://"):
            return "postgresql+psycopg://" + value[len("postgres://") :]
        if value.startswith("postgresql://"):
            return "postgresql+psycopg://" + value[len("postgresql://") :]
        return value

    @property
    def MODEL_PATH_RESOLVED(self) -> Path:
        """Absolute path to the model weights file."""
        path = Path(self.MODEL_PATH)
        return path if path.is_absolute() else BACKEND_ROOT / path


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (avoids re-parsing env on every call)."""
    return Settings()


settings = get_settings()
