"""Tests for the health endpoint and the static-frontend fallback."""

from __future__ import annotations


def test_health_ok(client) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_without_frontend_build(client) -> None:
    # No `next build` runs in the backend test environment, so the root falls
    # back to a hint rather than serving static files.
    response = client.get("/")
    assert response.status_code == 200
    assert "Frontend not built" in response.json()["detail"]
