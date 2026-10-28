import pytest
from fastapi.testclient import TestClient
from main import app
from app.config import settings

client = TestClient(app)


def test_demo_safety_barrier():
    """Verify that Demo Mode strictly asserts external submission is blocked."""
    assert settings.DEMO_MODE is True
    # Verify that calling the safety assertion directly raises RuntimeError in Demo Mode
    with pytest.raises(RuntimeError) as exc_info:
        settings.assert_external_submission_blocked()
    assert "SAFETY BARRIER" in str(exc_info.value)


def test_demo_config_endpoint():
    """Verify GET /api/demo/config returns active demo safety status."""
    res = client.get("/api/demo/config")
    assert res.status_code == 200
    data = res.json()
    assert data["demo_mode"] is True
    assert "DEMO MODE" in data["notice"]
    assert data["external_submissions_allowed"] is False
    assert len(data["demo_accounts"]) >= 2
    roles = [acc["role"] for acc in data["demo_accounts"]]
    assert "citizen" in roles
    assert "officer" in roles


def test_list_demo_departments():
    """Verify GET /api/demo/departments returns the 5 seed departments."""
    res = client.get("/api/demo/departments")
    assert res.status_code == 200
    depts = res.json()
    assert len(depts) == 5
    dept_ids = [d["id"] for d in depts]
    assert "demo-pwd-roads" in dept_ids
    assert "demo-nagar-nigam" in dept_ids
    assert "demo-power-electricity" in dept_ids
    assert "demo-jal-board" in dept_ids
    assert "demo-public-works" in dept_ids


