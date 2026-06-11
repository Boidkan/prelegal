"""Unit tests for the NDA draft merge + completeness logic."""

from __future__ import annotations

from app.nda.models import (
    NdaDraft,
    NdaUpdates,
    Party,
    PartyUpdates,
    merge_updates,
    missing_fields,
)


def test_merge_applies_only_non_null_fields() -> None:
    draft = NdaDraft(governing_law="Delaware")
    updates = NdaUpdates(jurisdiction="New Castle, Delaware")
    merged = merge_updates(draft, updates)
    assert merged.governing_law == "Delaware"  # preserved
    assert merged.jurisdiction == "New Castle, Delaware"  # applied


def test_merge_party_is_field_level() -> None:
    draft = NdaDraft(party1=Party(name="Alice", company="Acme"))
    updates = NdaUpdates(party1=PartyUpdates(notice_address="alice@acme.com"))
    merged = merge_updates(draft, updates)
    assert merged.party1.name == "Alice"  # untouched
    assert merged.party1.company == "Acme"  # untouched
    assert merged.party1.notice_address == "alice@acme.com"  # added


def test_missing_fields_lists_blanks() -> None:
    missing = missing_fields(NdaDraft())
    assert "effective date" in missing
    assert "Party 1 name" in missing
    assert len(missing) == 9


def test_missing_fields_empty_when_complete() -> None:
    draft = NdaDraft(
        effective_date="2026-01-01",
        governing_law="Delaware",
        jurisdiction="New Castle, Delaware",
        party1=Party(name="Alice", company="Acme", notice_address="alice@acme.com"),
        party2=Party(name="Bob", company="Globex", notice_address="bob@globex.com"),
    )
    assert missing_fields(draft) == []
