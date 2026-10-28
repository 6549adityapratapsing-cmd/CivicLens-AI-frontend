from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Header
from pydantic import BaseModel, Field

from app.config import settings
from app.services.departments import (
    get_demo_departments,
    match_department,
    DepartmentMatchResult,
    DemoDepartment,
)
from app.services.demo_store import (
    demo_store,
    DemoComplaint,
    DemoStatus,
)
from app.services.demo_auth import (
    authenticate_demo_user,
    get_current_demo_user,
    require_demo_admin,
    require_demo_officer,
    require_demo_user,
    DemoUser,
)

router = APIRouter(prefix="/api/demo", tags=["Demo Mode & Government Automation"])


class DepartmentMatchRequest(BaseModel):
    category: str
    description: Optional[str] = ""
    location: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: DemoUser
    notice: str


class DemoComplaintCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str
    department_id: str
    priority: str = "Medium"
    location: str = Field(..., min_length=2)
    summary: str
    complaint_body: str = Field(..., min_length=10)
    visible_evidence: List[str] = Field(default_factory=list)
    image_ref: Optional[str] = None
    citizen_name: Optional[str] = "Demo Citizen"
    citizen_contact: Optional[str] = None
    idempotency_key: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    new_status: DemoStatus
    note: Optional[str] = None


class OfficerProgressUpdateRequest(BaseModel):
    new_status: Optional[DemoStatus] = None
    note: str = Field(..., min_length=3, max_length=2000)
    work_done: Optional[str] = None
    work_planned: Optional[str] = None
    inspection_findings: Optional[str] = None
    next_steps: Optional[str] = None
    expected_completion_date: Optional[str] = None


class CitizenReplyRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=2000)


class DepartmentUpdateRequest(BaseModel):
    department_id: str
    note: Optional[str] = None


@router.get("/config")
async def get_demo_config():
    """Returns runtime demo configuration and safety status."""
    return {
        "demo_mode": settings.DEMO_MODE,
        "notice": settings.DEMO_NOTICE,
        "active_model": settings.OLLAMA_MODEL,
        "external_submissions_allowed": False,
        "disclaimer": (
            "SAFETY ACTIVE: All submissions in this interface are strictly simulated. "
            "No real government portals, external APIs, emails, or SMS services are ever called."
        ),
        "demo_accounts": [
            {
                "role": "citizen",
                "username": "citizen",
                "label": "Demo Citizen Account",
                "description": "Report civic issues, track personal grievances, view simulated receipts and officer updates.",
            },
            {
                "role": "officer",
                "username": "officer",
                "label": "Demo Department Officer Account",
                "description": "Review assigned department complaints, post progress updates, inspection findings, resolution timelines, and reply to citizens.",
            },
            {
                "role": "admin",
                "username": "admin",
                "label": "Demo Municipal Admin Account",
                "description": "Central municipal coordination cell, reassign departments, adjust statuses, and system reset.",
            },
        ],
    }


@router.get("/departments", response_model=List[DemoDepartment])
async def list_demo_departments():
    """Lists the seed directory of demonstration municipal departments."""
    return get_demo_departments()


@router.post("/departments/match", response_model=DepartmentMatchResult)
async def match_complaint_department(payload: DepartmentMatchRequest):
    """
    Analyzes category, description, and location to suggest the best demo department
    and explains the routing rationale.
    """
    return match_department(
        category=payload.category,
        description=payload.description or "",
        location=payload.location,
    )


@router.post("/auth/login", response_model=LoginResponse)
async def demo_login(payload: LoginRequest):
    """Authenticates demo citizen, officer, or admin users."""
    res = authenticate_demo_user(payload.username, payload.password)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo credentials. Use citizen/demo123, officer/officer123, or admin/admin123.",
        )
    user, token = res
    return LoginResponse(
        token=token,
        user=user,
        notice=settings.DEMO_NOTICE,
    )


@router.get("/auth/me")
async def demo_get_me(current_user: Optional[DemoUser] = Depends(get_current_demo_user)):
    """Returns currently authenticated demo user session."""
    if not current_user:
        return {"authenticated": False, "user": None}
    return {"authenticated": True, "user": current_user}


@router.post("/complaints", response_model=DemoComplaint)
async def submit_demo_complaint(
    payload: DemoComplaintCreateRequest,
    current_user: DemoUser = Depends(require_demo_user),
):
    """
    Simulates submitting a civic complaint to a demonstration department.
    Guaranteed: NO real government portal, email, or webhook is called.
    Supports submission idempotency to prevent accidental duplicates.
    Enforces that citizen_id comes from authenticated session.
    """
    # Safety assertion: verify Demo Mode is strictly active
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Demo submission endpoint is only active when DEMO_MODE=True.",
        )

    citizen_id = current_user.user_id
    citizen_name = current_user.display_name

    complaint, is_duplicate = demo_store.create_complaint(
        citizen_id=citizen_id,
        citizen_name=citizen_name,
        citizen_contact=payload.citizen_contact,
        title=payload.title,
        category=payload.category,
        department_id=payload.department_id,
        priority=payload.priority,
        location=payload.location,
        summary=payload.summary,
        complaint_body=payload.complaint_body,
        visible_evidence=payload.visible_evidence,
        image_ref=payload.image_ref,
        idempotency_key=payload.idempotency_key,
    )
    return complaint


