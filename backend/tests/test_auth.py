"""Tests for the auth flow: signup, signin, signout, and /me."""

from __future__ import annotations

CREDS = {"email": "alice@example.com", "password": "correct-horse"}


def test_signup_creates_user_and_session(client) -> None:
    response = client.post("/api/auth/signup", json=CREDS)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == CREDS["email"]
    assert body["id"] >= 1
    assert "password" not in body
    # Session cookie is set so the user is immediately authenticated.
    assert client.cookies.get("prelegal_session")


def test_signup_duplicate_email_conflicts(client) -> None:
    client.post("/api/auth/signup", json=CREDS)
    response = client.post("/api/auth/signup", json=CREDS)
    assert response.status_code == 409


def test_signup_rejects_short_password(client) -> None:
    response = client.post(
        "/api/auth/signup", json={"email": "bob@example.com", "password": "short"}
    )
    assert response.status_code == 422


def test_signup_rejects_invalid_email(client) -> None:
    response = client.post(
        "/api/auth/signup", json={"email": "not-an-email", "password": "longenough"}
    )
    assert response.status_code == 422


def test_signin_with_valid_credentials(client) -> None:
    client.post("/api/auth/signup", json=CREDS)
    client.post("/api/auth/signout")
    response = client.post("/api/auth/signin", json=CREDS)
    assert response.status_code == 200
    assert response.json()["email"] == CREDS["email"]


def test_signin_with_wrong_password(client) -> None:
    client.post("/api/auth/signup", json=CREDS)
    response = client.post(
        "/api/auth/signin",
        json={"email": CREDS["email"], "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_signin_unknown_user(client) -> None:
    response = client.post("/api/auth/signin", json=CREDS)
    assert response.status_code == 401


def test_me_requires_authentication(client) -> None:
    client.cookies.clear()
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client) -> None:
    client.post("/api/auth/signup", json=CREDS)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == CREDS["email"]


def test_signout_clears_session(client) -> None:
    client.post("/api/auth/signup", json=CREDS)
    client.post("/api/auth/signout")
    client.cookies.clear()
    response = client.get("/api/auth/me")
    assert response.status_code == 401
