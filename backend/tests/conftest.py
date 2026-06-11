"""Shared pytest fixtures.

The environment is configured *before* the app is imported, so the settings
singleton picks up a throwaway database path. Every ``TestClient`` startup runs
the app lifespan, which recreates the database from scratch — giving each test a
clean slate without per-test module reloading.
"""

from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator

import pytest

# Must run before `app` is imported anywhere below.
_TMP_DB = os.path.join(tempfile.mkdtemp(prefix="prelegal-test-"), "test.db")
os.environ.setdefault("PRELEGAL_DB_PATH", _TMP_DB)
os.environ.setdefault("PRELEGAL_JWT_SECRET", "test-secret")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture
def client() -> Iterator[TestClient]:
    """A TestClient whose lifespan recreates the database for each test."""
    with TestClient(app) as test_client:
        yield test_client
