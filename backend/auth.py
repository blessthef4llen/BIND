"""
backend/auth.py — Hackathon-grade auth for Pulse

Simple JWT-based auth using PyJWT.
Users register with a username + 4-digit PIN (easy to demo).
Every protected route reads the Bearer token and resolves user_id.

No email, no OAuth — just fast, demo-safe auth that shows we took
user data isolation seriously.
"""

import os
import jwt
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import database as db

SECRET_KEY = os.getenv("JWT_SECRET", "pulse-hackathon-secret-2026-ibm")
ALGORITHM  = "HS256"
TOKEN_TTL_HOURS = 72   # 3-day sessions — fine for a hackathon demo

_bearer = HTTPBearer(auto_error=False)


# ── Token creation ────────────────────────────────────────────────────────────

def create_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Token verification ────────────────────────────────────────────────────────

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ── FastAPI dependency ────────────────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)
) -> dict:
    """
    Dependency: require a valid JWT.
    Returns the user dict from the DB.
    Raises 401 if missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)
) -> Optional[dict]:
    """Like get_current_user but returns None instead of raising (for public routes)."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    return db.get_user_by_id(payload["sub"])