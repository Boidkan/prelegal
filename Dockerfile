# syntax=docker/dockerfile:1

# ---- Stage 1: build the static frontend ----
FROM node:22-alpine AS frontend
WORKDIR /app/frontend

# Install dependencies first for better layer caching.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build the static export -> frontend/out
COPY frontend/ ./
RUN npm run build


# ---- Stage 2: backend that serves the API and the static frontend ----
FROM python:3.12-slim AS backend
WORKDIR /app/backend

# uv manages the Python environment and dependencies.
RUN pip install --no-cache-dir uv

# Install runtime dependencies first (cached unless the lockfile changes).
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Application code.
COPY backend/ ./

# Statically exported frontend, served by FastAPI at the root.
COPY --from=frontend /app/frontend/out ./static

ENV PRELEGAL_STATIC_DIR=/app/backend/static \
    PRELEGAL_DB_PATH=/tmp/prelegal.db

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
    CMD uv run python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
