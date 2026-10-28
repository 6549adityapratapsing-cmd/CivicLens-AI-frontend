import os
import json
import uuid
import threading
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

from app.services.departments import get_department_by_id, get_demo_departments


DemoStatus = Literal[
    "Submitted (Demo)",
    "Under Review (Demo)",
    "Action Planned (Demo)",
    "Resolved (Demo)",
    "Rejected (Demo)",
]

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "demo_complaints.json")
_lock = threading.Lock()


class StatusUpdateRecord(BaseModel):
    status: DemoStatus
    timestamp: str
    updated_by: str
    note: str
    role: Optional[str] = "system"  # "citizen", "officer", "admin", "system"
    work_done: Optional[str] = None
    work_planned: Optional[str] = None
    inspection_findings: Optional[str] = None
    next_steps: Optional[str] = None
    expected_completion_date: Optional[str] = None
    update_type: Optional[str] = "update"  # "submission", "status_change", "progress_update", "citizen_reply", "officer_reply"
    is_simulated: bool = True


class SimulatedReceipt(BaseModel):
    receipt_id: str
    reference_number: str
    timestamp: str
    department_name: str
    acknowledgement: str = "SIMULATED SUBMISSION — Recorded in Demo Environment Only"
    disclaimer: str = (
        "This complaint exists only in the CivicLens AI demo. "
        "It has not been sent to any government authority."
    )
    expected_sla_hours: int = 48


class DemoComplaint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_number: str
    citizen_id: str
    citizen_name: str = "Anonymous Citizen"
    citizen_contact: Optional[str] = None
    title: str
    category: str
    department_id: str
    department_name: str
    priority: str
    location: str
    summary: str
    complaint_body: str
    status: DemoStatus = "Submitted (Demo)"
    status_history: List[StatusUpdateRecord] = Field(default_factory=list)
    visible_evidence: List[str] = Field(default_factory=list)
    image_ref: Optional[str] = None
    expected_completion_date: Optional[str] = None
    receipt: SimulatedReceipt
    created_at: str
    updated_at: str
    idempotency_key: Optional[str] = None
    is_demo: bool = True


