import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import HTTPException, status
from app.config import settings
from app.models.schemas import (
    CivicAnalysisResponse,
    ChatResponse,
    ChatMessage,
    AIHealthResponse,
    ComplaintDraft,
    PriorityLevel,
)
from app.providers.base import BaseAIProvider
from app.services.departments import match_department
from app.services.prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    build_analysis_user_prompt,
    CHAT_SYSTEM_PROMPT,
)


def _sanitize_error(error_msg: str, api_key: str = "") -> str:
    """Mask any API key or credential string from error messages to prevent leakage."""
    cleaned = str(error_msg)
    if api_key and len(api_key) > 5 and api_key in cleaned:
        cleaned = cleaned.replace(api_key, "[REDACTED_API_KEY]")
    cleaned = re.sub(r"key=[a-zA-Z0-9_\-]+", "key=[REDACTED_KEY]", cleaned)
    cleaned = re.sub(r"Bearer\s+[a-zA-Z0-9_\-\.]+", "Bearer [REDACTED_TOKEN]", cleaned)
    return cleaned


class GeminiProvider(BaseAIProvider):
    """
    CivicLens AI Provider using the official Google Gen AI SDK (google-genai).
    Supports Gemini multimodal visual inspection, structured output, and high-demand resilience.
    """

    SUPPORTED_MODELS = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.1-pro-preview",
    ]

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = (
            api_key if api_key is not None else (settings.GEMINI_API_KEY or "")
        ).strip()
        self.model = (
            model if model is not None else (settings.GEMINI_MODEL or "gemini-3.5-flash-lite")
        ).strip()
        self._cached_client = None

    def _get_client(self):
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Gemini API key is not configured. "
                    "Please set GEMINI_API_KEY in backend/.env or your deployment environment. "
                    "You can obtain a key at https://aistudio.google.com/."
                ),
            )
        if self._cached_client is not None:
            return self._cached_client

        try:
            from google import genai
            self._cached_client = genai.Client(api_key=self.api_key)
            return self._cached_client
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The 'google-genai' SDK is not installed in the backend Python environment.",
            )

    async def health_check(self) -> AIHealthResponse:
        """Verify API key existence and test model connectivity with a lightweight ping."""
        if not self.api_key:
            return AIHealthResponse(
                status="degraded",
                provider="gemini",
                model=self.model,
                configured=False,
                details="GEMINI_API_KEY is not set in backend environment.",
                actionable_tip="Add GEMINI_API_KEY to your backend/.env file from https://aistudio.google.com/.",
                available_models=self.SUPPORTED_MODELS,
            )

        try:
            client = self._get_client()

            def _test_call(target_model: str):
                return client.models.generate_content(
                    model=target_model,
                    contents="Respond with 'ok'.",
                )

            try:
                await asyncio.wait_for(
                    asyncio.to_thread(_test_call, self.model),
                    timeout=10.0,
                )
                connected_model = self.model
            except Exception as first_exc:
                err_text = str(first_exc)
                if ("503" in err_text or "high demand" in err_text) and self.model != "gemini-3.5-flash-lite":
                    # Cloud overload on primary model; test high-throughput flash-lite
                    await asyncio.wait_for(
                        asyncio.to_thread(_test_call, "gemini-3.5-flash-lite"),
                        timeout=10.0,
                    )
                    connected_model = f"{self.model} (auto-fallback to gemini-3.5-flash-lite active)"
                else:
                    raise first_exc

            return AIHealthResponse(
                status="healthy",
                provider="gemini",
                model=self.model,
                configured=True,
                details=f"Connected to Google Gemini API using model '{connected_model}'.",
                actionable_tip=None,
                available_models=self.SUPPORTED_MODELS,
            )
        except asyncio.TimeoutError:
            return AIHealthResponse(
                status="degraded",
                provider="gemini",
                model=self.model,
                configured=True,
                details="Timeout reaching Google Gemini API (over 10s).",
                actionable_tip="Check your internet connection or proxy settings.",
                available_models=self.SUPPORTED_MODELS,
            )
        except Exception as exc:
            err_msg = _sanitize_error(str(exc), self.api_key)
            if "API_KEY_INVALID" in err_msg or "API key not valid" in err_msg:
                tip = "Your GEMINI_API_KEY appears invalid. Please verify the key at https://aistudio.google.com/."
            elif "RESOURCE_EXHAUSTED" in err_msg or "Quota exceeded" in err_msg:
                tip = "Your Gemini API quota or rate limit has been exceeded. Please check Google AI Studio quotas."
            else:
                tip = "Verify internet access and ensure GEMINI_API_KEY has active quota at Google AI Studio."

            return AIHealthResponse(
                status="error",
                provider="gemini",
                model=self.model,
                configured=True,
                details=f"Gemini API check failed: {err_msg}",
                actionable_tip=tip,
                available_models=self.SUPPORTED_MODELS,
            )

    async def analyze_civic_issue(
        self,
        image_bytes: Optional[bytes],
        mime_type: Optional[str],
        category: str,
        description: str,
        language: str = "en",
        model: Optional[str] = None,
    ) -> CivicAnalysisResponse:
        client = self._get_client()
        from google.genai import types

        target_model = (model or self.model).strip()
        user_prompt = build_analysis_user_prompt(category, description, language)

        contents = []
        # Add multimodal visual evidence if available
        if image_bytes and mime_type:
            contents.append(
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type,
                )
            )
        contents.append(user_prompt)

        def _call_gemini(m: str):
            return client.models.generate_content(
                model=m,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=ANALYSIS_SYSTEM_PROMPT,
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )

        try:
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(_call_gemini, target_model),
                    timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                )
            except Exception as primary_exc:
                err_check = str(primary_exc)
                if ("503" in err_check or "high demand" in err_check or "UNAVAILABLE" in err_check) and target_model != "gemini-3.5-flash-lite":
                    # Resilient fallback: auto-switch to gemini-3.5-flash-lite during cloud overload spikes
                    target_model = "gemini-3.5-flash-lite"
                    response = await asyncio.wait_for(
                        asyncio.to_thread(_call_gemini, target_model),
                        timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                    )
                else:
                    raise primary_exc
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Gemini analysis timed out after {settings.AI_REQUEST_TIMEOUT_SECONDS}s. Please retry.",
            )
        except Exception as exc:
            err_str = _sanitize_error(str(exc), self.api_key)
            if "API_KEY_INVALID" in err_str or "API key not valid" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid GEMINI_API_KEY. Please verify your API key in backend/.env.",
                )
            if "RESOURCE_EXHAUSTED" in err_str or "Quota exceeded" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini API rate limit or quota exceeded. Please wait a moment before retrying.",
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Google Gemini API error: {err_str}",
            )

        raw_text = getattr(response, "text", "") or ""
        parsed_data = self._extract_json(raw_text)

        return self._format_response(
            parsed_data,
            category=category,
            description=description,
            language=language,
            model_used=target_model,
        )

    async def chat(
        self,
        message: str,
        language: str = "en",
        context: Optional[dict] = None,
        history: Optional[List[ChatMessage]] = None,
    ) -> ChatResponse:
        client = self._get_client()
        from google.genai import types

        context_prompt = ""
        if context:
            context_prompt = (
                f"\nActive Civic Issue Context:\n"
                f"- Category: {context.get('category', 'N/A')}\n"
                f"- Title: {context.get('issue_title', 'N/A')}\n"
                f"- Priority: {context.get('suggested_priority', 'N/A')}\n"
                f"- Department: {context.get('responsible_department', 'N/A')}\n"
            )

        system_instruction = CHAT_SYSTEM_PROMPT + context_prompt

        # Construct contents with multi-turn conversation history
        contents: List[types.Content] = []
        if history:
            for msg in history[-6:]:  # Keep recent turns for context
                role = "user" if msg.role == "user" else "model"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.content)],
                    )
                )

        chat_input = (
            f"User Language: {'Hindi (हिन्दी)' if language == 'hi' else 'English'}\n"
            f"User Question: {message}\n"
            "Respond helpfully and list 2-3 suggested follow-up questions at the very end marked with 'SUGGESTED_QUESTIONS:' as JSON array."
        )
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=chat_input)],
            )
        )

        def _call_chat(m: str):
            return client.models.generate_content(
                model=m,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.4,
                ),
            )

        active_chat_model = self.model
        try:
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(_call_chat, active_chat_model),
                    timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                )
            except Exception as primary_exc:
                err_check = str(primary_exc)
                if ("503" in err_check or "high demand" in err_check or "UNAVAILABLE" in err_check) and active_chat_model != "gemini-3.5-flash-lite":
                    active_chat_model = "gemini-3.5-flash-lite"
                    response = await asyncio.wait_for(
                        asyncio.to_thread(_call_chat, active_chat_model),
                        timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                    )
                else:
                    raise primary_exc
        except Exception as exc:
            err_clean = _sanitize_error(str(exc), self.api_key)
            if "API_KEY_INVALID" in err_clean or "API key not valid" in err_clean:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid GEMINI_API_KEY. Please verify your API key in backend/.env.",
                )
            if "RESOURCE_EXHAUSTED" in err_clean or "Quota exceeded" in err_clean:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini API quota exceeded. Please wait a moment before retrying.",
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini chat error: {err_clean}",
            )

        raw_text = getattr(response, "text", "") or ""
        reply, suggested = self._parse_chat_response(raw_text, language)

        return ChatResponse(
            reply=reply,
            suggested_questions=suggested,
            provider="gemini",
            model=active_chat_model,
        )

    def _extract_json(self, raw_text: str) -> Dict[str, Any]:
        """Extract and parse JSON safely from model response."""
        text = raw_text.strip()
        # Remove markdown fences if present
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback regex bracket match
            match = re.search(r"(\{.*\})", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Model response was not in valid JSON format. Please retry.",
            )

    def _format_response(
        self,
        data: Dict[str, Any],
        category: str,
        description: str,
        language: str,
        model_used: str,
    ) -> CivicAnalysisResponse:
        # Determine responsible department with fallback to deterministic service
        resp_dept = data.get("responsible_department")
        if not resp_dept or resp_dept.strip() in ("", "N/A", "Unknown"):
            match_res = match_department(category, description)
            resp_dept = match_res.matched_department.name

        # Normalize priority
        raw_prio = str(data.get("suggested_priority", "Medium")).strip().capitalize()
        priority: PriorityLevel = "Medium"
        if raw_prio in ("Critical", "High", "Medium", "Low"):
            priority = raw_prio  # type: ignore

        complaint_dict = data.get("complaint_draft") or {}
        draft = ComplaintDraft(
            subject=complaint_dict.get(
                "subject", f"Grievance Report Regarding {category or 'Civic Concern'}"
            ),
            to_authority=complaint_dict.get(
                "to_authority", f"The Executive Engineer / Commissioner, {resp_dept}"
            ),
            body=complaint_dict.get(
                "body",
                "Dear Authority,\n\nI am writing to report a serious civic concern at [Location]. "
                "Please inspect and remediate urgently.\n\nSincerely,\n[Citizen Name]\n[Contact]",
            ),
            recommended_portal=complaint_dict.get(
                "recommended_portal", "Local Nagar Nigam Portal / CPGRAMS / Swachhata App"
            ),
        )

        return CivicAnalysisResponse(
            analysis_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            language="hi" if language == "hi" else "en",
            category=data.get("category", category or "Civic Issue"),
            issue_title=data.get("issue_title", "Civic Grievance Report"),
            summary=data.get("summary", "Analysis completed based on submitted evidence."),
            visible_evidence=data.get("visible_evidence", ["Visual evidence analyzed from submission"]),
            potential_impact=data.get("potential_impact", ["Public convenience & safety hazard"]),
            suggested_priority=priority,
            priority_reasoning=data.get(
                "priority_reasoning", "Assigned based on visible impact and public safety assessment."
            ),
            responsible_department=resp_dept,
            next_steps=data.get(
                "next_steps",
                [
                    "Take geotagged photos if safe",
                    "Submit formal grievance via local municipal portal",
                ],
            ),
            complaint_draft=draft,
            ai_provider="gemini",
            model_used=model_used,
            disclaimer=(
                "AI-generated findings are preliminary suggestions to assist citizens and municipal authorities, "
                "not an official municipal inspection report."
            ),
        )

    def _parse_chat_response(self, text: str, language: str) -> tuple[str, List[str]]:
        split_pattern = r"SUGGESTED_QUESTIONS:\s*(\[.*\])"
        match = re.search(split_pattern, text, re.DOTALL)
        if match:
            clean_reply = text[: match.start()].strip()
            try:
                questions = json.loads(match.group(1))
                if isinstance(questions, list):
                    return clean_reply, [str(q) for q in questions[:3]]
            except Exception:
                pass
            return clean_reply, self._default_suggested_questions(language)

        return text.strip(), self._default_suggested_questions(language)

    def _default_suggested_questions(self, language: str) -> List[str]:
        if language == "hi":
            return [
                "नगर निगम में शिकायत की स्थिति कैसे ट्रैक करें?",
                "यदि 15 दिनों में कार्रवाई न हो तो आरटीआई (RTI) कैसे दाखिल करें?",
                "क्या इस समस्या के लिए आपातकालीन हेल्पलाइन नंबर है?",
            ]
        return [
            "How do I track my complaint status on the municipal portal?",
            "How do I file an RTI if no action is taken within 15 days?",
            "What are the emergency contact helplines for this department?",
        ]
