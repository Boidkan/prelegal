"""FastAPI application: API routes plus the statically exported frontend.

The same process serves the JSON API under ``/api/*`` and the Next.js static
export at the root, so the whole product is reachable on a single port (8000).
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .auth.router import router as auth_router
from .config import settings
from .database import init_db
from .health import router as health_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Recreate the temporary database on every startup."""
    init_db()
    yield


app = FastAPI(title="Prelegal", lifespan=lifespan)

# API routes are registered before the static mount so they take precedence.
app.include_router(health_router)
app.include_router(auth_router)


def _mount_frontend() -> None:
    """Serve the exported frontend at the root, if it has been built.

    In local backend-only development (no `next build`) the directory is absent;
    we surface a hint at the root instead of failing to start.
    """
    if settings.static_dir.is_dir():
        app.mount(
            "/",
            StaticFiles(directory=settings.static_dir, html=True),
            name="frontend",
        )
    else:

        @app.get("/")
        def _missing_frontend() -> dict[str, str]:
            return {
                "detail": (
                    "Frontend not built. Run the start script or `next build` "
                    "to generate the static export."
                )
            }


_mount_frontend()
