from typing import List, Optional, Literal
from pydantic import BaseModel, Field


PriorityLevel = Literal["Critical", "High", "Medium", "Low"]
LanguageCode = Literal["en", "hi"]


class ComplaintDraft(BaseModel):
    subject: str = Field(..., description="Formal subject line of the complaint")
    to_authority: str = Field(..., description="Designation of the receiving civic authority")
    body: str = Field(..., description="Complete formal complaint letter body with placeholder brackets")
    recommended_portal: Optional[str] = Field(
        default="Local Nagar Nigam Portal / CPGRAMS / Swachhata App",
        description="Suggested grievance redressal portal"
    )


class CivicAnalysisResponse(BaseModel):
    analysis_id: str = Field(..., description="Unique report identifier")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    language: LanguageCode = Field(default="en", description="Report language ('en' or 'hi')")
    category: str = Field(..., description="Civic issue category")
    issue_title: str = Field(..., description="Concise descriptive title of the civic problem")
    summary: str = Field(..., description="Executive summary of the issue")
    visible_evidence: List[str] = Field(
        ..., description="List of specific visible evidence observed in the image or description"
    )
    potential_impact: List[str] = Field(
        ..., description="Potential public safety, environmental, or health hazards"
    )
    suggested_priority: PriorityLevel = Field(
        ..., description="Suggested urgency rating: Critical, High, Medium, or Low"
    )
    priority_reasoning: str = Field(
        ..., description="Clear explanation for why this priority was assigned"
    )
    responsible_department: str = Field(
        ..., description="Civic department responsible for redressal (e.g., PWD, Nagar Nigam, Electricity Board)"
    )
    next_steps: List[str] = Field(
        ..., description="Actionable immediate steps for the citizen and civic body"
    )
    complaint_draft: ComplaintDraft = Field(
        ..., description="Formal editable complaint letter draft"
    )
    ai_provider: str = Field(..., description="Name of the AI provider used (gemini or ollama)")
    model_used: str = Field(..., description="Model identifier used for inference")
    disclaimer: str = Field(
        default="AI-generated findings are preliminary suggestions to assist citizens and municipal authorities, not an official municipal inspection report.",
        description="Legal and informational disclaimer"
    )


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Citizen inquiry or question")
    language: LanguageCode = Field(default="en", description="Language preference ('en' or 'hi')")
    context: Optional[dict] = Field(default=None, description="Optional active civic report context")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Recent conversation turns")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI assistant response")
    suggested_questions: List[str] = Field(
        default_factory=list, description="Suggested follow-up questions"
    )
    provider: str
    model: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str


class AIHealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "error"]
    provider: str
    model: str
    configured: bool
    details: str
    actionable_tip: Optional[str] = None
    available_models: Optional[List[str]] = None
