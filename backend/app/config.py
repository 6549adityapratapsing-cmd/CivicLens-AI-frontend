import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment and .env files."""

    # AI Configuration
    # Supported providers: "gemini" (active production), "ollama" (local fallback)
    AI_PROVIDER: str = "gemini"

    # Gemini settings (Official Google Gen AI SDK)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Ollama settings (Local Google Gemma via Ollama API)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:1b"

    # Supabase settings (Optional backend cloud sync)
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    # Demo Mode & Safety Configuration
    # When DEMO_MODE=True, no real government APIs, emails, SMS, or webhooks can be called.
    DEMO_MODE: bool = True
    DEMO_NOTICE: str = (
        "DEMO MODE — No real government complaint has been submitted. "
        "All submissions and statuses are simulated."
    )
    DEMO_ADMIN_PASSWORD: str = "admin123"
    DEMO_CITIZEN_PASSWORD: str = "demo123"
    DEMO_CITIZEN2_PASSWORD: str = "demo123"
    DEMO_OFFICER_PASSWORD: str = "officer123"
    DEMO_ADMIN_TOKEN: str = "civiclens-demo-admin-token-7x9q"
    DEMO_CITIZEN_TOKEN: str = "civiclens-demo-citizen-token-3a2b"
    DEMO_CITIZEN2_TOKEN: str = "civiclens-demo-citizen2-token-4c7p"
    DEMO_OFFICER_TOKEN: str = "civiclens-demo-officer-token-9k4w"

    def assert_external_submission_blocked(self) -> None:
        """Safety barrier: Prevent any external government portal or notification calls in Demo Mode."""
        if self.DEMO_MODE:
            raise RuntimeError(
                "SAFETY BARRIER: External government submission is strictly disabled when DEMO_MODE=True. "
                "No live emails, SMS, or government API requests may be executed."
            )

    def dispatch_external_government_integration(self, payload: dict) -> None:
        """Attempts to invoke real external government webhook/API — blocked in Demo Mode."""
        self.assert_external_submission_blocked()

    # CORS settings - specify allowed origins comma-separated or as list
    # Supports FRONTEND_URL, CORS_ORIGINS, or ALLOWED_ORIGINS
    FRONTEND_URL: str = ""
    CORS_ORIGINS: str = ""
    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )

    # Security & upload constraints
    MAX_UPLOAD_SIZE_MB: int = 10
    AI_REQUEST_TIMEOUT_SECONDS: float = 45.0

    @property
    def cors_origins(self) -> List[str]:
        origins = [orig.strip() for orig in self.ALLOWED_ORIGINS.split(",") if orig.strip()]
        for extra in (self.FRONTEND_URL, self.CORS_ORIGINS):
            if extra and extra.strip():
                for item in extra.split(","):
                    clean = item.strip().rstrip("/")
                    if clean and clean not in origins:
                        origins.append(clean)
        return origins

    _backend_dir: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_config = SettingsConfigDict(
        env_file=(os.path.join(_backend_dir, ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