def _generate_seed_complaints() -> List[DemoComplaint]:
    """Generates realistic demonstration complaints for instant interactive evaluation."""
    now = datetime.now(timezone.utc).isoformat()
    return [
        DemoComplaint(
            id="seed-complaint-1",
            reference_number="DEMO-2026-000001",
            citizen_id="demo-citizen-1",
            citizen_name="Aarav Sharma",
            citizen_contact="+91 98765 43210",
            title="Dangerous 2-Meter Road Crater Near Sector 4",
            category="Pothole / Road Damage",
            department_id="demo-pwd-roads",
            department_name="Demo Road Maintenance Department (PWD / Infrastructure)",
            priority="Critical",
            location="Sector 4 Main Road, near Metro Pillar 142",
            summary="Deep road crater with exposed aggregate causing severe vehicular damage and near accidents.",
            complaint_body=(
                "Dear Authority,\n\nI am writing to report a hazardous road crater at Sector 4 Main Road near Metro Pillar 142. "
                "The pothole is approximately 1.5m wide and poses serious risk to two-wheelers. Please inspect urgently.\n\n"
                "Sincerely,\nAarav Sharma"
            ),
            status="Submitted (Demo)",
            status_history=[
                StatusUpdateRecord(
                    status="Submitted (Demo)",
                    timestamp=now,
                    updated_by="Citizen Submission (Simulated)",
                    note="Initial automated grievance draft received and logged in demo system.",
                )
            ],
            visible_evidence=[
                "Deep crater approx 1.5m wide",
                "Exposed aggregate road foundation",
                "Traffic bottleneck risk observed",
            ],
            image_ref="/sample_data/sample_pothole.jpg",
            receipt=SimulatedReceipt(
                receipt_id="RCPT-DEMO-2026-000001",
                reference_number="DEMO-2026-000001",
                timestamp=now,
                department_name="Demo Road Maintenance Department (PWD / Infrastructure)",
                expected_sla_hours=48,
            ),
            created_at=now,
            updated_at=now,
        ),
        DemoComplaint(
            id="seed-complaint-2",
            reference_number="DEMO-2026-000002",
            citizen_id="demo-citizen-1",
            citizen_name="Priya Patel",
            citizen_contact="+91 98111 22334",
            title="Overflowing Waste Dump Blocking Pedestrian Walkway",
            category="Garbage / Illegal Dumping",
            department_id="demo-nagar-nigam",
            department_name="Demo Municipal Sanitation & Solid Waste Department",
            priority="High",
            location="Market Lane, Ward 12, behind community center",
            summary="Refuse heap accumulating for 4 days, emitting foul odor and breeding stray cattle.",
            complaint_body=(
                "To the Ward Officer,\n\nGarbage bin has not been cleared for 4 days at Market Lane, Ward 12. "
                "Waste is spilling onto the footpath causing hygiene risks.\n\nPriya Patel"
            ),
            status="Under Review (Demo)",
            status_history=[
                StatusUpdateRecord(
                    status="Submitted (Demo)",
                    timestamp=now,
                    updated_by="Citizen Submission (Simulated)",
                    note="Logged in demo registry.",
                ),
                StatusUpdateRecord(
                    status="Under Review (Demo)",
                    timestamp=now,
                    updated_by="Demo Municipal Officer (Simulated)",
                    note="Inspection request dispatched to Ward 12 sanitation supervisor.",
                ),
            ],
            visible_evidence=[
                "Overflowing blue municipal dumpster",
                "Scatter debris over 5-meter radius",
            ],
            image_ref=None,
            receipt=SimulatedReceipt(
                receipt_id="RCPT-DEMO-2026-000002",
                reference_number="DEMO-2026-000002",
                timestamp=now,
                department_name="Demo Municipal Sanitation & Solid Waste Department",
                expected_sla_hours=24,
            ),
            created_at=now,
            updated_at=now,
        ),
        DemoComplaint(
            id="seed-complaint-3",
            reference_number="DEMO-2026-000003",
            citizen_id="demo-citizen-2",
            citizen_name="Vikram Singh",
            citizen_contact="+91 99887 76655",
            title="Non-Functioning Streetlights on Central Avenue",
            category="Streetlight / Electrical Hazard",
            department_id="demo-power-electricity",
            department_name="Demo Electricity & Streetlighting Board",
            priority="Medium",
            location="Central Avenue, between Blocks C and D",
            summary="Five consecutive LED streetlights are dead, causing total darkness after 7 PM.",
            complaint_body=(
                "Respected Executive Engineer,\n\nStreetlights on Central Avenue between Blocks C and D are unlit. "
                "Kindly replace faulty bulbs and check the feeder box.\n\nVikram Singh"
            ),
            status="Action Planned (Demo)",
            status_history=[
                StatusUpdateRecord(
                    status="Submitted (Demo)",
                    timestamp=now,
                    updated_by="Citizen Submission (Simulated)",
                    note="Registered in demo database.",
                ),
                StatusUpdateRecord(
                    status="Under Review (Demo)",
                    timestamp=now,
                    updated_by="Demo Grid Engineer",
                    note="Feeder line defect confirmed on Circuit 4.",
                ),
                StatusUpdateRecord(
                    status="Action Planned (Demo)",
                    timestamp=now,
                    updated_by="Demo Repair Dispatcher",
                    note="Repair crew scheduled with replacement LED luminaires.",
                ),
            ],
            visible_evidence=[
                "Dark street corridor",
                "Unlit lamp poles along 200m stretch",
            ],
            image_ref=None,
            receipt=SimulatedReceipt(
                receipt_id="RCPT-DEMO-2026-000003",
                reference_number="DEMO-2026-000003",
                timestamp=now,
                department_name="Demo Electricity & Streetlighting Board",
                expected_sla_hours=12,
            ),
            created_at=now,
            updated_at=now,
        ),
    ]


