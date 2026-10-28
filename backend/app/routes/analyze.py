from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.config import settings
from app.models.schemas import CivicAnalysisResponse
from app.providers.factory import get_ai_provider
from app.services.image_validator import validate_image_file

router = APIRouter(prefix="/api", tags=["Analysis"])


@router.post("/analyze", response_model=CivicAnalysisResponse)
async def analyze_issue(
    image: Optional[UploadFile] = File(None),
    category: str = Form("General Civic Issue"),
    description: Optional[str] = Form(""),
    language: str = Form("en"),
    location: Optional[str] = Form(""),
    model: Optional[str] = Form(None),
):
    """
    Analyzes an uploaded civic issue photo and/or description.
    Extracts visible evidence, identifies responsible departments, computes priority,
    and generates an actionable formal complaint draft in English or Hindi.
    """
    clean_lang = (language or "en").lower().strip()
    if clean_lang not in ("en", "hi"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported language. Allowed languages are 'en' (English) and 'hi' (Hindi).",
        )

    # Require either image or description
    if not image and (not description or not description.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least an image or a text description of the civic issue.",
        )

    image_bytes: Optional[bytes] = None
    mime_type: Optional[str] = None

    if image and image.filename:
        raw_bytes = await image.read()
        if len(raw_bytes) > 0:
            mime_type, width, height = validate_image_file(
                content=raw_bytes,
                filename=image.filename,
                content_type=image.content_type or "",
                max_size_mb=settings.MAX_UPLOAD_SIZE_MB,
            )
            image_bytes = raw_bytes

    # Combine description and location if location was provided
    full_description = (description or "").strip()
    if location and location.strip():
        loc_str = f"Location Landmark / Area: {location.strip()}"
        full_description = f"{full_description}\n{loc_str}" if full_description else loc_str

    provider = get_ai_provider()
    return await provider.analyze_civic_issue(
        image_bytes=image_bytes,
        mime_type=mime_type,
        category=category,
        description=full_description,
        language=clean_lang,
        model=model,
    )
