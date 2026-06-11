"""Request and response schemas for the auth endpoints."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class Credentials(BaseModel):
    """Email + password payload shared by signup and signin."""

    email: EmailStr
    # Bcrypt hashes the first 72 bytes only; cap length to avoid silent
    # truncation surprises while still allowing strong passphrases.
    password: str = Field(min_length=8, max_length=72)


class UserResponse(BaseModel):
    """Public-facing representation of a user."""

    id: int
    email: EmailStr
    created_at: str