@router.get("/complaints", response_model=List[DemoComplaint])
async def list_demo_complaints(
    department_id: Optional[str] = None,
    current_user: DemoUser = Depends(require_demo_user),
):
    """
    Lists demo complaints.
    - Department Officers and Admins see complaints they manage (with optional department filter).
    - Citizens see ONLY their own permitted complaints.
    - Unauthenticated requests are rejected with 401.
    """
    if current_user.role in ["officer", "admin"]:
        dept = department_id
        if not dept and current_user.role == "officer" and current_user.department and current_user.department != "all":
            dept = current_user.department
        return demo_store.list_complaints(department_id=dept)
    elif current_user.role == "citizen":
        return demo_store.list_complaints(citizen_id=current_user.user_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


@router.get("/complaints/{identifier}", response_model=DemoComplaint)
async def get_demo_complaint_detail(
    identifier: str,
    current_user: DemoUser = Depends(require_demo_user),
):
    """Retrieves a single demo complaint by UUID or DEMO reference number."""
    complaint = demo_store.get_complaint(identifier)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo complaint '{identifier}' was not found in the demonstration registry.",
        )

    # If citizen is logged in, ensure they can only view their own complaint
    if current_user.role == "citizen":
        if complaint.citizen_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only view your own demo complaints.",
            )

    return complaint


@router.patch("/complaints/{complaint_id}/status", response_model=DemoComplaint)
async def update_demo_complaint_status(
    complaint_id: str,
    payload: StatusUpdateRequest,
    officer_user: DemoUser = Depends(require_demo_officer),
):
    """
    Officer/Admin: updates simulated status and appends to audit history.
    """
    allowed_statuses = [
        "Submitted (Demo)",
        "Under Review (Demo)",
        "Action Planned (Demo)",
        "Resolved (Demo)",
        "Rejected (Demo)",
    ]
    if payload.new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid demo status. Must be one of: {', '.join(allowed_statuses)}",
        )

    updated = demo_store.update_status(
        complaint_id=complaint_id,
        new_status=payload.new_status,
        updated_by=officer_user.display_name,
        note=payload.note or f"Status changed to {payload.new_status}.",
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )
    return updated


@router.post("/complaints/{complaint_id}/officer-update", response_model=DemoComplaint)
async def post_officer_progress_update(
    complaint_id: str,
    payload: OfficerProgressUpdateRequest,
    officer_user: DemoUser = Depends(require_demo_officer),
):
    """
    Officer/Admin: Posts progress update (work done, planned, inspection findings, next steps, expected completion date).
    Visibly attributed to the officer with a demo label.
    """
    allowed_statuses = [
        "Submitted (Demo)",
        "Under Review (Demo)",
        "Action Planned (Demo)",
        "Resolved (Demo)",
        "Rejected (Demo)",
    ]
    if payload.new_status and payload.new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid demo status. Must be one of: {', '.join(allowed_statuses)}",
        )

    updated = demo_store.post_officer_update(
        complaint_id=complaint_id,
        officer_name=officer_user.display_name,
        note=payload.note,
        new_status=payload.new_status,
        work_done=payload.work_done,
        work_planned=payload.work_planned,
        inspection_findings=payload.inspection_findings,
        next_steps=payload.next_steps,
        expected_completion_date=payload.expected_completion_date,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )
    return updated


@router.post("/complaints/{complaint_id}/citizen-reply", response_model=DemoComplaint)
async def post_citizen_reply(
    complaint_id: str,
    payload: CitizenReplyRequest,
    current_user: DemoUser = Depends(require_demo_user),
):
    """
    Citizen: Posts a reply or additional information to their own complaint.
    Enforces complaint ownership on the backend.
    """
    updated, err = demo_store.post_citizen_reply(
        complaint_id=complaint_id,
        citizen_id=current_user.user_id,
        citizen_name=current_user.display_name,
        message=payload.message,
    )
    if err == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )
    if err == "forbidden":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only reply to your own demo complaints.",
        )
    return updated


@router.patch("/complaints/{complaint_id}/department", response_model=DemoComplaint)
async def update_demo_complaint_department(
    complaint_id: str,
    payload: DepartmentUpdateRequest,
    officer_user: DemoUser = Depends(require_demo_officer),
):
    """
    Officer/Admin: corrects/reassigns the suggested municipal department.
    """
    updated = demo_store.update_department(
        complaint_id=complaint_id,
        department_id=payload.department_id,
        updated_by=officer_user.display_name,
        note=payload.note,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint or department not found.",
        )
    return updated


@router.get("/stats")
async def get_demo_dashboard_stats():
    """Aggregated statistics for the demo dashboard."""
    return demo_store.get_stats()


@router.post("/reset")
async def reset_demo_database(
    admin_user: Optional[DemoUser] = Depends(get_current_demo_user),
):
    """Resets the demo store back to original seed complaints."""
    demo_store.reset()
    return {
        "status": "success",
        "message": "Demo complaint store successfully reset to initial seed state.",
        "notice": settings.DEMO_NOTICE,
    }
