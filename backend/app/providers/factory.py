from fastapi import HTTPException, status
from app.config import settings
from app.providers.base import BaseAIProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider


def get_ai_provider() -> BaseAIProvider:
    """
    Returns the configured AI provider instance based on AI_PROVIDER environment variable.
    Does NOT silently switch providers. If configured provider fails, returns explicit error.
    """
    provider_name = (settings.AI_PROVIDER or "gemini").lower().strip()

    if provider_name == "gemini":
        return GeminiProvider()
    elif provider_name == "ollama":
        return OllamaProvider()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unknown AI_PROVIDER '{settings.AI_PROVIDER}'. "
                "Supported providers are 'gemini' (cloud recommended) and 'ollama' (local development)."
            ),
        )