def test_department_match_clear():
    """Verify department matching selects Demo Road Maintenance for potholes."""
    res = client.post(
        "/api/demo/departments/match",
        json={
            "category": "Pothole / Road Damage",
            "description": "Hazardous road crater on highway with exposed asphalt",
            "location": "Sector 4",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["matched_department"]["id"] == "demo-pwd-roads"
    assert data["confidence_score"] >= 0.70
    assert "Road Maintenance" in data["explanation"]
    assert data["requires_confirmation"] is False


def test_department_match_ambiguous():
    """Verify ambiguous categories request citizen confirmation."""
    res = client.post(
        "/api/demo/departments/match",
        json={
            "category": "Broken Public Property / Footpath",
            "description": "Damaged structure and pavement near park",
            "location": "Civic Center",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["requires_confirmation"] is True
    assert len(data["candidate_departments"]) >= 2


def test_demo_authentication():
    """Verify citizen, officer, and admin authentication tokens."""
    # Invalid password
    bad_res = client.post("/api/demo/auth/login", json={"username": "citizen", "password": "wrong"})
    assert bad_res.status_code == 401

    # Valid citizen login
    cit_res = client.post("/api/demo/auth/login", json={"username": "citizen", "password": settings.DEMO_CITIZEN_PASSWORD})
    assert cit_res.status_code == 200
    cit_data = cit_res.json()
    assert cit_data["user"]["role"] == "citizen"
    assert cit_data["token"] == settings.DEMO_CITIZEN_TOKEN

    # Valid department officer login
    off_res = client.post("/api/demo/auth/login", json={"username": "officer", "password": settings.DEMO_OFFICER_PASSWORD})
    assert off_res.status_code == 200
    off_data = off_res.json()
    assert off_data["user"]["role"] == "officer"
    assert off_data["token"] == settings.DEMO_OFFICER_TOKEN

    # Valid admin login
    adm_res = client.post("/api/demo/auth/login", json={"username": "admin", "password": settings.DEMO_ADMIN_PASSWORD})
    assert adm_res.status_code == 200
    adm_data = adm_res.json()
    assert adm_data["user"]["role"] == "admin"
    assert adm_data["token"] == settings.DEMO_ADMIN_TOKEN


def test_demo_submission_and_receipt():
    """Verify submitting a simulated complaint creates a unique reference number and receipt."""
    payload = {
        "title": "Severe Water Logging and Open Drain",
        "category": "Water Leakage / Drainage",
        "department_id": "demo-jal-board",
        "priority": "High",
        "location": "Ward 5 Main Road",
        "summary": "Sewage water leaking across street.",
        "complaint_body": "To the Jal Board, please inspect water leakage at Ward 5.",
        "visible_evidence": ["Stagnant water puddle", "Open drain grill"],
        "citizen_name": "Test Citizen",
        "idempotency_key": "unique-test-key-101",
    }

    res = client.post(
        "/api/demo/complaints",
        json=payload,
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["reference_number"].startswith("DEMO-2026-")
    assert data["status"] == "Submitted (Demo)"
    assert data["department_name"] == "Demo Water Supply & Sewerage Board (Jal Board)"
    assert data["receipt"]["reference_number"] == data["reference_number"]
    assert "SIMULATED SUBMISSION" in data["receipt"]["acknowledgement"]
    assert "It has not been sent to any government authority" in data["receipt"]["disclaimer"]

    # Test idempotency: re-submitting with the exact same key returns the existing record without duplicate
    dup_res = client.post(
        "/api/demo/complaints",
        json=payload,
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["id"] == data["id"]
    assert dup_data["reference_number"] == data["reference_number"]


def test_complaint_tracking_and_access_control():
    """Verify citizen cannot view another citizen's complaints, but officer/admin can view all."""
    # Create complaint owned by demo-citizen-1
    res = client.post(
        "/api/demo/complaints",
        json={
            "title": "Private Citizen Complaint",
            "category": "Other",
            "department_id": "demo-nagar-nigam",
            "priority": "Low",
            "location": "Private Alley",
            "summary": "Debris pile",
            "complaint_body": "Please remove debris.",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    assert res.status_code == 200
    cid = res.json()["id"]

    # Citizen 1 can fetch their own complaint
    get_res = client.get(
        f"/api/demo/complaints/{cid}",
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Private Citizen Complaint"

    # Citizen 2 cannot fetch Citizen 1's complaint -> 403 Forbidden
    cit2_get = client.get(
        f"/api/demo/complaints/{cid}",
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN2_TOKEN}"},
    )
    assert cit2_get.status_code == 403

    # Unauthenticated cannot fetch -> 401 Unauthorized
    unauth_get = client.get(f"/api/demo/complaints/{cid}")
    assert unauth_get.status_code == 401

    # Officer can fetch the complaint
    off_get = client.get(
        f"/api/demo/complaints/{cid}",
        headers={"Authorization": f"Bearer {settings.DEMO_OFFICER_TOKEN}"},
    )
    assert off_get.status_code == 200

    # Admin can also fetch the complaint
    admin_get = client.get(
        f"/api/demo/complaints/{cid}",
        headers={"Authorization": f"Bearer {settings.DEMO_ADMIN_TOKEN}"},
    )
    assert admin_get.status_code == 200


def test_admin_and_officer_status_transitions():
    """Verify only authorized roles can update status, while citizen is denied."""
    create_res = client.post(
        "/api/demo/complaints",
        json={
            "title": "Road Repair Verification Test",
            "category": "Pothole / Road Damage",
            "department_id": "demo-pwd-roads",
            "priority": "Critical",
            "location": "Highway 9",
            "summary": "Dangerous hole",
            "complaint_body": "Urgent repair needed on Highway 9.",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    cid = create_res.json()["id"]

    # Citizen tries to update status -> 403 Forbidden
    cit_update = client.patch(
        f"/api/demo/complaints/{cid}/status",
        json={"new_status": "Resolved (Demo)"},
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    assert cit_update.status_code == 403

    # Officer updates status -> 200 OK
    off_update = client.patch(
        f"/api/demo/complaints/{cid}/status",
        json={
            "new_status": "Under Review (Demo)",
            "note": "Field engineer assigned for inspection.",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_OFFICER_TOKEN}"},
    )
    assert off_update.status_code == 200
    data = off_update.json()
    assert data["status"] == "Under Review (Demo)"
    latest_hist = data["status_history"][-1]
    assert latest_hist["status"] == "Under Review (Demo)"
    assert latest_hist["note"] == "Field engineer assigned for inspection."

    # Officer reassigns department -> 200 OK
    reassign_res = client.patch(
        f"/api/demo/complaints/{cid}/department",
        json={
            "department_id": "demo-public-works",
            "note": "Reassigned to Public Works structural division.",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_OFFICER_TOKEN}"},
    )
    assert reassign_res.status_code == 200
    reassign_data = reassign_res.json()
    assert reassign_data["department_id"] == "demo-public-works"


def test_officer_progress_update():
    """Verify officer can post structured progress updates with SLA, work planned, and inspection findings."""
    create_res = client.post(
        "/api/demo/complaints",
        json={
            "title": "Officer Structured Progress Test",
            "category": "Pothole / Road Damage",
            "department_id": "demo-pwd-roads",
            "priority": "High",
            "location": "North Ring Road",
            "summary": "Road depression",
            "complaint_body": "Depression on right lane.",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    cid = create_res.json()["id"]

    # Citizen attempting officer-update is rejected with 403
    cit_forbidden = client.post(
        f"/api/demo/complaints/{cid}/officer-update",
        json={
            "note": "Attempt by citizen",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    assert cit_forbidden.status_code == 403

    # Officer posts structured progress update
    update_res = client.post(
        f"/api/demo/complaints/{cid}/officer-update",
        json={
            "new_status": "Action Planned (Demo)",
            "note": "Site visit completed by PWD Junior Engineer.",
            "work_done": "Site demarcated and preliminary depth measurement logged.",
            "work_planned": "Cold mix asphalt patching and roller compaction.",
            "inspection_findings": "Subgrade integrity is intact; surface wear is 4 inches deep.",
            "next_steps": "Dispatching asphalt tender crew on 2026-10-29 morning.",
            "expected_completion_date": "2026-10-30",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_OFFICER_TOKEN}"},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "Action Planned (Demo)"
    assert updated["expected_completion_date"] == "2026-10-30"

    latest_record = updated["status_history"][-1]
    assert latest_record["role"] == "officer"
    assert latest_record["work_done"] == "Site demarcated and preliminary depth measurement logged."
    assert latest_record["work_planned"] == "Cold mix asphalt patching and roller compaction."
    assert latest_record["inspection_findings"] == "Subgrade integrity is intact; surface wear is 4 inches deep."
    assert latest_record["next_steps"] == "Dispatching asphalt tender crew on 2026-10-29 morning."
    assert latest_record["expected_completion_date"] == "2026-10-30"
    assert latest_record["is_simulated"] is True
    assert "Rajesh Varma" in latest_record["updated_by"]


def test_citizen_reply_to_complaint():
    """Verify citizen can post updates/replies to own complaint, while other citizens are rejected."""
    create_res = client.post(
        "/api/demo/complaints",
        json={
            "title": "Citizen Reply Testing Issue",
            "category": "Garbage / Illegal Dumping",
            "department_id": "demo-nagar-nigam",
            "priority": "Medium",
            "location": "Sector 11 Market",
            "summary": "Garbage dump near gate",
            "complaint_body": "Garbage accumulating near market entrance.",
        },
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    cid = create_res.json()["id"]

    # Citizen 2 tries to post reply to Citizen 1's complaint -> 403 Forbidden
    bad_reply = client.post(
        f"/api/demo/complaints/{cid}/citizen-reply",
        json={"message": "I am an unrelated user trying to comment."},
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN2_TOKEN}"},
    )
    assert bad_reply.status_code == 403

    # Owning Citizen posts reply
    good_reply = client.post(
        f"/api/demo/complaints/{cid}/citizen-reply",
        json={"message": "Update: The waste truck arrived this morning but only cleared half the bin."},
        headers={"Authorization": f"Bearer {settings.DEMO_CITIZEN_TOKEN}"},
    )
    assert good_reply.status_code == 200
    complaint_data = good_reply.json()
    latest_record = complaint_data["status_history"][-1]
    assert latest_record["role"] == "citizen"
    assert latest_record["update_type"] == "citizen_reply"
    assert "only cleared half the bin" in latest_record["note"]
    assert latest_record["is_simulated"] is True


def test_demo_stats_and_reset():
    """Verify aggregated stats and reset endpoint."""
    stats_res = client.get("/api/demo/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_complaints"] >= 3
    assert "by_category" in stats
    assert "by_department" in stats
    assert "by_status" in stats

    # Reset store
    reset_res = client.post(
        "/api/demo/reset",
        headers={"Authorization": f"Bearer {settings.DEMO_OFFICER_TOKEN}"},
    )
    assert reset_res.status_code == 200
    post_stats = client.get("/api/demo/stats").json()
    assert post_stats["total_complaints"] == 3
