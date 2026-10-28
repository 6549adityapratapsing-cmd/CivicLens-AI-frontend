import base64
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

import httpx
from fastapi import HTTPException, status
from app.config import settings
from app.models.schemas import (
    CivicAnalysisResponse,
    ChatResponse,
    ChatMessage,
    AIHealthResponse,
    ComplaintDraft,
)
from app.providers.base import BaseAIProvider
from app.services.prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    build_analysis_user_prompt,
    CHAT_SYSTEM_PROMPT,
)


class OllamaProvider(BaseAIProvider):
    """
    CivicLens AI Provider using local or remote Ollama server.
    Supports Gemma 2 (gemma2:2b, gemma2:9b) and vision models (llama3.2-vision, llava).
    """

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL or "http://localhost:11434").rstrip("/")
        self.model = (model or settings.OLLAMA_MODEL or "gemma3:1b").strip()

    async def health_check(self) -> AIHealthResponse:
        """Ping Ollama tags endpoint and verify model availability."""
        url = f"{self.base_url}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)

            if res.status_code != 200:
                return AIHealthResponse(
                    status="degraded",
                    provider="ollama",
                    model=self.model,
                    configured=True,
                    details=f"Ollama server responded with HTTP {res.status_code}.",
                    actionable_tip="Check Ollama logs on the host machine.",
                    available_models=[],
                )

            data = res.json()
            models_list = [m.get("name", "") for m in data.get("models", [])]
            # Match model name with or without tag suffix (e.g., 'gemma3:1b' or 'gemma3')
            has_model = any(
                self.model == m or self.model in m or m.startswith(self.model.split(":")[0])
                for m in models_list
            )

            if not has_model:
                return AIHealthResponse(
                    status="degraded",
                    provider="ollama",
                    model=self.model,
                    configured=True,
                    details=(
                        f"Ollama is running at {self.base_url}, but configured model '{self.model}' is not installed. "
                        f"Available models: {', '.join(models_list) if models_list else 'None'}."
                    ),
                    actionable_tip=f"Run 'ollama pull {self.model}' in your terminal to download the model, or select an installed model.",
                    available_models=models_list,
                )

            return AIHealthResponse(
                status="healthy",
                provider="ollama",
                model=self.model,
                configured=True,
                details=f"Connected to Ollama at {self.base_url}. Model '{self.model}' is ready.",
                actionable_tip=None,
                available_models=models_list,
            )

        except httpx.ConnectError:
            is_localhost = "localhost" in self.base_url or "127.0.0.1" in self.base_url
            tip = (
                "Ensure Ollama is installed and running (`ollama serve`). "
                + (
                    "Note: If running on a cloud host (like Render), localhost:11434 cannot reach your computer. "
                    "Use AI_PROVIDER=gemini for cloud deployments or configure a publicly accessible Ollama URL."
                    if is_localhost
                    else "Verify the OLLAMA_BASE_URL host is reachable."
                )
            )
            return AIHealthResponse(
                status="error",
                provider="ollama",
                model=self.model,
                configured=False,
                details=f"Could not connect to Ollama at {self.base_url}.",
                actionable_tip=tip,
            )
        except Exception as exc:
            return AIHealthResponse(
                status="error",
                provider="ollama",
                model=self.model,
                configured=False,
                details=f"Error checking Ollama status: {str(exc)}",
                actionable_tip="Verify network connectivity and OLLAMA_BASE_URL.",
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
        target_model = (model or self.model or "gemma3:1b").strip()
        user_prompt = build_analysis_user_prompt(category, description, language)

        messages = [
            {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

        # If image is attached, attach base64 in Ollama chat message format
        if image_bytes:
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            messages[-1]["images"] = [b64_img]

        payload = {
            "model": target_model,
            "messages": messages,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.2,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=settings.AI_REQUEST_TIMEOUT_SECONDS) as client:
                res = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Unable to connect to Ollama at {self.base_url}. "
                    "Please ensure Ollama is installed and running (`ollama serve`)."
                ),
            )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=(
                    f"Ollama model '{target_model}' timed out after {settings.AI_REQUEST_TIMEOUT_SECONDS}s. "
                    "Please retry or select a lighter installed model."
                ),
            )

        # Handle Model Not Found gracefully
        if res.status_code == 404 or "not found" in res.text.lower():
            installed = []
            try:
                async with httpx.AsyncClient(timeout=3.0) as c:
                    tag_res = await c.get(f"{self.base_url}/api/tags")
                    if tag_res.status_code == 200:
                        installed = [m.get("name", "") for m in tag_res.json().get("models", [])]
            except Exception:
                pass
            installed_hint = (
                f" Currently installed models in Ollama: {', '.join(installed)}."
                if installed
                else " No models currently found in local Ollama."
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Configured Ollama model '{target_model}' is not installed.{installed_hint} "
                    f"Please run 'ollama pull {target_model}' in your terminal, or select an installed model."
                ),
            )

        used_text_fallback = False
        # Gracefully handle multimodal/image rejection on text-only Gemma models
        if res.status_code != 200:
            err_body = res.text
            err_lower = err_body.lower()
            if (
                "multimodal" in err_lower
                or "does not support images" in err_lower
                or "does not support image" in err_lower
                or "vision" in err_lower
                or ("support" in err_lower and ("image" in err_lower or "multimodal" in err_lower))
            ):
                used_text_fallback = True
                messages[-1].pop("images", None)
                augmented_prompt = (
                    f"{user_prompt}\n\n[Visual Attachment Context: Citizen provided an uploaded photo "
                    f"({mime_type or 'image/png'}, {len(image_bytes) if image_bytes else 0} bytes). "
                    f"Active model '{target_model}' runs in text mode in Ollama. "
                    "Analyze the civic problem thoroughly using the provided category, location notes, and context. "
                    "Note in visible evidence that visual attachment was submitted.]"
                )
                messages[-1]["content"] = augmented_prompt
                payload["messages"] = messages

                try:
                    async with httpx.AsyncClient(timeout=settings.AI_REQUEST_TIMEOUT_SECONDS) as client:
                        res = await client.post(
                            f"{self.base_url}/api/chat",
                            json=payload,
                        )
                except httpx.ConnectError:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Unable to connect to Ollama at {self.base_url}.",
                    )
                except httpx.TimeoutException:
                    raise HTTPException(
                        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                        detail=f"Ollama request to '{target_model}' timed out.",
                    )

        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Ollama error (HTTP {res.status_code}): {res.text}",
            )

        res_json = res.json()
        raw_content = res_json.get("message", {}).get("content", "")
        parsed_data = self._extract_json(raw_content)

        return self._format_response(
            parsed_data,
            fallback_category=category,
            language=language,
            model_used=target_model,
            text_fallback=used_text_fallback,
        )

    async def chat(
        self,
        message: str,
        language: str = "en",
        context: Optional[dict] = None,
        history: Optional[List[ChatMessage]] = None,
    ) -> ChatResponse:
        context_prompt = ""
        if context:
            context_prompt = (
                f"\nActive Civic Issue Context:\n"
                f"- Category: {context.get('category', 'N/A')}\n"
                f"- Title: {context.get('issue_title', 'N/A')}\n"
                f"- Priority: {context.get('suggested_priority', 'N/A')}\n"
                f"- Department: {context.get('responsible_department', 'N/A')}\n"
            )

        system_content = CHAT_SYSTEM_PROMPT + context_prompt

        messages = [{"role": "system", "content": system_content}]
        if history:
            for item in history[-6:]:  # Keep recent context
                messages.append({"role": item.role, "content": item.content})

        chat_input = (
            f"User Language: {'Hindi (हिन्दी)' if language == 'hi' else 'English'}\n"
            f"User Question: {message}\n"
            "Respond helpfully and list 2-3 suggested follow-up questions at the very end marked with 'SUGGESTED_QUESTIONS:' as JSON array."
        )
        messages.append({"role": "user", "content": chat_input})

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.4},
        }

        try:
            async with httpx.AsyncClient(timeout=settings.AI_REQUEST_TIMEOUT_SECONDS) as client:
                res = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot reach Ollama at {self.base_url}. Ensure Ollama is running.",
            )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Ollama chat timed out.",
            )

        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Ollama chat error (HTTP {res.status_code}): {res.text}",
            )

        raw_text = res.json().get("message", {}).get("content", "")
        reply, suggested = self._parse_chat_response(raw_text, language)

        return ChatResponse(
            reply=reply,
            suggested_questions=suggested,
            provider="ollama",
            model=self.model,
        )

    def _extract_json(self, raw_text: str) -> Dict[str, Any]:
        text = raw_text.strip()
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
            match = re.search(r"(\{.*\})", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Ollama model did not return valid JSON formatting. Please retry.",
            )

    def _format_response(
        self,
        data: Dict[str, Any],
        fallback_category: str,
        language: str,
        model_used: Optional[str] = None,
        text_fallback: bool = False,
    ) -> CivicAnalysisResponse:
        complaint_dict = data.get("complaint_draft") or {}
        draft = ComplaintDraft(
            subject=complaint_dict.get("subject", "Civic Grievance Report"),
            to_authority=complaint_dict.get(
                "to_authority", "The Municipal Commissioner / Ward Officer"
            ),
            body=complaint_dict.get(
                "body",
                "Dear Authority,\n\nI wish to report a civic issue at [Exact Location / Landmark]. Please inspect and remediate urgently.\n\nSincerely,\n[Citizen Name]\n[Contact Number]",
            ),
            recommended_portal=complaint_dict.get(
                "recommended_portal", "Local Municipal Grievance Portal / CPGRAMS / Swachhata App"
            ),
        )

        active_model = model_used or self.model

        raw_priority = str(data.get("suggested_priority", "Medium")).strip().capitalize()
        if raw_priority not in ("Critical", "High", "Medium", "Low"):
            if "crit" in raw_priority.lower():
                priority = "Critical"
            elif "high" in raw_priority.lower():
                priority = "High"
            elif "low" in raw_priority.lower():
                priority = "Low"
            else:
                priority = "Medium"
        else:
            priority = raw_priority

        raw_evidence = data.get("visible_evidence")
        if isinstance(raw_evidence, list) and raw_evidence:
            evidence_list = [str(x) for x in raw_evidence]
        else:
            evidence_list = ["Visual and environmental evidence observed from report context"]

        if text_fallback:
            fallback_note = (
                f"Image evidence received. Model '{active_model}' processed context in text mode. "
                "For direct pixel vision, pull a multimodal model."
                if language == "en"
                else f"छवि प्राप्त हुई। मॉडल '{active_model}' ने टेक्स्ट मोड में विश्लेषण किया।"
            )
            if fallback_note not in evidence_list:
                evidence_list.insert(0, fallback_note)

        raw_impact = data.get("potential_impact")
        if isinstance(raw_impact, list) and raw_impact:
            impact_list = [str(x) for x in raw_impact]
        else:
            impact_list = ["Public safety and commuter hazard"]

        raw_steps = data.get("next_steps")
        if isinstance(raw_steps, list) and raw_steps:
            steps_list = [str(x) for x in raw_steps]
        else:
            steps_list = [
                "Document photo with safe vantage point",
                "Submit complaint through Nagar Nigam / Municipal portal",
            ]

        return CivicAnalysisResponse(
            analysis_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            language="hi" if language == "hi" else "en",
            category=data.get("category", fallback_category or "Civic Issue"),
            issue_title=data.get("issue_title", "Reported Civic Issue"),
            summary=data.get("summary", "Analysis completed based on submitted evidence."),
            visible_evidence=evidence_list,
            potential_impact=impact_list,
            suggested_priority=priority,
            priority_reasoning=data.get(
                "priority_reasoning", "Assigned based on visible impact and public safety risks."
            ),
            responsible_department=data.get(
                "responsible_department", "Local Municipal Corporation / Nagar Nigam"
            ),
            next_steps=steps_list,
            complaint_draft=draft,
            ai_provider="ollama",
            model_used=active_model,
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
