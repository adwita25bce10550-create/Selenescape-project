"""
Authentication Router for SELENESCAPE
Provides session-based and mock JWT token support for mission specialists.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict
import uuid
import hashlib
import re

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# In-memory user database pre-seeded with Mission Director
USERS_DB: Dict[str, dict] = {
    "commander@selenescape.org": {
        "id": "usr-commander-01",
        "email": "commander@selenescape.org",
        "full_name": "Commander Elena Vance",
        "callsign": "ARTEMIS-LEAD",
        "role": "Flight Director",
        "password_hash": hashlib.sha256("Moon2026!".encode()).hexdigest(),
        "created_at": "2026-01-15T00:00:00Z"
    }
}

ACTIVE_SESSIONS: Dict[str, str] = {} # token -> email

class RegisterRequest(BaseModel):
    email: str
    password: str
    confirm_password: str
    full_name: Optional[str] = "Mission Specialist"
    callsign: Optional[str] = "SELEN-1"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    callsign: str
    role: str

class AuthSuccessResponse(BaseModel):
    token: str
    user: UserResponse
    message: str

def get_current_user_email(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return ACTIVE_SESSIONS.get(token)

@router.post("/register", response_model=AuthSuccessResponse)
def register(req: RegisterRequest):
    if not EMAIL_REGEX.match(req.email):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    if req.email in USERS_DB:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    pwd_hash = hashlib.sha256(req.password.encode()).hexdigest()
    user_record = {
        "id": user_id,
        "email": req.email,
        "full_name": req.full_name or "Lunar Explorer",
        "callsign": req.callsign or "EXPLORER",
        "role": "Mission Specialist",
        "password_hash": pwd_hash,
        "created_at": "2026-11-21T22:00:00Z"
    }
    USERS_DB[req.email] = user_record

    session_token = f"sls-tok-{uuid.uuid4().hex}"
    ACTIVE_SESSIONS[session_token] = req.email

    return AuthSuccessResponse(
        token=session_token,
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            full_name=user_record["full_name"],
            callsign=user_record["callsign"],
            role=user_record["role"]
        ),
        message="Registration successful. Welcome to SELENESCAPE Mission Operations."
    )

@router.post("/login", response_model=AuthSuccessResponse)
def login(req: LoginRequest):
    user = USERS_DB.get(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid mission credentials or user not found.")
    
    pwd_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if pwd_hash != user["password_hash"]:
        raise HTTPException(status_code=401, detail="Incorrect security passcode.")

    session_token = f"sls-tok-{uuid.uuid4().hex}"
    ACTIVE_SESSIONS[session_token] = req.email

    return AuthSuccessResponse(
        token=session_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            callsign=user["callsign"],
            role=user["role"]
        ),
        message=f"Access granted. Welcome back, {user['callsign']}."
    )

@router.get("/me", response_model=UserResponse)
def get_profile(authorization: Optional[str] = Header(None)):
    email = get_current_user_email(authorization)
    if not email or email not in USERS_DB:
        # Default to simulated Commander profile if running locally without bearer header
        user = USERS_DB["commander@selenescape.org"]
        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            callsign=user["callsign"],
            role=user["role"]
        )
    user = USERS_DB[email]
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        callsign=user["callsign"],
        role=user["role"]
    )

@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        ACTIVE_SESSIONS.pop(token, None)
    return {"status": "success", "message": "Session terminated safely."}
