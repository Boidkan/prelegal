"""Document metadata endpoints: list specs and fetch Standard Terms.

All require an authenticated user (the app is sign-in gated).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth.deps import get_current_user
from ..auth.models import UserResponse
from . import registry
from .models import DocumentSpec

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("/types", response_model=list[DocumentSpec])
def list_types(_user: UserResponse = Depends(get_current_user)) -> list[DocumentSpec]:
    """All supported document type specs (used by the frontend to render)."""
    return registry.all_specs()


@router.get("/types/{type_id}/standard-terms")
def standard_terms(
    type_id: str, _user: UserResponse = Depends(get_current_user)
) -> dict[str, str]:
    """The verbatim Standard Terms text for a type, embedded into downloads."""
    if not registry.has(type_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Unknown document type"
        )
    return {"text": registry.standard_terms(type_id)}
