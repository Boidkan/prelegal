"""Conversation orchestration across all supported document types.

Detects which document the user wants (offering the closest supported option
for unsupported requests), then gathers that type's fields — merging the LLM's
extractions and recomputing completeness server-side.
"""

from __future__ import annotations

import json

from ..documents import registry
from ..documents.models import (
    DocumentDraft,
    DocumentSpec,
    apply_field_update,
    apply_party_update,
    apply_table_update,
    missing_fields,
)
from .llm import complete_structured
from .models import ChatRequest, ChatResponse, DocumentTurn

#: Cap the conversation turns forwarded to the LLM (keeps cost/context bounded).
MAX_HISTORY = 40

GREETING = (
    "Hi! I can help you create a legal agreement — for example a Mutual NDA, "
    "Cloud Service Agreement, Data Processing Agreement, Pilot Agreement, and "
    "more. What kind of document would you like to put together?"
)

_BASE_PROMPT = """\
You are a friendly assistant for Prelegal that helps users create legal \
documents, and you can ONLY produce documents from this fixed catalog of \
supported templates:

{catalog}

How to behave:
- The catalog above is the complete list of what you support. If the user names \
one of them — including by its common abbreviation (e.g. "SLA", "NDA", "DPA", \
"BAA", "PSA", "CSA") or a close paraphrase — treat it as SUPPORTED and set \
`document_type` to its id. Never tell the user a document in the catalog is \
unsupported.
- If you don't yet know which document the user wants, infer it from what they \
say or ask. Once you identify a supported one, set `document_type` to its id.
- Only if the request matches NONE of the catalog entries, briefly explain that \
you can't generate that one, then recommend the closest supported document and \
ask if they'd like to proceed. Set `document_type` once they choose a supported \
type.
- Once a document type is active, gather its fields through natural \
conversation. Ask about one or two related things at a time; keep replies short \
and warm.
- Extract values into `field_updates`, `party_updates`, and `table_updates` \
using the EXACT keys and party roles given below. Include only what you learned \
this turn; leave the rest empty.
- For party details use `party_updates` with field one of: name, title, \
company, noticeAddress. Map dates to YYYY-MM-DD. Don't invent party details.
- For repeating tables, address rows by 0-based `row` index, one item per row.
- Set `complete` to true only when all required fields are filled (the system \
verifies this too).
- When everything required is present, confirm warmly and tell them they can \
download the document.\
"""


def _system_prompt(spec: DocumentSpec | None) -> str:
    prompt = _BASE_PROMPT.format(catalog=registry.catalog_summary())
    if spec is not None:
        prompt += "\n\n" + registry.field_guide(spec)
    return prompt


def _context_message(draft: DocumentDraft, missing: list[str]) -> dict[str, str]:
    """A user-role snapshot of the draft + what's still needed."""
    draft_json = json.dumps(draft.model_dump(by_alias=True, exclude_none=True), indent=2)
    if draft.type_id is None:
        status = "No document type chosen yet."
    elif missing:
        status = "Required fields still missing: " + ", ".join(missing)
    else:
        status = "All required fields are filled."
    return {"role": "user", "content": f"[Current draft]\n{draft_json}\n\n{status}"}


def _merge(draft: DocumentDraft, spec: DocumentSpec, turn: DocumentTurn) -> None:
    for u in turn.field_updates:
        apply_field_update(draft, spec, u.key, u.value)
    for u in turn.party_updates:
        apply_party_update(draft, spec, u.role, u.field, u.value)
    for u in turn.table_updates:
        apply_table_update(draft, spec, u.table, u.row, u.key, u.value)


def _build_messages(
    spec: DocumentSpec | None, draft: DocumentDraft, history: list
) -> list[dict[str, str]]:
    missing = missing_fields(draft, spec) if spec else []
    return [
        {"role": "system", "content": _system_prompt(spec)},
        _context_message(draft, missing),
        *({"role": m.role, "content": m.content} for m in history),
    ]


def respond(request: ChatRequest) -> ChatResponse:
    """Run one assistant turn: detect type, extract fields, report state."""
    draft = request.draft.model_copy(deep=True)
    spec = registry.get(draft.type_id) if draft.type_id else None
    if draft.type_id and spec is None:
        # Stale/unknown id from the client — treat as undetermined so type
        # detection can run again instead of getting stuck.
        draft.type_id = None
        spec = None
    history = request.messages[-MAX_HISTORY:]

    turn = complete_structured(_build_messages(spec, draft, history), DocumentTurn)

    # Type selection / switching. Switching keeps compatible party info but
    # resets the type-specific field/table values (their keys differ per type).
    chosen = turn.document_type
    if chosen and registry.has(chosen) and chosen != draft.type_id:
        new_spec = registry.get(chosen)
        keep = {p.role for p in new_spec.parties}
        draft = DocumentDraft(
            type_id=chosen,
            parties={r: info for r, info in draft.parties.items() if r in keep},
        )
        spec = new_spec
        # Re-run now that the chosen type's field guide is in the prompt, so any
        # details given in the same message are captured instead of lost.
        turn = complete_structured(_build_messages(spec, draft, history), DocumentTurn)

    if spec is not None:
        _merge(draft, spec, turn)

    missing = missing_fields(draft, spec) if spec else []
    return ChatResponse(
        reply=turn.reply,
        draft=draft,
        document_type=draft.type_id,
        complete=spec is not None and not missing,
        missing_fields=missing,
    )
