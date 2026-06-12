# Prelegal

Prelegal is a SaaS app for drafting legal agreements through a conversation. You
chat with an AI assistant that asks what you need, gathers the details, fills in
a trusted [Common Paper](https://commonpaper.com/) template, and lets you
download the finished document as PDF or Markdown — no forms to fill in.

## Features

- **AI chat drafting** — describe the document you want; the assistant detects
  the type, asks for the necessary details, and populates the document live.
- **11 document types** — from a Mutual NDA to a Cloud Service Agreement, DPA,
  and more (see [Supported documents](#supported-documents)). Ask for an
  unsupported document and the assistant suggests the closest one it can create.
- **Live preview** — the cover page and full Standard Terms update as you chat.
- **Download** — export the completed agreement as **PDF** or **Markdown**.
- **Accounts** — email/password sign up and sign in (bcrypt + JWT session cookie).

## Tech stack

| Layer    | Details                                                                    |
| -------- | -------------------------------------------------------------------------- |
| Frontend | Next.js 16 (static export), React 19, Tailwind CSS v4, `@react-pdf/renderer` |
| Backend  | Python 3.12, FastAPI, Uvicorn, managed with [uv](https://docs.astral.sh/uv/) |
| Database | SQLite — recreated from scratch on every startup (intentionally temporary)  |
| AI       | [LiteLLM](https://docs.litellm.ai/) → OpenAI (`gpt-4o-mini` by default), using Structured Outputs |
| Packaging| A single Docker image: the backend serves the API **and** the static frontend |

The frontend is statically exported and served by FastAPI, so the whole app runs
on a single port (**8000**).

## Getting started

### Prerequisites

- [Docker](https://www.docker.com/) (with Docker Compose)
- An OpenAI API key

### 1. Configure your environment

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=sk-...
```

Optional overrides are listed under [Configuration](#configuration).

### 2. Start the app

```bash
# macOS
scripts/start-mac.sh

# Linux
scripts/start-linux.sh

# Windows (PowerShell)
scripts/start-windows.ps1
```

The script builds the Docker image, starts the container, and waits for it to
become healthy. Then open **http://localhost:8000**, sign up, and choose a
document to create.

### 3. Stop the app

```bash
scripts/stop-mac.sh      # or stop-linux.sh / stop-windows.ps1
```

## Supported documents

Mutual NDA · Cloud Service Agreement · Design Partner Agreement · Service Level
Agreement · Professional Services Agreement · Data Processing Agreement ·
Software License Agreement · Partnership Agreement · Pilot Agreement · Business
Associate Agreement · AI Addendum.

Each type is defined by a spec in `backend/app/documents/specs/` plus its
verbatim Standard Terms in `backend/app/documents/standard_terms/`, so adding or
adjusting a document type is a data change, not a code change.

## Project structure

```
prelegal/
├── backend/            # FastAPI app (uv project)
│   └── app/
│       ├── auth/       # signup / signin / sessions
│       ├── chat/       # AI conversation + field extraction
│       ├── documents/  # document specs, registry, Standard Terms
│       └── main.py     # app entry; serves API + static frontend
├── frontend/           # Next.js app (static export)
├── scripts/            # start/stop scripts per OS
├── templates/          # source Common Paper templates
├── catalog.json        # catalog of document types
└── Dockerfile          # multi-stage build (Node → Python)
```

## API

All endpoints are served under the same origin as the frontend. Chat and
document endpoints require an authenticated session.

| Method | Endpoint                                    | Description                          |
| ------ | ------------------------------------------- | ------------------------------------ |
| GET    | `/api/health`                               | Liveness check                       |
| POST   | `/api/auth/signup`                          | Create an account, start a session   |
| POST   | `/api/auth/signin`                          | Sign in                              |
| POST   | `/api/auth/signout`                         | Sign out                             |
| GET    | `/api/auth/me`                              | Current user                         |
| GET    | `/api/chat/greeting`                        | Assistant's opening message          |
| POST   | `/api/chat/message`                         | Send a message, get the merged draft |
| GET    | `/api/documents/types`                      | List supported document specs        |
| GET    | `/api/documents/types/{id}/standard-terms`  | A type's Standard Terms text         |

## Configuration

Environment variables (read by the backend; only `OPENAI_API_KEY` is required):

| Variable                   | Default                  | Purpose                                  |
| -------------------------- | ------------------------ | ---------------------------------------- |
| `OPENAI_API_KEY`           | —                        | OpenAI key used for AI chat              |
| `PRELEGAL_LLM_MODEL`       | `openai/gpt-4o-mini`     | LiteLLM model id                         |
| `PRELEGAL_JWT_SECRET`      | `dev-insecure-change-me` | JWT signing secret (override in prod)    |
| `PRELEGAL_JWT_TTL_SECONDS` | `86400`                  | Session lifetime                         |
| `PRELEGAL_COOKIE_SECURE`   | `false`                  | Mark the auth cookie `Secure` (HTTPS)    |
| `PRELEGAL_DB_PATH`         | `/tmp/prelegal.db`       | SQLite file location                     |
| `PRELEGAL_STATIC_DIR`      | `backend/static`         | Exported frontend directory              |

## Development

Run the backend tests with uv:

```bash
cd backend
uv sync
uv run pytest
```

Work on the frontend UI in isolation:

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

Note that the API (`/api/*`) is served by the backend on the same origin, so the
full app — UI plus working auth and AI chat — is exercised by running the Docker
image via the `scripts/start-*` commands, which is the recommended way to run
the whole thing.

## License

This project is released under the terms in [LICENSE](LICENSE). The document
templates are from [Common Paper](https://commonpaper.com/) and are used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
