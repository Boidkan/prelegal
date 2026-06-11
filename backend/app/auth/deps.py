"""FastAPI dependencies for resolving the authenticated user."""

from __future__ import annotations

import sqlite3

from fastapi import Cookie, Depends, HTTPException, status

from ..database import get_connection
from .models import UserResponse
from .security import COOKIE_NAME, decode_access_token


def _row_to_user(row: sqlite3.Row) -> UserResponse:
    return UserResponse(id=row["id"], email=row["email"], created_at=row["created_at"])


def get_current_user(
    prelegal_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> UserResponse:
    """Resolve the current user from the session cookie, or 401."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
    )
    if not prelegal_session:
        raise unauthorized

    user_id = decode_access_token(prelegal_session)
    if user_id is None:
        raise unauthorized

    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()

    if row is None:
        raise unauthorized
    return _row_to_user(row)


CurrentUser = Depends(get_current_user)
