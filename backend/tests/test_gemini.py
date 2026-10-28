import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.providers.gemini_provider import GeminiProvider, _sanitize_error
from app.models.schemas import ChatMessage


def test_sanitize_error_masks_key():
    test_key = "AQ.SecretApiKey12345"
    raw_error = f"Failed to call https://generativelanguage.googleapis.com/v1beta?key={test_key} with error"
    sanitized = _sanitize_error(raw_error, api_key=test_key)
    assert test_key not in sanitized
    assert "[REDACTED_API_KEY]" in sanitized or "[REDACTED_KEY]" in sanitized


def test_gemini_provider_init_from_settings():
    provider = GeminiProvider()
    assert provider.model in ["gemini-3.5-flash-lite", "gemini-3.8-flash"]
    assert "gemini-3.5-flash-lite" in provider.SUPPORTED_MODELS
    assert "gemini-3.8-flash" in provider.SUPPORTED_MODELS


def test_gemini_missing_key_raises_503():
    provider = GeminiProvider(api_key="")
    with pytest.raises(HTTPException) as exc_info:
        provider._get_client()
    assert exc_info.value.status_code == 503
    assert "GEMINI_API_KEY" in exc_info.value.detail


def test_gemini_parse_chat_response():
    provider = GeminiProvider(api_key="mock_key")
    raw_text = (
        "Here is what you should do regarding the broken streetlight.\n\n"
        'SUGGESTED_QUESTIONS: ["How do I track this complaint?", "Who is the nodal officer?"]'
    )
    reply, questions = provider._parse_chat_response(raw_text, language="en")
    assert "Here is what you should do" in reply
    assert len(questions) == 2
    assert "How do I track this complaint?" in questions


def test_gemini_format_response_fallback_and_priority():
    provider = GeminiProvider(api_key="mock_key")
    sample_data = {
        "category": "Pothole / Road Damage",
        "issue_title": "Deep Crater on Ring Road",
        "summary": "Dangerous road crater observed.",
        "visible_evidence": ["1.2m asphalt depression"],
        "potential_impact": ["Accident hazard for two-wheelers"],
        "suggested_priority": "CRITICAL",
        "priority_reasoning": "High-speed road with deep impact zone.",
        "responsible_department": "Public Works Department (PWD)",
        "next_steps": ["Erect hazard sign", "File complaint with ward officer"],
        "complaint_draft": {
            "subject": "Urgent Pothole Repair Required",
            "to_authority": "Executive Engineer, PWD",
            "body": "Respected Sir, please repair the pothole.",
            "recommended_portal": "CPGRAMS",
        },
    }

    res = provider._format_response(
        data=sample_data,
        category="Pothole / Road Damage",
        description="Near sector 5",
        language="en",
        model_used="gemini-3.5-flash-lite",
    )

    assert res.suggested_priority == "Critical"
    assert res.ai_provider == "gemini"
    assert res.model_used == "gemini-3.5-flash-lite"
    assert res.category == "Pothole / Road Damage"
    assert res.responsible_department == "Public Works Department (PWD)"
    assert res.complaint_draft.subject == "Urgent Pothole Repair Required"


def test_gemini_format_response_department_fallback():
    provider = GeminiProvider(api_key="mock_key")
    # Empty department triggers intelligent fallback from departments service
    sample_data = {
        "category": "Streetlight / Electrical Hazard",
        "issue_title": "Flickering Streetlight",
        "summary": "Dark street at night",
        "responsible_department": "",
        "suggested_priority": "Medium",
    }
    res = provider._format_response(
        data=sample_data,
        category="Streetlight / Electrical Hazard",
        description="Broken lamp pole",
        language="en",
        model_used="gemini-3.5-flash-lite",
    )
    assert "Electricity" in res.responsible_department or "Streetlighting" in res.responsible_department
