# GovContracts Dashboard (Phase 1)

Minimal monorepo demo with API docs, FastAPI backend, Next.js frontend, and realistic seeded dummy data.

## Monorepo Layout

- `docs/` API documentation
- `backend/` FastAPI service (JSON-backed, in-memory)
- `frontend/` Next.js App Router dashboard

## Phase 1 Features

- API endpoints for agencies, budget summary, contracts, and vendors
- Local JSON data storage under `backend/data/` (no database)
- Dashboard with KPI cards, filters, contracts table, pagination, and contract detail drawer
- Loading/skeleton states and empty/error handling for demo reliability

## Run Backend

From `govcontracts-dashboard/backend`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

## Run Frontend

From `govcontracts-dashboard/frontend`:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Environment Variable

Frontend API base URL defaults to:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

Set it explicitly if your backend runs on a different host/port.

## Quick Smoke Test

1. `GET http://localhost:8000/health` returns `{ "status": "ok" }`.
2. Open `http://localhost:3000` and confirm KPI cards and contracts table are populated.
3. Change agency/year/status filters and verify table updates.
4. Use Prev/Next pagination controls on the table.
5. Click a contract row and confirm detail drawer + vendor summary loads.
