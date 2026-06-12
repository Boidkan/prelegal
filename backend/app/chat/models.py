"""API and LLM schemas for the (now generic) chat endpoints."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from ..documents.models import CamelModel, DocumentDraft

#: Upper bound on a single message; generous for chat, guards against abuse.
MAX_MESSAGE_CHARS = 4000


class ChatMessage(BaseModel):
    """One turn of the conversation."""

    role: Literal["user", "assistant"]
    content: str = Field(max_length=MAX_MESSAGE_CHARS)


class ChatRequest(CamelModel):
    """Inbound: the conversation so far plus the draft built up by the client."""

    messages: list[ChatMessage]
    draft: DocumentDraft = DocumentDraft()


class ChatResponse(CamelModel):
    """Outbound: assistant reply, the merged draft, and progress state."""

    reply: str
    draft: DocumentDraft
    document_type: str | None
    complete: bool
    missing_fields: list[str]


# --------------------------------------------------------------------------- #
# LLM structured output
# --------------------------------------------------------------------------- #
class FieldUpdate(BaseModel):
    key: str
    value: str


class PartyUpdate(BaseModel):
    role: str
    field: str  # one of name | title | company | noticeAddress
    value: str


class TableUpdate(BaseModel):
    table: str
    row: int  # 0-based row index
    key: str
    value: str


class DocumentTurn(BaseModel):
    """Structured output the LLM must return each turn.

    ``document_type`` is the chosen template id (or null while undetermined);
    the ``*_updates`` carry only what was learned this turn. The server merges
    and recomputes completeness authoritatively.
    """

    reply: str
    document_type: str | None
    field_updates: list[FieldUpdate]
    party_updates: list[PartyUpdate]
    table_updates: list[TableUpdate]
    complete: bool
