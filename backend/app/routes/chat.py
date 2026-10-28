from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.providers.factory import get_ai_provider

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def civic_chat(request: ChatRequest):
    """
    Chat assistant for civic issues, complaint follow-ups, RTI filing guidance,
    and municipal department escalation paths in English and Hindi.
    """
    provider = get_ai_provider()
    return await provider.chat(
        message=request.message,
        language=request.language,
        context=request.context,
        history=request.history,
    )
