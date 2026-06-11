# Prelegal Backend

FastAPI service that exposes the JSON API under `/api/*` and serves the
statically exported frontend at the root. Everything runs on a single port
(8000).

This is the **V1 foundation** (SCRUM-7): authentication and a temporary database
only. Product features (AI chat, document types, persistence) come in later
tickets.

## Layout

```
app/
  main.py        # app + lifespan (fresh DB) + static mount
  config.py      # settings from environment
  database.py    # SQLite connect + schema init
  health.py      # GET /api/health
  auth/          # signup / signin / signout / me
tests/           # pytest (health + auth)
```

## Endpoints

| Method | Path               | Description                       |
| ------ | ------------------ | --------------------------------- |
| GET    | `/api/health`      | Liveness check                    |
| POST   | `/api/auth/signup` | Create account, start session     |
| POST   | `/api/auth/signin` | Authenticate, start session       |
| POST   | `/api/auth/signout`| Clear session cookie              |
| GET    | `/api/auth/me`     | Current user (requires session)   |

## Database

SQLite, **recreated from scratch on every startup** (see `init_db`). The path
defaults to `/tmp/prelegal.db` and is configurable via `PRELEGAL_DB_PATH`.

## Configuration

| Variable                  | Default                | Purpose                          |
| ------------------------- | ---------------------- | -------------------------------- |
| `PRELEGAL_DB_PATH`        | `/tmp/prelegal.db`     | SQLite file location             |
| `PRELEGAL_STATIC_DIR`     | `backend/static`       | Exported frontend directory      |
| `PRELEGAL_JWT_SECRET`     | `dev-insecure-change-me` | JWT signing secret (override!) |
| `PRELEGAL_JWT_TTL_SECONDS`| `86400`                | Session lifetime                 |
| `PRELEGAL_COOKIE_SECURE`  | `false`                | Mark auth cookie `Secure`        |

## Local development

```bash
uv sync                 # install dependencies
uv run pytest           # run tests
uv run uvicorn app.main:app --reload --port 8000
```

The whole stack (frontend build + backend) is normally run via the repo-root
`scripts/start-*` scripts, which build and run the Docker container.
```
