"""Unit tests for the document registry, draft merge, and completeness."""

from __future__ import annotations

import pytest

from app.documents import registry
from app.documents.models import (
    DocumentDraft,
    apply_field_update,
    apply_party_update,
    apply_table_update,
    missing_fields,
)

EXPECTED_IDS = {
    "mutual-nda", "csa", "design-partner", "sla", "psa", "dpa",
    "software-license", "partnership", "pilot", "baa", "ai-addendum",
}


def test_all_eleven_specs_load() -> None:
    ids = {s.id for s in registry.all_specs()}
    assert ids == EXPECTED_IDS


@pytest.mark.parametrize("spec", registry.all_specs(), ids=lambda s: s.id)
def test_spec_is_well_formed(spec) -> None:
    assert spec.name and spec.description
    assert spec.parties
    for section in spec.sections:
        for field in section.fields:
            if field.type == "choice":
                assert field.options, f"{spec.id}.{field.key} choice needs options"
    # Standard Terms text is present and substantial.
    assert len(registry.standard_terms(spec.id)) > 400


def test_field_update_ignores_unknown_keys() -> None:
    spec = registry.get("mutual-nda")
    draft = DocumentDraft(type_id="mutual-nda")
    apply_field_update(draft, spec, "governingLaw", "Delaware")
    apply_field_update(draft, spec, "notARealKey", "x")
    assert draft.values == {"governingLaw": "Delaware"}


def test_party_update_sets_notice_address() -> None:
    spec = registry.get("mutual-nda")
    draft = DocumentDraft(type_id="mutual-nda")
    apply_party_update(draft, spec, "party1", "noticeAddress", "a@b.com")
    apply_party_update(draft, spec, "bogusRole", "name", "Nope")
    assert draft.parties["party1"].notice_address == "a@b.com"
    assert "bogusRole" not in draft.parties


def test_table_update_grows_rows() -> None:
    spec = registry.get("dpa")
    draft = DocumentDraft(type_id="dpa")
    table_key = spec.tables[0].key
    col = spec.tables[0].columns[0].key
    apply_table_update(draft, spec, table_key, 1, col, "AWS")
    # Row 0 is created empty so row 1 can exist.
    assert len(draft.tables[table_key]) == 2
    assert draft.tables[table_key][1][col] == "AWS"


def test_missing_fields_for_empty_nda() -> None:
    spec = registry.get("mutual-nda")
    missing = missing_fields(DocumentDraft(type_id="mutual-nda"), spec)
    assert "Effective Date" in missing
    assert "Party 1 name" in missing


def test_missing_fields_empty_when_complete() -> None:
    spec = registry.get("mutual-nda")
    draft = DocumentDraft(type_id="mutual-nda")
    draft.values = {
        "effectiveDate": "2026-01-01",
        "governingLaw": "Delaware",
        "jurisdiction": "New Castle, Delaware",
    }
    for role in ("party1", "party2"):
        apply_party_update(draft, spec, role, "name", "X")
        apply_party_update(draft, spec, role, "company", "Y Co")
        apply_party_update(draft, spec, role, "noticeAddress", "x@y.com")
    assert missing_fields(draft, spec) == []


# --------------------------------------------------------------------------- #
# API endpoints
# --------------------------------------------------------------------------- #
def test_types_requires_auth(client) -> None:
    client.cookies.clear()
    assert client.get("/api/documents/types").status_code == 401


def test_list_types_returns_all(client) -> None:
    client.post("/api/auth/signup", json={"email": "d@e.com", "password": "password1"})
    response = client.get("/api/documents/types")
    assert response.status_code == 200
    assert {s["id"] for s in response.json()} == EXPECTED_IDS


def test_standard_terms_known_and_unknown(client) -> None:
    client.post("/api/auth/signup", json={"email": "d@e.com", "password": "password1"})
    ok = client.get("/api/documents/types/mutual-nda/standard-terms")
    assert ok.status_code == 200
    assert len(ok.json()["text"]) > 400
    assert client.get("/api/documents/types/nope/standard-terms").status_code == 404
