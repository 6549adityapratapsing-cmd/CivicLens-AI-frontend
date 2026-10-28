from datetime import datetime, timezone
from fastapi import APIRouter
from app.models.schemas import HealthResponse, AIHealthResponse
from app.providers.factory import get_ai_provider
from app.services.supabase_service import supabase_server

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse)
async def service_health():
    """Liveness probe endpoint for hosting services like Render."""
    return HealthResponse(
        status="ok",
        service="civiclens-ai-backend",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/api/health/ai", response_model=AIHealthResponse)
async def ai_provider_health():
    """Readiness probe checking connectivity to the active AI provider (Ollama or Gemini)."""
    provider = get_ai_provider()
    return await provider.health_check()


@router.get("/api/models")
async def list_available_models():
    """Returns the active provider, configured model, and locally installed models."""
    provider = get_ai_provider()
    health = await provider.health_check()
    return {
        "provider": health.provider,
        "configured_model": health.model,
        "available_models": health.available_models or [],
    }


@router.get("/api/health/supabase")
async def supabase_health():
    """Readiness probe checking server-side connectivity to Supabase without exposing credentials."""
    return await supabase_server.check_health()

