from typing import Optional, Dict, Any
import httpx
from app.config import settings


class SupabaseServerClient:
    """
    Server-side Supabase client using least-privilege principles.
    Uses the publishable key by default for queries subject to RLS,
    and only utilizes service_role keys when strictly configured for administrative maintenance.
    """

    def __init__(self):
        self.url = (settings.SUPABASE_URL or "").strip().rstrip("/")
        # Minimum required privilege: prefer publishable key, fallback to secret key if only secret is set
        self.key = (settings.SUPABASE_PUBLISHABLE_KEY or settings.SUPABASE_SECRET_KEY or "").strip()
        self.is_service_role = bool(settings.SUPABASE_SECRET_KEY and self.key == settings.SUPABASE_SECRET_KEY)

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.key and self.url.startswith("https://"))

    def _get_headers(self, custom_token: Optional[str] = None) -> Dict[str, str]:
        bearer = custom_token or self.key
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {bearer}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def check_health(self) -> Dict[str, Any]:
        """
        Tests connectivity to Supabase Auth and PostgREST endpoints.
        Safely identifies whether tables/buckets are provisioned without altering any data.
        """
        if not self.is_configured:
            return {
                "configured": False,
                "status": "unconfigured",
                "details": "SUPABASE_URL or publishable key not set in environment.",
                "tables_detected": False,
                "bucket_detected": False,
            }

        result = {
            "configured": True,
            "status": "connected",
            "project_url": self.url,
            "key_type": "service_role" if self.is_service_role else "publishable",
            "auth_service": "unknown",
            "tables_detected": False,
            "bucket_detected": False,
            "details": [],
        }

        # 1. Verify Auth Service Health
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                auth_res = await client.get(
                    f"{self.url}/auth/v1/health",
                    headers=self._get_headers(),
                )
                if auth_res.status_code == 200:
                    result["auth_service"] = "healthy"
                else:
                    result["auth_service"] = f"http_{auth_res.status_code}"
                    result["details"].append(f"Auth health returned HTTP {auth_res.status_code}")
        except Exception as exc:
            result["auth_service"] = "error"
            result["details"].append(f"Auth endpoint connection error: {str(exc)}")

        # 2. Check Storage Buckets
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                bucket_res = await client.get(
                    f"{self.url}/storage/v1/bucket",
                    headers=self._get_headers(),
                )
                if bucket_res.status_code == 200:
                    buckets = bucket_res.json()
                    bucket_names = [b.get("id") or b.get("name") for b in buckets if isinstance(b, dict)]
                    result["bucket_detected"] = "civic_media" in bucket_names
                    result["available_buckets"] = bucket_names
                else:
                    result["details"].append(f"Storage query returned HTTP {bucket_res.status_code}")
        except Exception as exc:
            result["details"].append(f"Storage check error: {str(exc)}")

        # 3. Check civic_reports table via PostgREST
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                table_res = await client.get(
                    f"{self.url}/rest/v1/civic_reports?select=id&limit=1",
                    headers=self._get_headers(),
                )
                if table_res.status_code == 200:
                    result["tables_detected"] = True
                elif table_res.status_code == 404:
                    result["tables_detected"] = False
                    result["details"].append("civic_reports table not yet found in schema (migration pending).")
                else:
                    result["details"].append(f"Table probe returned HTTP {table_res.status_code}")
        except Exception as exc:
            result["details"].append(f"Database query error: {str(exc)}")

        return result

    def check_health_sync(self, timeout: float = 3.0) -> Dict[str, Any]:
        """Synchronous version for unit tests and health probes."""
        if not self.is_configured:
            return {
                "configured": False,
                "status": "unconfigured",
                "details": "SUPABASE_URL or publishable key not set in environment.",
                "tables_detected": False,
                "bucket_detected": False,
            }

        result = {
            "configured": True,
            "status": "connected",
            "project_url": self.url,
            "key_type": "service_role" if self.is_service_role else "publishable",
            "auth_service": "unknown",
            "tables_detected": False,
            "bucket_detected": False,
            "details": [],
        }

        try:
            with httpx.Client(timeout=timeout) as client:
                res = client.get(f"{self.url}/auth/v1/health", headers=self._get_headers())
                if res.status_code == 200:
                    result["auth_service"] = "healthy"
                else:
                    result["auth_service"] = f"http_{res.status_code}"
        except Exception as exc:
            result["auth_service"] = "error"
            result["details"].append(f"Connection error: {str(exc)}")

        return result


supabase_server = SupabaseServerClient()
