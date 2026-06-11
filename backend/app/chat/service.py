"""Conversation orchestration: prompt the LLM, merge its extractions, and
report completeness."""

from __future__ import annotations

import json

from ..nda.models import NdaDraft, merge_updates, missing_fields
from .llm import complete_structured
from .models import ChatRequest, ChatResponse, NdaTurn

#: Cap the conversation turns forwarded to the LLM (keeps cost/context bounded).
MAX_HISTORY = 40

GREETING = (
    "Hi! I'll help you put together a Mutual Non-Disclosure Agreement. "
    "To get started, who are the two parties signing it — their names, "
    "companies, and a contact (email or postal) address for each?"
)

_SYSTEM_PROMPT = """\
You are a friendly assistant that helps a user create a Mutual Non-Disclosure \
Agreement (MNDA) based on the Common Paper standard template. Through a natural \
conversation, gather the information needed to fill in the cover page.

Fields to collect:
- purpose: how the confidential information may be used (a sensible default \
already exists; only change it if the user wants something specific).
- effectiveDate: the date the agreement takes effect, as an ISO date \
(YYYY-MM-DD).
- mndaTermKind: "expires" (after a number of years) or "untilTerminated".
- mndaTermYears: number of years until the MNDA expires (if it expires).
- confidentialityKind: "years" or "perpetuity".
- confidentialityYears: number of years confidentiality lasts (if "years").
- governingLaw: the U.S. state whose law governs (e.g. "Delaware").
- jurisdiction: the city/county and state where disputes are handled \
(e.g. "New Castle, Delaware").
- modifications: any changes to the standard terms (optional; leave blank if \
none).
- party1 and party2, each with: name (the signer), title, company, \
noticeAddress (email or postal address).

Guidelines:
- Ask about one or two related things at a time. Keep replies short and warm.
- Extract every value the user provides into `updates`, using only the fields \
you actually learned this turn. Leave unknown fields null.
- Map dates to YYYY-MM-DD. Infer obvious values (e.g. a state name) but don't \
invent party details.
- When required information is still missing, your `reply` should ask for the \
next missing piece. When everything required is present, confirm warmly and let \
them know they can download the agreement.
- Set `complete` to true only when all required fields are filled.\
"""


def _context_message(draft: NdaDraft, missing: list[str]) -> dict[str, str]:
    """A context snapshot of the draft + what's still needed.

    Sent as a ``user`` role message (not ``system``): it embeds previously
    extracted, user-derived values, which shouldn't be treated as trusted
    system instructions.
    """
    draft_json = json.dumps(draft.model_dump(by_alias=True), indent=2)
    missing_text = ", ".join(missing) if missing else "none — all required fields filled"
    return {
        "role": "user",
        "content": (
            f"[Current draft so far]\n{draft_json}\n\n"
            f"Required fields still missing: {missing_text}"
        ),
    }


def respond(request: ChatRequest) -> ChatResponse:
    """Run one assistant turn: extract fields, merge, and report state."""
    missing_before = missing_fields(request.draft)
    history = request.messages[-MAX_HISTORY:]
    messages: list[dict[str, str]] = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        _context_message(request.draft, missing_before),
        *({"role": m.role, "content": m.content} for m in history),
    ]

    turn = complete_structured(messages, NdaTurn)

    draft = merge_updates(request.draft, turn.updates)
    missing = missing_fields(draft)
    return ChatResponse(
        reply=turn.reply,
        draft=draft,
        complete=len(missing) == 0,
        missing_fields=missing,
    )
