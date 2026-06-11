"""Chat endpoints. Both require an authenticated user."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth.deps import get_current_user
from ..auth.models import UserResponse
from . import service
from .models import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/greeting")
def greeting(_user: UserResponse = Depends(get_current_user)) -> dict[str, str]:
    """Return the assistant's opening message."""
    return {"reply": service.GREETING}


@router.post("/message", response_model=ChatResponse)
def message(
    request: ChatRequest,
    _user: UserResponse = Depends(get_current_user),
) -> ChatResponse:
    """Process one user turn and return the assistant reply plus draft state."""
    try:
        return service.respond(request)
    except Exception as exc:  # noqa: BLE001 - surface LLM/parse failures as 502
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant is unavailable right now. Please try again.",
        ) from exc
