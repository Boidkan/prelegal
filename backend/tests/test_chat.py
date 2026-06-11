"""Tests for the generic chat service and endpoints, with the LLM mocked."""

from __future__ import annotations

from app.chat import service
from app.chat.models import (
    ChatMessage,
    ChatRequest,
    DocumentTurn,
    FieldUpdate,
    PartyUpdate,
    TableUpdate,
)
from app.documents.models import DocumentDraft, PartyInfo

CREDS = {"email": "chat@example.com", "password": "correct-horse"}


def _turn(**kw) -> DocumentTurn:
    base = dict(
        reply="ok",
        document_type=None,
        field_updates=[],
        party_updates=[],
        table_updates=[],
        complete=False,
    )
    base.update(kw)
    return DocumentTurn(**base)


def _nda_full_turn() -> DocumentTurn:
    return _turn(
        reply="All set!",
        document_type="mutual-nda",
        field_updates=[
            FieldUpdate(key="effectiveDate", value="2026-01-01"),
            FieldUpdate(key="governingLaw", value="Delaware"),
            FieldUpdate(key="jurisdiction", value="New Castle, Delaware"),
        ],
        party_updates=[
            PartyUpdate(role="party1", field="name", value="Alice"),
            PartyUpdate(role="party1", field="company", value="Acme"),
            PartyUpdate(role="party1", field="noticeAddress", value="a@acme.com"),
            PartyUpdate(role="party2", field="name", value="Bob"),
            PartyUpdate(role="party2", field="company", value="Globex"),
            PartyUpdate(role="party2", field="noticeAddress", value="b@globex.com"),
        ],
        complete=True,
    )


def test_detects_type_and_completes(monkeypatch) -> None:
    monkeypatch.setattr(service, "complete_structured", lambda m, s: _nda_full_turn())
    result = service.respond(
        ChatRequest(messages=[ChatMessage(role="user", content="an NDA, details...")])
    )
    assert result.document_type == "mutual-nda"
    assert result.complete is True
    assert result.missing_fields == []
    assert result.draft.parties["party1"].name == "Alice"


def test_unsupported_request_stays_typeless(monkeypatch) -> None:
    monkeypatch.setattr(
        service,
        "complete_structured",
        lambda m, s: _turn(
            reply="I can't do an employment contract, but a Mutual NDA is closest…",
            document_type=None,
        ),
    )
    result = service.respond(
        ChatRequest(messages=[ChatMessage(role="user", content="employment contract")])
    )
    assert result.document_type is None
    assert result.complete is False


def test_partial_reports_missing(monkeypatch) -> None:
    monkeypatch.setattr(
        service,
        "complete_structured",
        lambda m, s: _turn(
            document_type="mutual-nda",
            field_updates=[FieldUpdate(key="governingLaw", value="Delaware")],
            complete=True,  # model over-claims; server overrides
        ),
    )
    result = service.respond(
        ChatRequest(messages=[ChatMessage(role="user", content="NDA, Delaware")])
    )
    assert result.complete is False
    assert "Effective Date" in result.missing_fields


def test_table_updates_merge(monkeypatch) -> None:
    monkeypatch.setattr(
        service,
        "complete_structured",
        lambda m, s: _turn(
            document_type="dpa",
            table_updates=[
                TableUpdate(table="approvedSubprocessors", row=0, key="name", value="AWS")
            ],
        ),
    )
    result = service.respond(
        ChatRequest(messages=[ChatMessage(role="user", content="a DPA")])
    )
    assert result.document_type == "dpa"
    assert result.draft.tables["approvedSubprocessors"][0]["name"] == "AWS"


def test_type_switch_drops_incompatible_parties(monkeypatch) -> None:
    # Start as an NDA with a party1, then the model switches to a CSA. party1
    # is not a CSA role, so it must be dropped (not carried as stale state).
    monkeypatch.setattr(
        service, "complete_structured", lambda m, s: _turn(document_type="csa")
    )
    nda_draft = DocumentDraft(type_id="mutual-nda")
    nda_draft.parties["party1"] = PartyInfo(name="Alice", company="Acme")
    result = service.respond(
        ChatRequest(
            messages=[ChatMessage(role="user", content="actually make it a CSA")],
            draft=nda_draft,
        )
    )
    assert result.document_type == "csa"
    assert "party1" not in result.draft.parties


def test_unknown_incoming_type_is_cleared(monkeypatch) -> None:
    monkeypatch.setattr(service, "complete_structured", lambda m, s: _turn())
    result = service.respond(
        ChatRequest(
            messages=[ChatMessage(role="user", content="hi")],
            draft=DocumentDraft(type_id="not-a-real-type"),
        )
    )
    assert result.document_type is None


def test_message_requires_auth(client) -> None:
    client.cookies.clear()
    assert client.post("/api/chat/message", json={"messages": []}).status_code == 401


def test_greeting_returns_message(client) -> None:
    client.post("/api/auth/signup", json=CREDS)
    response = client.get("/api/chat/greeting")
    assert response.status_code == 200
    assert response.json()["reply"]


def test_message_returns_merged_draft(client, monkeypatch) -> None:
    monkeypatch.setattr(service, "complete_structured", lambda m, s: _nda_full_turn())
    client.post("/api/auth/signup", json=CREDS)
    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "NDA with all details"}]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "mutual-nda"
    assert body["complete"] is True
    assert body["draft"]["parties"]["party2"]["noticeAddress"] == "b@globex.com"


def test_message_handles_llm_failure(client, monkeypatch) -> None:
    def _boom(messages, schema):
        raise RuntimeError("LLM down")

    monkeypatch.setattr(service, "complete_structured", _boom)
    client.post("/api/auth/signup", json=CREDS)
    response = client.post(
        "/api/chat/message", json={"messages": [{"role": "user", "content": "hi"}]}
    )
    assert response.status_code == 502
