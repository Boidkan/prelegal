"""The Mutual NDA cover-page draft, mirroring the frontend `NdaForm` model.

Two shapes live here:

* :class:`NdaDraft` / :class:`Party` — the full, defaulted draft that the chat
  builds up and the frontend renders.
* :class:`NdaUpdates` / :class:`PartyUpdates` — an all-optional patch the LLM
  emits each turn with just the fields it learned, merged server-side.

JSON is camelCase (e.g. ``noticeAddress``) so it maps 1:1 onto the frontend
``NdaForm`` without translation.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

MndaTermKind = Literal["expires", "untilTerminated"]
ConfidentialityKind = Literal["years", "perpetuity"]


class CamelModel(BaseModel):
    """Base model that serializes to camelCase but accepts either casing."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Party(CamelModel):
    name: str = ""
    title: str = ""
    company: str = ""
    notice_address: str = ""


class NdaDraft(CamelModel):
    """A complete (if partially filled) Mutual NDA cover page."""

    purpose: str = (
        "Evaluating whether to enter into a business relationship with the "
        "other party."
    )
    effective_date: str = ""
    mnda_term_kind: MndaTermKind = "expires"
    mnda_term_years: int = 1
    confidentiality_kind: ConfidentialityKind = "years"
    confidentiality_years: int = 1
    governing_law: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: Party = Party()
    party2: Party = Party()


class PartyUpdates(CamelModel):
    name: str | None = None
    title: str | None = None
    company: str | None = None
    notice_address: str | None = None


class NdaUpdates(CamelModel):
    """A patch of newly-learned fields. ``None`` means "leave unchanged"."""

    purpose: str | None = None
    effective_date: str | None = None
    mnda_term_kind: MndaTermKind | None = None
    mnda_term_years: int | None = None
    confidentiality_kind: ConfidentialityKind | None = None
    confidentiality_years: int | None = None
    governing_law: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    party1: PartyUpdates | None = None
    party2: PartyUpdates | None = None


def _apply_party(party: Party, updates: PartyUpdates | None) -> Party:
    if updates is None:
        return party
    patch = updates.model_dump(exclude_none=True)
    return party.model_copy(update=patch)


def merge_updates(draft: NdaDraft, updates: NdaUpdates) -> NdaDraft:
    """Return a new draft with ``updates`` applied over ``draft``.

    Only non-null update fields override; party patches merge field-by-field.
    """
    patch = updates.model_dump(exclude_none=True, exclude={"party1", "party2"})
    merged = draft.model_copy(update=patch)
    merged.party1 = _apply_party(draft.party1, updates.party1)
    merged.party2 = _apply_party(draft.party2, updates.party2)
    return merged


#: Required fields as (human label, accessor) pairs, used for completeness.
_REQUIRED: list[tuple[str, str]] = [
    ("effective date", "effective_date"),
    ("governing law", "governing_law"),
    ("jurisdiction", "jurisdiction"),
    ("Party 1 name", "party1.name"),
    ("Party 1 company", "party1.company"),
    ("Party 1 notice address", "party1.notice_address"),
    ("Party 2 name", "party2.name"),
    ("Party 2 company", "party2.company"),
    ("Party 2 notice address", "party2.notice_address"),
]


def _get(draft: NdaDraft, path: str) -> str:
    value: object = draft
    for part in path.split("."):
        value = getattr(value, part)
    return str(value)


def missing_fields(draft: NdaDraft) -> list[str]:
    """Human-readable labels of required fields still blank."""
    return [label for label, path in _REQUIRED if not _get(draft, path).strip()]
