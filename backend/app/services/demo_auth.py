from typing import Optional, Literal
from fastapi import HTTPException, Header, Depends, status
from pydantic import BaseModel
from app.config import settings


DemoRole = Literal["citizen", "officer", "admin"]


class DemoUser(BaseModel):
    user_id: str
    username: str
    role: DemoRole
    display_name: str
    department: Optional[str] = None
    department_name: Optional[str] = None


DEMO_USERS = {
    "citizen": {
        "user_id": "demo-citizen-1",
        "username": "citizen",
        "password": settings.DEMO_CITIZEN_PASSWORD,
        "role": "citizen",
        "display_name": "Aarav Sharma (Demo Citizen)",
        "token": settings.DEMO_CITIZEN_TOKEN,
    },
    "citizen2": {
        "user_id": "demo-citizen-2",
        "username": "citizen2",
        "password": settings.DEMO_CITIZEN2_PASSWORD,
        "role": "citizen",
        "display_name": "Vikram Singh (Demo Citizen)",
        "token": settings.DEMO_CITIZEN2_TOKEN,
    },
    "officer": {
        "user_id": "demo-officer-1",
        "username": "officer",
        "password": settings.DEMO_OFFICER_PASSWORD,
        "role": "officer",
        "display_name": "Rajesh Varma (Demo Department Officer)",
        "department": "demo-pwd-roads",
        "department_name": "Demo Road Maintenance Department (PWD / Infrastructure)",
        "token": settings.DEMO_OFFICER_TOKEN,
    },
    "admin": {
        "user_id": "demo-admin-1",
        "username": "admin",
        "password": settings.DEMO_ADMIN_PASSWORD,
        "role": "admin",
        "display_name": "Prakash Rao (Demo Municipal Admin)",
        "department": "Demo Municipal Coordination Cell",
        "department_name": "Central Municipal Coordination Cell",
        "token": settings.DEMO_ADMIN_TOKEN,
    },
}


def authenticate_demo_user(username: str, password: str) -> Optional[tuple[DemoUser, str]]:
    """Authenticates demo username/password and returns (DemoUser, token)."""
    user_data = DEMO_USERS.get(username.lower().strip())
    if user_data and user_data["password"] == password:
        user = DemoUser(
            user_id=user_data["user_id"],
            username=user_data["username"],
            role=user_data["role"],
            display_name=user_data["display_name"],
            department=user_data.get("department"),
            department_name=user_data.get("department_name"),
        )
        return user, user_data["token"]
    return None


def get_current_demo_user(
    authorization: Optional[str] = Header(None),
    x_demo_token: Optional[str] = Header(None),
) -> Optional[DemoUser]:
    """Resolves demo user from Bearer token or X-Demo-Token header."""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif x_demo_token:
        token = x_demo_token.strip()

    if not token:
        return None

    # Check against known demo tokens
    if token == settings.DEMO_ADMIN_TOKEN:
        u = DEMO_USERS["admin"]
        return DemoUser(
            user_id=u["user_id"],
            username=u["username"],
            role="admin",
            display_name=u["display_name"],
            department=u.get("department"),
            department_name=u.get("department_name"),
        )
    elif token == settings.DEMO_OFFICER_TOKEN:
        u = DEMO_USERS["officer"]
        return DemoUser(
            user_id=u["user_id"],
            username=u["username"],
            role="officer",
            display_name=u["display_name"],
            department=u.get("department"),
            department_name=u.get("department_name"),
        )
    elif token == settings.DEMO_CITIZEN_TOKEN:
        u = DEMO_USERS["citizen"]
        return DemoUser(
            user_id=u["user_id"],
            username=u["username"],
            role="citizen",
            display_name=u["display_name"],
        )
    elif token == settings.DEMO_CITIZEN2_TOKEN:
        u = DEMO_USERS["citizen2"]
        return DemoUser(
            user_id=u["user_id"],
            username=u["username"],
            role="citizen",
            display_name=u["display_name"],
        )

    return None


def require_demo_officer(
    user: Optional[DemoUser] = Depends(get_current_demo_user),
) -> DemoUser:
    """Enforces that the caller has department officer or admin permissions."""
    if not user or user.role not in ["officer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Access denied: Department Officer privileges required. "
                "Please authenticate using an authorized Department Officer account (officer / officer123)."
            ),
        )
    return user


def require_demo_admin(
    user: Optional[DemoUser] = Depends(get_current_demo_user),
) -> DemoUser:
    """Enforces that the caller has admin permissions in the demo environment."""
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Access denied: Admin demo privileges required. "
                "Please authenticate using the Demo Admin account (admin / admin123)."
            ),
        )
    return user


def require_demo_user(
    user: Optional[DemoUser] = Depends(get_current_demo_user),
) -> DemoUser:
    """Requires an authenticated demo user (citizen, officer, or admin)."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Demo authentication required. Please provide a valid demo token.",
        )
    return user
