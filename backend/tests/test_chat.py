"""Tests for the chat service and endpoints, with the LLM mocked."""

from __future__ import annotations

import pytest

from app.chat import service
from app.chat.models import ChatMessage, ChatRequest, NdaTurn
from app.nda.models import NdaDraft, NdaUpdates, Party, PartyUpdates

CREDS = {"email": "chat@example.com", "password": "correct-horse"}


def _full_updates() -> NdaUpdates:
    """Updates that fill every required field in one turn."""
    return NdaUpdates(
        effective_date="2026-01-01",
        governing_law="Delaware",
        jurisdiction="New Castle, Delaware",
        party1=PartyUpdates(
            name="Alice", company="Acme", notice_address="alice@acme.com"
        ),
        party2=PartyUpdates(
            name="Bob", company="Globex", notice_address="bob@globex.com"
        ),
    )


def test_respond_merges_and_completes(monkeypatch) -> None:
    monkeypatch.setattr(
        service,
        "complete_structured",
        lambda messages, schema: NdaTurn(
            reply="All set!", updates=_full_updates(), complete=True
        ),
    )
    result = service.respond(
        ChatRequest(messages=[ChatMessage(role="user", content="here are details")])
    )
    assert result.complete is True
    assert result.missing_fields == []
    assert result.draft.party1.name == "Alice"
    assert result.reply == "All set!"


def test_respond_reports_missing_when_partial(monkeypatch) -> None:
    monkeypatch.setattr(
        service,
        "complete_structured",
        lambda messages, schema: NdaTurn(
            reply="Who's party 2?",
            updates=NdaUpdates(
                party1=PartyUpdates(
                    name="Alice", company="Acme", notice_address="alice@acme.com"
                )
            ),
            complete=True,  # model over-claims; server must override
        ),
    )
    result = service.respond(
        ChatRequest(messages=[ChatMessage(role="user", content="party 1 is Alice")])
    )
    assert result.complete is False  # server recomputed
    assert "Party 2 name" in result.missing_fields
    assert result.draft.party1.company == "Acme"


def test_greeting_requires_auth(client) -> None:
    client.cookies.clear()
    assert client.get("/api/chat/greeting").status_code == 401


def test_greeting_returns_message_when_authed(client) -> None:
    client.post("/api/auth/signup", json=CREDS)
    response = client.get("/api/chat/greeting")
    assert response.status_code == 200
    assert response.json()["reply"]


def test_message_requires_auth(client) -> None:
    client.cookies.clear()
    response = client.post("/api/chat/message", json={"messages": []})
    assert response.status_code == 401


def test_message_returns_merged_draft(client, monkeypatch) -> None:
    monkeypatch.setattr(
        service,
        "complete_structured",
        lambda messages, schema: NdaTurn(
            reply="Got it!", updates=_full_updates(), complete=True
        ),
    )
    client.post("/api/auth/signup", json=CREDS)
    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "all the details"}]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["complete"] is True
    assert body["missingFields"] == []
    assert body["draft"]["party2"]["noticeAddress"] == "bob@globex.com"


def test_message_handles_llm_failure(client, monkeypatch) -> None:
    def _boom(messages, schema):
        raise RuntimeError("LLM down")

    monkeypatch.setattr(service, "complete_structured", _boom)
    client.post("/api/auth/signup", json=CREDS)
    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "hi"}]},
    )
    assert response.status_code == 502
