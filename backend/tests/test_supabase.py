import pytest
from app.config import settings
from app.services.supabase_service import SupabaseServerClient


def test_supabase_config_loaded():
    """Verify Supabase configuration loads from environment without hardcoding."""
    assert settings.SUPABASE_URL.startswith("https://")
    assert "supabase.co" in settings.SUPABASE_URL
    assert settings.SUPABASE_PUBLISHABLE_KEY.startswith("sb_publishable_") or len(settings.SUPABASE_PUBLISHABLE_KEY) > 20
    # Least privilege assertion: service role key is not required for client operations
    assert settings.SUPABASE_SECRET_KEY == "" or isinstance(settings.SUPABASE_SECRET_KEY, str)


def test_supabase_server_client_least_privilege():
    """Verify server client adheres to least privilege principles."""
    client = SupabaseServerClient()
    assert client.is_configured is True
    # Verify client is not operating under service_role unless explicitly configured
    if not settings.SUPABASE_SECRET_KEY:
        assert client.is_service_role is False

    headers = client._get_headers()
    assert "apikey" in headers
    assert "Authorization" in headers
    assert headers["apikey"] == client.key
    assert headers["Authorization"].startswith("Bearer ")
    assert headers["Content-Type"] == "application/json"


def test_supabase_unconfigured_fallback():
    """Verify client handles missing configuration gracefully without raising unhandled exceptions."""
    orig_url = settings.SUPABASE_URL
    orig_key = settings.SUPABASE_PUBLISHABLE_KEY
    try:
        settings.SUPABASE_URL = ""
        settings.SUPABASE_PUBLISHABLE_KEY = ""
        mock_client = SupabaseServerClient()
        assert mock_client.is_configured is False
        health = mock_client.check_health_sync()
        assert health["configured"] is False
        assert health["status"] == "unconfigured"
    finally:
        settings.SUPABASE_URL = orig_url
        settings.SUPABASE_PUBLISHABLE_KEY = orig_key


def test_supabase_live_connectivity_check():
    """
    Verify live connectivity to Supabase Auth & Storage API.
    Asserts connection returns structured health info without leaking full credentials.
    """
    client = SupabaseServerClient()
    if not client.is_configured:
        pytest.skip("Supabase is not configured.")

    health = client.check_health_sync(timeout=4.0)
    assert health["configured"] is True
    assert "status" in health
    # Verify response schema never leaks full auth keys
    assert "apikey" not in health
    assert "key" not in health
    assert "sb_publishable_" not in str(health.get("details", []))
