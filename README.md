# Engram

> Jarvis for your org's brain. Every decision, meeting, Slack thread, doc, and reason why — semantically indexed and queryable via voice or text.

---

## Monorepo Structure

```
Engram/
├── backend/    FastAPI (Python 3.11+)
└── frontend/   React 18 + Vite + Three.js (Phase 3)
```

---

## Running the Backend

### Prerequisites
- Python 3.11+
- pip

### Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in any values needed (all optional pre-hackathon)
```

### Start

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Tests

```bash
cd backend
pytest
```

---

## Running the Frontend

> Phase 3 — not yet built.

```bash
cd frontend
pnpm install
pnpm dev
```

---

## Demo Browser

Chrome only — Web Speech API is Chrome-specific.

---

## Phase Map

| Phase | Sections | Status |
|---|---|---|
| 1 — Backend | §1–§7 | In progress |
| 2 — Shape Interview | §8 | Not started |
| 3 — Frontend | §9–§17 | Not started |
| 4 — Wire + Demo Data | §18–§20 | Not started |
| 5 — Hackathon Integrations | §21–§22 | Not started |
