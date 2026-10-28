"""
CivicLens AI — Application Entrypoint Module.
Supports both `uvicorn app.main:app` and `uvicorn main:app`.
"""
from main import app  # noqa: F401

__all__ = ["app"]
