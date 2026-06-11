"""Loads the document specs and exposes lookups plus prompt-building helpers."""

from __future__ import annotations

import json
from functools import cache
from pathlib import Path

from .models import DocumentSpec

_DIR = Path(__file__).resolve().parent
_SPECS_DIR = _DIR / "specs"
_TERMS_DIR = _DIR / "standard_terms"


@cache
def _load() -> dict[str, DocumentSpec]:
    specs: dict[str, DocumentSpec] = {}
    for path in sorted(_SPECS_DIR.glob("*.json")):
        spec = DocumentSpec.model_validate_json(path.read_text())
        specs[spec.id] = spec
    return specs


def all_specs() -> list[DocumentSpec]:
    return list(_load().values())


def get(type_id: str) -> DocumentSpec | None:
    return _load().get(type_id)


def has(type_id: str) -> bool:
    return type_id in _load()


@cache
def standard_terms(type_id: str) -> str:
    """The verbatim Standard Terms text for a type (empty if absent)."""
    path = _TERMS_DIR / f"{type_id}.md"
    return path.read_text() if path.exists() else ""


def catalog_summary() -> str:
    """One line per supported document, for type detection in the prompt."""
    return "\n".join(f'- {s.id}: {s.name} — {s.description}' for s in all_specs())


def field_guide(spec: DocumentSpec) -> str:
    """A description of a type's fields/parties/tables for the prompt."""
    lines: list[str] = [f"You are collecting details for a {spec.name}.", ""]
    lines.append("Parties (each needs name, title, company, noticeAddress):")
    lines += [f"  - role '{p.role}': {p.label}" for p in spec.parties]
    lines.append("")
    lines.append("Fields (use the exact key):")
    for section in spec.sections:
        lines.append(f"  [{section.title}]")
        for f in section.fields:
            bits = [f"key '{f.key}'", f.type]
            if f.required:
                bits.append("required")
            if f.options:
                bits.append("one of: " + " | ".join(f.options))
            if f.help:
                bits.append(f.help)
            lines.append(f"    - {f.label} ({', '.join(bits)})")
    if spec.tables:
        lines.append("")
        lines.append("Tables (repeating rows; address rows by 0-based rowIndex):")
        for t in spec.tables:
            cols = ", ".join(f"'{c.key}'" for c in t.columns)
            req = " (at least one row required)" if t.required else ""
            lines.append(f"  - table '{t.key}' ({t.label}){req}: columns {cols}")
    return "\n".join(lines)