class DemoStore:
    def __init__(self):
        self._complaints: Dict[str, DemoComplaint] = {}
        self._counter: int = 3
        self._idempotency_map: Dict[str, str] = {}  # idempotency_key -> complaint_id
        self._load_from_disk()

    def _load_from_disk(self):
        with _lock:
            if os.path.exists(DATA_FILE):
                try:
                    with open(DATA_FILE, "r", encoding="utf-8") as f:
                        raw = json.load(f)
                    self._counter = raw.get("counter", 3)
                    items = raw.get("complaints", [])
                    self._complaints = {item["id"]: DemoComplaint(**item) for item in items}
                    for c in self._complaints.values():
                        if c.idempotency_key:
                            self._idempotency_map[c.idempotency_key] = c.id
                    return
                except Exception as e:
                    print(f"[DemoStore] Error reading {DATA_FILE}, reseeding: {e}")

            # Initialize with seed data
            seeds = _generate_seed_complaints()
            self._complaints = {c.id: c for c in seeds}
            self._counter = len(seeds)
            self._save_to_disk_locked()

    def _save_to_disk_locked(self):
        try:
            os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
            payload = {
                "counter": self._counter,
                "complaints": [c.model_dump() for c in self._complaints.values()],
            }
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            print(f"[DemoStore] Failed to write {DATA_FILE}: {e}")

    def create_complaint(
        self,
        citizen_id: str,
        citizen_name: str,
        title: str,
        category: str,
        department_id: str,
        priority: str,
        location: str,
        summary: str,
        complaint_body: str,
        visible_evidence: List[str],
        image_ref: Optional[str] = None,
        citizen_contact: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> tuple[DemoComplaint, bool]:
        """
        Creates a demo complaint atomically with unique reference number.
        Returns (complaint, is_duplicate).
        """
        with _lock:
            # Check idempotency to prevent duplicate submissions
            if idempotency_key and idempotency_key in self._idempotency_map:
                existing_id = self._idempotency_map[idempotency_key]
                if existing_id in self._complaints:
                    return self._complaints[existing_id], True

            self._counter += 1
            ref_num = f"DEMO-2026-{self._counter:06d}"
            cid = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()

            dept = get_department_by_id(department_id)
            dept_name = dept.name if dept else "Demo Municipal Corporation"
            sla = dept.sla_hours if dept else 48

            receipt = SimulatedReceipt(
                receipt_id=f"RCPT-{ref_num}",
                reference_number=ref_num,
                timestamp=now,
                department_name=dept_name,
                expected_sla_hours=sla,
            )

            complaint = DemoComplaint(
                id=cid,
                reference_number=ref_num,
                citizen_id=citizen_id or "demo-citizen-1",
                citizen_name=citizen_name or "Anonymous Citizen",
                citizen_contact=citizen_contact,
                title=title or "Civic Issue Report",
                category=category or "General",
                department_id=department_id,
                department_name=dept_name,
                priority=priority or "Medium",
                location=location or "Unspecified Location",
                summary=summary or "Reported via CivicLens AI demo.",
                complaint_body=complaint_body,
                status="Submitted (Demo)",
                status_history=[
                    StatusUpdateRecord(
                        status="Submitted (Demo)",
                        timestamp=now,
                        updated_by=f"Citizen ({citizen_name or 'Demo Citizen'})",
                        note="Initial automated grievance draft received and logged in demo system.",
                    )
                ],
                visible_evidence=visible_evidence or [],
                image_ref=image_ref,
                receipt=receipt,
                created_at=now,
                updated_at=now,
                idempotency_key=idempotency_key,
            )

            self._complaints[cid] = complaint
            if idempotency_key:
                self._idempotency_map[idempotency_key] = cid

            self._save_to_disk_locked()
            return complaint, False

    def get_complaint(self, identifier: str) -> Optional[DemoComplaint]:
        with _lock:
            # Match by ID or reference_number
            for c in self._complaints.values():
                if c.id == identifier or c.reference_number.upper() == identifier.upper():
                    return c
            return None

    def list_complaints(
        self,
        citizen_id: Optional[str] = None,
        department_id: Optional[str] = None,
    ) -> List[DemoComplaint]:
        with _lock:
            all_items = list(self._complaints.values())
            filtered = all_items
            if citizen_id:
                filtered = [c for c in filtered if c.citizen_id == citizen_id]
            if department_id and department_id != "all":
                filtered = [c for c in filtered if c.department_id == department_id]
            return sorted(filtered, key=lambda c: c.created_at, reverse=True)

    def update_status(
        self,
        complaint_id: str,
        new_status: DemoStatus,
        updated_by: str,
        note: str,
    ) -> Optional[DemoComplaint]:
        with _lock:
            complaint = self._complaints.get(complaint_id)
            if not complaint:
                # Try reference_number
                for c in self._complaints.values():
                    if c.reference_number.upper() == complaint_id.upper():
                        complaint = c
                        break
            if not complaint:
                return None

            now = datetime.now(timezone.utc).isoformat()
            complaint.status = new_status
            complaint.updated_at = now
            complaint.status_history.append(
                StatusUpdateRecord(
                    status=new_status,
                    timestamp=now,
                    updated_by=updated_by,
                    note=note or f"Status changed to {new_status}.",
                    role="admin",
                    update_type="status_change",
                    is_simulated=True,
                )
            )
            self._save_to_disk_locked()
            return complaint

    def post_officer_update(
        self,
        complaint_id: str,
        officer_name: str,
        note: str,
        new_status: Optional[DemoStatus] = None,
        work_done: Optional[str] = None,
        work_planned: Optional[str] = None,
        inspection_findings: Optional[str] = None,
        next_steps: Optional[str] = None,
        expected_completion_date: Optional[str] = None,
    ) -> Optional[DemoComplaint]:
        with _lock:
            complaint = self._complaints.get(complaint_id)
            if not complaint:
                for c in self._complaints.values():
                    if c.reference_number.upper() == complaint_id.upper():
                        complaint = c
                        break
            if not complaint:
                return None

            now = datetime.now(timezone.utc).isoformat()
            if new_status:
                complaint.status = new_status
            if expected_completion_date is not None:
                complaint.expected_completion_date = expected_completion_date
            complaint.updated_at = now

            record = StatusUpdateRecord(
                status=complaint.status,
                timestamp=now,
                updated_by=officer_name,
                note=note or f"Officer progress update: {complaint.status}",
                role="officer",
                work_done=work_done,
                work_planned=work_planned,
                inspection_findings=inspection_findings,
                next_steps=next_steps,
                expected_completion_date=expected_completion_date or complaint.expected_completion_date,
                update_type="progress_update",
                is_simulated=True,
            )
            complaint.status_history.append(record)
            self._save_to_disk_locked()
            return complaint

    def post_citizen_reply(
        self,
        complaint_id: str,
        citizen_id: str,
        citizen_name: str,
        message: str,
    ) -> tuple[Optional[DemoComplaint], Optional[str]]:
        """
        Adds a citizen reply / additional information note to their complaint.
        Returns (complaint, error_code).
        """
        with _lock:
            complaint = self._complaints.get(complaint_id)
            if not complaint:
                for c in self._complaints.values():
                    if c.reference_number.upper() == complaint_id.upper():
                        complaint = c
                        break
            if not complaint:
                return None, "not_found"

            if complaint.citizen_id != citizen_id:
                return None, "forbidden"

            now = datetime.now(timezone.utc).isoformat()
            complaint.updated_at = now

            record = StatusUpdateRecord(
                status=complaint.status,
                timestamp=now,
                updated_by=f"{citizen_name} (Citizen)",
                note=message,
                role="citizen",
                update_type="citizen_reply",
                is_simulated=True,
            )
            complaint.status_history.append(record)
            self._save_to_disk_locked()
            return complaint, None

    def update_department(
        self,
        complaint_id: str,
        department_id: str,
        updated_by: str,
        note: Optional[str] = None,
    ) -> Optional[DemoComplaint]:
        with _lock:
            complaint = self._complaints.get(complaint_id)
            if not complaint:
                for c in self._complaints.values():
                    if c.reference_number.upper() == complaint_id.upper():
                        complaint = c
                        break
            if not complaint:
                return None

            dept = get_department_by_id(department_id)
            if not dept:
                return None

            now = datetime.now(timezone.utc).isoformat()
            old_dept = complaint.department_name
            complaint.department_id = dept.id
            complaint.department_name = dept.name
            complaint.updated_at = now
            complaint.receipt.department_name = dept.name
            complaint.receipt.expected_sla_hours = dept.sla_hours

            change_note = note or f"Department reassigned from '{old_dept}' to '{dept.name}'."
            complaint.status_history.append(
                StatusUpdateRecord(
                    status=complaint.status,
                    timestamp=now,
                    updated_by=updated_by,
                    note=change_note,
                )
            )
            self._save_to_disk_locked()
            return complaint

    def get_stats(self) -> Dict[str, Any]:
        with _lock:
            all_items = list(self._complaints.values())
            by_category: Dict[str, int] = {}
            by_dept: Dict[str, int] = {}
            by_status: Dict[str, int] = {}

            for c in all_items:
                by_category[c.category] = by_category.get(c.category, 0) + 1
                by_dept[c.department_name] = by_dept.get(c.department_name, 0) + 1
                by_status[c.status] = by_status.get(c.status, 0) + 1

            return {
                "total_complaints": len(all_items),
                "by_category": by_category,
                "by_department": by_dept,
                "by_status": by_status,
                "recent_submissions": [
                    {
                        "id": c.id,
                        "reference_number": c.reference_number,
                        "title": c.title,
                        "category": c.category,
                        "department": c.department_name,
                        "status": c.status,
                        "created_at": c.created_at,
                    }
                    for c in sorted(all_items, key=lambda x: x.created_at, reverse=True)[:5]
                ],
            }

    def reset(self):
        """Resets the demo store back to initial seed data."""
        with _lock:
            seeds = _generate_seed_complaints()
            self._complaints = {c.id: c for c in seeds}
            self._counter = len(seeds)
            self._idempotency_map.clear()
            self._save_to_disk_locked()


demo_store = DemoStore()
