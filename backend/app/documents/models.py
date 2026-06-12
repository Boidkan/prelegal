"""Generic document model: type specs, the in-progress draft, merge, and
completeness — all driven by the per-type JSON specs in ``specs/``."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

FieldType = Literal[
    "text", "multiline", "date", "number", "currency", "percent", "choice"
]

#: Sub-fields every party has, regardless of document type.
PARTY_FIELDS = ("name", "title", "company", "noticeAddress")
#: Party sub-fields required for completeness, mapped to display labels.
PARTY_REQUIRED = {"name": "name", "company": "company", "noticeAddress": "notice address"}

#: Hard cap on table rows to bound a runaway LLM `row` index.
MAX_TABLE_ROWS = 100


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# --------------------------------------------------------------------------- #
# Spec (loaded from specs/<id>.json)
# --------------------------------------------------------------------------- #
class FieldSpec(CamelModel):
    key: str
    label: str
    type: FieldType
    required: bool = False
    help: str | None = None
    options: list[str] | None = None
    default: str | None = None


class TableSpec(CamelModel):
    key: str
    label: str
    required: bool = False
    columns: list[FieldSpec]


class PartyRole(CamelModel):
    role: str
    label: str


class Section(CamelModel):
    title: str
    fields: list[FieldSpec]


class DocumentSpec(CamelModel):
    id: str
    name: str
    description: str
    keywords: list[str] = []
    parties: list[PartyRole]
    sections: list[Section]
    tables: list[TableSpec] = []

    def field(self, key: str) -> FieldSpec | None:
        for section in self.sections:
            for f in section.fields:
                if f.key == key:
                    return f
        return None

    def table(self, key: str) -> TableSpec | None:
        return next((t for t in self.tables if t.key == key), None)

    def has_role(self, role: str) -> bool:
        return any(p.role == role for p in self.parties)


# --------------------------------------------------------------------------- #
# Draft (the in-progress document the chat builds up)
# --------------------------------------------------------------------------- #
class PartyInfo(CamelModel):
    name: str = ""
    title: str = ""
    company: str = ""
    notice_address: str = ""


class DocumentDraft(CamelModel):
    type_id: str | None = None
    values: dict[str, str] = Field(default_factory=dict)
    parties: dict[str, PartyInfo] = Field(default_factory=dict)
    tables: dict[str, list[dict[str, str]]] = Field(default_factory=dict)


# --------------------------------------------------------------------------- #
# Merge + completeness
# --------------------------------------------------------------------------- #
def apply_field_update(draft: DocumentDraft, spec: DocumentSpec, key: str, value: str) -> None:
    if spec.field(key) is not None:
        draft.values[key] = value


def apply_party_update(
    draft: DocumentDraft, spec: DocumentSpec, role: str, field: str, value: str
) -> None:
    if not spec.has_role(role) or field not in PARTY_FIELDS:
        return
    party = draft.parties.setdefault(role, PartyInfo())
    # field is camelCase ("noticeAddress"); set via alias-aware assignment.
    setattr(party, "notice_address" if field == "noticeAddress" else field, value)


def apply_table_update(
    draft: DocumentDraft,
    spec: DocumentSpec,
    table_key: str,
    row_index: int,
    key: str,
    value: str,
) -> None:
    table = spec.table(table_key)
    if table is None or row_index < 0 or row_index >= MAX_TABLE_ROWS:
        return
    if not any(c.key == key for c in table.columns):
        return
    rows = draft.tables.setdefault(table_key, [])
    while len(rows) <= row_index:
        rows.append({})
    rows[row_index][key] = value


def missing_fields(draft: DocumentDraft, spec: DocumentSpec) -> list[str]:
    """Human-readable labels of required items still blank for this spec."""
    missing: list[str] = []
    for section in spec.sections:
        for f in section.fields:
            if f.required and not draft.values.get(f.key, "").strip():
                missing.append(f.label)
    for role in spec.parties:
        party = draft.parties.get(role.role)
        for sub, sub_label in PARTY_REQUIRED.items():
            attr = "notice_address" if sub == "noticeAddress" else sub
            if party is None or not getattr(party, attr).strip():
                missing.append(f"{role.label} {sub_label}")
    for table in spec.tables:
        if table.required and not draft.tables.get(table.key):
            missing.append(table.label)
    return missing
