import io
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_service_health():
    """Verify GET /health returns 200 and correct service metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "civiclens-ai-backend"
    assert "version" in data
    assert "timestamp" in data


def test_ai_health():
    """Verify GET /api/health/ai returns structured health probe."""
    response = client.get("/api/health/ai")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "provider" in data
    assert "model" in data
    assert "configured" in data
    assert "details" in data


def test_analyze_empty_request_rejected():
    """Verify POST /api/analyze rejects empty input with 400 Bad Request."""
    response = client.post("/api/analyze", data={"category": "Pothole / Road Damage"})
    assert response.status_code == 400
    assert "Please provide at least an image or a text description" in response.json()["detail"]


def test_analyze_invalid_file_extension():
    """Verify POST /api/analyze rejects disallowed file types like .txt or .exe."""
    fake_file = io.BytesIO(b"fake executable content here")
    response = client.post(
        "/api/analyze",
        data={"category": "Pothole / Road Damage", "description": "Broken road"},
        files={"image": ("test.exe", fake_file, "application/octet-stream")},
    )
    assert response.status_code == 415
    assert "Unsupported file extension" in response.json()["detail"]


def test_analyze_unconfigured_or_missing_model_returns_clear_error():
    """
    CRITICAL REQUIREMENT:
    Verify that missing models or unconfigured providers return an explicit, actionable error,
    and DO NOT return fake AI output.
    """
    from PIL import Image

    img_byte_arr = io.BytesIO()
    image = Image.new("RGB", (100, 100), color=(73, 109, 137))
    image.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    response = client.post(
        "/api/analyze",
        data={"category": "Pothole / Road Damage", "description": "Large road crater", "model": "nonexistent_model_xyz"},
        files={"image": ("sample.png", img_byte_arr, "image/png")},
    )
    # When model is not found, Ollama returns 404, or 503 if unreachable, with clear diagnostic message
    assert response.status_code in [401, 404, 502, 503]
    detail = response.json().get("detail", "")
    assert ("Ollama" in detail) or ("Gemini" in detail) or ("model" in detail)


def test_list_models():
    """Verify GET /api/models returns provider and available models list."""
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "provider" in data
    assert "configured_model" in data
    assert "available_models" in data


def test_chat_empty_message_validation():
    """Verify POST /api/chat enforces message validation."""
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code == 422  # Pydantic validation error for min_length=1


def test_end_to_end_analysis_with_local_gemma():
    """Verify end-to-end analysis when using locally installed model like gemma3:1b."""
    models_resp = client.get("/api/models")
    installed = models_resp.json().get("available_models", [])
    if not installed:
        pytest.skip("No local models installed in Ollama.")

    target = installed[0]  # e.g., 'gemma3:1b'
    response = client.post(
        "/api/analyze",
        data={
            "category": "Pothole / Road Damage",
            "description": "Hazardous road crater on Sector 4 road",
            "model": target,
            "language": "en",
        },
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["category"]
    assert res_data["issue_title"]
    assert res_data["suggested_priority"] in ["Critical", "High", "Medium", "Low"]
    assert len(res_data["visible_evidence"]) > 0
    assert len(res_data["potential_impact"]) > 0
    assert res_data["complaint_draft"]["subject"]
    assert res_data["complaint_draft"]["body"]
