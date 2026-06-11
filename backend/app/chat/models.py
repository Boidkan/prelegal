"""API and LLM schemas for the chat endpoints."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from ..nda.models import CamelModel, NdaDraft, NdaUpdates

#: Upper bound on a single message; generous for chat, guards against abuse.
MAX_MESSAGE_CHARS = 4000


class ChatMessage(BaseModel):
    """One turn of the conversation."""

    role: Literal["user", "assistant"]
    content: str = Field(max_length=MAX_MESSAGE_CHARS)


class ChatRequest(CamelModel):
    """Inbound: the conversation so far plus the draft built up by the client."""

    messages: list[ChatMessage]
    draft: NdaDraft = NdaDraft()


class ChatResponse(CamelModel):
    """Outbound: the assistant reply and the merged draft state."""

    reply: str
    draft: NdaDraft
    complete: bool
    missing_fields: list[str]


class NdaTurn(BaseModel):
    """Structured output the LLM must return each turn.

    ``updates`` carries only fields learned this turn; ``complete`` is the
    model's own view but the server recomputes completeness authoritatively.
    """

    reply: str
    updates: NdaUpdates
    complete: bool
