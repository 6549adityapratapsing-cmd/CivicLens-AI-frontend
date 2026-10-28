from abc import ABC, abstractmethod
from typing import Optional, List
from app.models.schemas import (
    CivicAnalysisResponse,
    ChatResponse,
    ChatMessage,
    AIHealthResponse,
)


class BaseAIProvider(ABC):
    """Abstract base class for all CivicLens AI inference providers."""

    @abstractmethod
    async def health_check(self) -> AIHealthResponse:
        """Check whether the AI provider is properly configured and reachable."""
        pass

    @abstractmethod
    async def analyze_civic_issue(
        self,
        image_bytes: Optional[bytes],
        mime_type: Optional[str],
        category: str,
        description: str,
        language: str = "en",
        model: Optional[str] = None,
    ) -> CivicAnalysisResponse:
        """Analyze civic evidence image and description, returning structured report."""
        pass

    @abstractmethod
    async def chat(
        self,
        message: str,
        language: str = "en",
        context: Optional[dict] = None,
        history: Optional[List[ChatMessage]] = None,
    ) -> ChatResponse:
        """Generate response for citizen civic inquiry."""
        pass
