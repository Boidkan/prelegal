"""SQLite access for the foundation.

A thin wrapper over the stdlib ``sqlite3`` module — the foundation only needs a
``users`` table, so an ORM would be premature. The database is recreated from
scratch on every startup (see :func:`init_db`), matching the requirement that a
fresh, temporary database exists each time the container is brought up.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager

from .config import settings

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""


def connect() -> sqlite3.Connection:
    """Open a new connection with rows accessible by column name."""
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    # Enforce the UNIQUE/foreign-key constraints we declare in the schema.
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Context manager yielding a connection, committing on success.

    Used as a FastAPI dependency so each request gets its own connection.
    """
    conn = connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    """Recreate the database from scratch.

    Deletes any existing database file, then applies the schema. Called on
    application startup so every container boot begins with a clean, temporary
    database.
    """
    if settings.db_path.exists():
        settings.db_path.unlink()
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = connect()
    try:
        conn.executescript(_SCHEMA)
        conn.commit()
    finally:
        conn.close()
