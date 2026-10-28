import io
from typing import Tuple
from PIL import Image
from fastapi import HTTPException, status

ALLOWED_MIME_TYPES = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/jpg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"],
    "image/gif": [b"GIF87a", b"GIF89a"],
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def validate_image_file(
    content: bytes,
    filename: str,
    content_type: str,
    max_size_mb: int = 10,
) -> Tuple[str, int, int]:
    """
    Validates uploaded image byte contents, file size, mime-type, and magic bytes.
    Returns (cleaned_mime_type, width, height).
    Raises HTTPException on validation failure.
    """
    # 1. Size check
    max_bytes = max_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image file size exceeds the {max_size_mb}MB limit. Uploaded size: {len(content) / (1024*1024):.2f}MB.",
        )

    # 2. Extension check (if filename provided)
    if filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext and ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file extension '{ext}'. Allowed extensions are: {', '.join(sorted(ALLOWED_EXTENSIONS))}.",
            )

    if len(content) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty or corrupted.",
        )

    # 3. MIME-type check
    normalized_mime = (content_type or "").lower().strip()
    if normalized_mime == "image/jpg":
        normalized_mime = "image/jpeg"

    if normalized_mime not in ALLOWED_MIME_TYPES:
        # Check by magic header signature fallback
        detected_mime = None
        for mime, sigs in ALLOWED_MIME_TYPES.items():
            for sig in sigs:
                if content.startswith(sig):
                    detected_mime = mime
                    break
            if detected_mime:
                break

        if detected_mime:
            normalized_mime = detected_mime
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported image type '{content_type}'. Please upload JPEG, PNG, WEBP, or GIF images.",
            )

    # 4. Integrity check via PIL
    try:
        with Image.open(io.BytesIO(content)) as img:
            img.verify()
        
        # Re-open to read dimensions since verify() closes image
        with Image.open(io.BytesIO(content)) as img:
            width, height = img.size
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded image is corrupt or cannot be decoded: {str(e)}",
        )

    return normalized_mime, width, height
