"""Runtime configuration, read once from the environment.

Keep this dependency-light: the foundation only needs a handful of paths and
secrets. Anything product-specific (LLM keys, feature flags) belongs in a later
ticket, not here.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

# backend/app/config.py -> backend/ -> repo root
_BACKEND_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    """Process-wide settings, resolved from environment variables."""

    # SQLite database file. Recreated from scratch on every startup, so it lives
    # in an ephemeral location by default.
    db_path: Path
    # Directory holding the statically exported frontend (Next.js `out/`).
    static_dir: Path
    # Secret used to sign auth JWTs. MUST be overridden in any real deployment.
    jwt_secret: str
    # How long an auth session stays valid.
    jwt_ttl_seconds: int
    # Whether to mark the auth cookie Secure (disabled for local HTTP dev).
    cookie_secure: bool
    # LiteLLM model id for chat. OpenAI by default; OPENAI_API_KEY is read from
    # the environment by LiteLLM directly.
    llm_model: str


def load_settings() -> Settings:
    """Build :class:`Settings` from the current environment."""
    return Settings(
        db_path=Path(os.getenv("PRELEGAL_DB_PATH", "/tmp/prelegal.db")),
        static_dir=Path(
            os.getenv("PRELEGAL_STATIC_DIR", str(_BACKEND_DIR / "static"))
        ),
        jwt_secret=os.getenv("PRELEGAL_JWT_SECRET", "dev-insecure-change-me"),
        jwt_ttl_seconds=int(os.getenv("PRELEGAL_JWT_TTL_SECONDS", str(60 * 60 * 24))),
        cookie_secure=os.getenv("PRELEGAL_COOKIE_SECURE", "false").lower() == "true",
        llm_model=os.getenv("PRELEGAL_LLM_MODEL", "openai/gpt-4o-mini"),
    )


settings = load_settings()
"""Eagerly-loaded settings singleton for convenient import."""
