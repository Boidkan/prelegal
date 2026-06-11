"""Health check endpoint used by scripts and container orchestration."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
def health() -> dict[str, str]:
    """Return a simple liveness signal."""
    return {"status": "ok"}
