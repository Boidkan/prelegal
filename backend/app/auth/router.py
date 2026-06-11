"""Auth endpoints: signup, signin, signout, and current-user lookup."""

from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..config import settings
from ..database import get_connection
from .deps import get_current_user
from .models import Credentials, UserResponse
from .security import (
    COOKIE_NAME,
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(response: Response, user_id: int) -> None:
    """Attach the signed session token as an HttpOnly cookie."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=create_access_token(user_id),
        max_age=settings.jwt_ttl_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(credentials: Credentials, response: Response) -> UserResponse:
    """Create a new account and start a session."""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (credentials.email, hash_password(credentials.password)),
            )
        except sqlite3.IntegrityError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with that email already exists",
            ) from exc

        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    if row is None:  # pragma: no cover - INSERT succeeded, so this can't happen
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account was created but could not be loaded",
        )

    _set_session_cookie(response, row["id"])
    return UserResponse(id=row["id"], email=row["email"], created_at=row["created_at"])


@router.post("/signin", response_model=UserResponse)
def signin(credentials: Credentials, response: Response) -> UserResponse:
    """Verify credentials and start a session."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (credentials.email,),
        ).fetchone()

    if row is None or not verify_password(credentials.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    _set_session_cookie(response, row["id"])
    return UserResponse(id=row["id"], email=row["email"], created_at=row["created_at"])


@router.post("/signout")
def signout(response: Response) -> dict[str, bool]:
    """Clear the session cookie."""
    # Mirror the attributes used when setting the cookie; browsers ignore a
    # deletion whose Secure/SameSite attributes don't match the original.
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
def me(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user."""
    return current_user
