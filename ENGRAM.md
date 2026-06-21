# ENGRAM.md — Living Technical Spec

> This is the single source of truth for the Engram codebase as it exists right now. Update this file after every task. If something is not in this file, it does not exist in the project.

**Last updated:** 2026-05-08
**Current phase:** Phase 3 — Frontend §9 + §10 + §11 COMPLETE ✅ | §12 Brain loading animation next

---

## 1. Stack (Confirmed)

| Layer | Choice |
|---|---|
| Frontend framework | React 19 + Vite 8 + TypeScript 6 (scaffolded with `pnpm create vite`) |
| 3D rendering | Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing |
| Frontend hosting | Vercel |
| Styling | Tailwind CSS + design tokens (`design/tokens.json`) |
| State management | Zustand |
| Animation | framer-motion |
| Routing | react-router-dom |
| Backend framework | FastAPI (Python 3.11+) |
| Backend hosting | Render |
| RAG / Memory | Backboard API (placeholder pre-hackathon) |
| Auth | Supabase Google OAuth (placeholder pre-hackathon) |
| Primary DB | Supabase Postgres (placeholder pre-hackathon — local JSON store) |
| Voice input | Web Speech API (Chrome) |
| Voice output | ElevenLabs (browser `speechSynthesis` fallback) |
| Transport | REST (POST/GET) |
| Frontend package manager | pnpm |
| Backend package manager | pip + `requirements.txt` |

---

## 2. Monorepo File / Folder Structure

```
Engram/
├── CLAUDE.md                       # Working instructions for Claude Code
├── PRD.md                          # Product requirements (the contract)
├── ENGRAM.md                       # This file — living technical spec
├── DESIGN_BRIEF.md                 # (Phase 2 output) — global design brief
├── README.md                       # Run instructions
├── .gitignore
├── .env.example                    # Root env template (mirrors backend + frontend)
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── VERIFICATION.md             # (§7) end-to-end manual verification checklist
│   ├── Makefile                    # (or tasks.ps1 for Windows)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app instance + CORS + route registration
│   │   ├── config.py               # pydantic-settings env loader
│   │   ├── models/
│   │   │   └── schemas.py          # All Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── query.py
│   │   │   ├── ingest.py
│   │   │   ├── graph.py
│   │   │   ├── tts.py              # (Phase 3 §16) ElevenLabs proxy
│   │   │   └── orgs.py             # (Phase 5 §22) org create/me
│   │   ├── services/
│   │   │   ├── ingestion.py        # chunk → extract → classify → graph-update → store
│   │   │   ├── query.py            # query handler (canned + keyword fallback)
│   │   │   ├── canned_answers.py   # demo question → response map
│   │   │   ├── entity_dictionary.py
│   │   │   ├── graph_state.py      # GraphState singleton
│   │   │   ├── store.py            # local persistence (data/store.json)
│   │   │   ├── backboard_stub.py   # (pre-hackathon) Backboard placeholder functions
│   │   │   ├── backboard.py        # (Phase 5 §21) real Backboard implementation
│   │   │   └── auth.py             # (Phase 5 §22) Supabase JWT middleware
│   │   └── connectors/
│   │       ├── base.py             # abstract Connector class
│   │       ├── slack.py
│   │       ├── notion.py
│   │       ├── drive.py
│   │       ├── confluence.py
│   │       ├── jira.py
│   │       └── teams.py
│   ├── data/
│   │   ├── store.json              # local persisted graph + chunks
│   │   └── meridian/               # (§19) demo dataset
│   │       ├── slack/
│   │       ├── notion/
│   │       ├── drive/
│   │       ├── confluence/
│   │       ├── jira/
│   │       ├── teams/
│   │       └── demo_questions.md
│   └── tests/
│       ├── test_routes_contracts.py
│       ├── test_ingestion.py
│       ├── test_query.py
│       ├── test_connector_interface.py
│       └── test_e2e.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vercel.json
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                 # router root
│       ├── routes/
│       │   ├── Landing.tsx
│       │   ├── Connect.tsx
│       │   ├── Loading.tsx
│       │   ├── Brain.tsx
│       │   └── Login.tsx           # (Phase 5 §22) auth screen
│       ├── scene/
│       │   ├── BrainScene.tsx
│       │   ├── Node.tsx
│       │   ├── Edge.tsx
│       │   ├── CameraRig.tsx
│       │   ├── IdleMotion.tsx
│       │   ├── Postprocessing.tsx
│       │   ├── QueryReaction.tsx
│       │   ├── SpeechPulse.tsx
│       │   └── layout.ts
│       ├── panels/
│       │   ├── WordmarkPanel.tsx
│       │   ├── LegendPanel.tsx
│       │   ├── StatsPill.tsx
│       │   ├── SourcesPanel.tsx
│       │   ├── ResponsePanel.tsx
│       │   ├── QueryBar.tsx
│       │   └── SourceDrawer.tsx
│       ├── voice/
│       │   ├── useSpeechRecognition.ts
│       │   └── useTTS.ts
│       ├── state/
│       │   ├── graph.ts
│       │   ├── query.ts
│       │   ├── connectors.ts
│       │   └── drawer.ts
│       ├── lib/
│       │   ├── api.ts
│       │   └── api-types.ts        # generated from backend OpenAPI
│       └── styles/
│           └── index.css
│
└── design/
    ├── tokens.json                 # (Phase 2) — exported design tokens
    └── references/                 # (optional) reference imagery
```

---

## 3. Data Models

All models live in `backend/app/models/schemas.py`. Pydantic v2.

### 3.1 Node Schema (`GraphNode`)

```python
class NodeType(str, Enum):
    DECISION = "decision"
    PERSON = "person"
    TECH = "tech"
    PROJECT = "project"
    OPEN_QUESTION = "open_question"

class GraphNode(BaseModel):
    id: str                          # uuid4 string
    label: str                       # human-readable name (display text)
    type: NodeType
    connections: list[str]           # node ids this node has edges to
    weight: float                    # 0.0..1.0 — accumulated relevance / mention frequency
    last_active: datetime | None     # last time this node was activated by a query or ingest
```

### 3.2 Edge Schema (`GraphEdge`)

```python
class GraphEdge(BaseModel):
    source: str                      # node id (sorted lower of pair for dedupe key)
    target: str                      # node id (sorted higher of pair)
    strength: float                  # accumulates with repeated co-mention
    relationship_type: str           # e.g. "co-mentioned", "decided-by", "owns", "blocks"
```

### 3.3 Source Citation Schema (`Source`)

```python
class Source(BaseModel):
    title: str                       # e.g. "#engineering — Mar 4 thread"
    type: str                        # connector type: "slack" | "notion" | "drive" | ...
    excerpt: str                     # the cited passage (full, not truncated)
    timestamp: datetime
    author: str
    source_id: str                   # internal id for drawer lookup
```

### 3.4 Ingest Payload Schema (`IngestRequest`)

```python
class IngestRequest(BaseModel):
    content: str
    source_type: Literal["slack", "notion", "drive", "confluence", "jira", "teams"]
    source_name: str                 # e.g. "#engineering" or "Architecture ADR"
    timestamp: datetime
    author: str
    metadata: dict = {}              # connector-specific extras

class IngestResponse(BaseModel):
    ingested_id: str
    nodes_created: int
    edges_created: int
    chunk_count: int
```

### 3.5 Query Schemas

```python
class QueryRequest(BaseModel):
    query: str
    session_id: str | None = None    # server generates UUID if absent

class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]
    activated_nodes: list[str]       # node ids — bridge to Three.js graph reaction
    session_id: str                  # echoed/generated; maps to Backboard thread_id post-§21
```

### 3.6 Graph Response Schema

```python
class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
```

---

## 4. API Contracts

Base URL (dev): `http://localhost:8000`. Base URL (prod): set via `VITE_API_BASE_URL`.

| Method | Path | Request | Response | Auth (Phase 5) |
|---|---|---|---|---|
| GET | `/health` | — | `{"status": "ok", "service": "engram-backend"}` | public |
| POST | `/ingest` | `IngestRequest` | `IngestResponse` | required |
| POST | `/ingest/connector/{name}` | — (connector pulls fixtures) | `IngestResponse` | required |
| POST | `/query` | `QueryRequest` | `QueryResponse` | required |
| GET | `/graph` | — | `GraphResponse` | required |
| GET | `/graph?since=<iso8601>` | — | `GraphResponse` (delta) — stretch | required |
| POST | `/tts` | `{"text": str}` | `audio/mpeg` stream | required |
| POST | `/orgs` | `{"name": str}` | `{"org_id": str, "backboard_assistant_id": str}` | required |
| GET | `/orgs/me` | — | `{"orgs": [...]}` | required |

CORS allowed origins: `http://localhost:5173`, the deployed Vercel URL (set in env at deploy time).

Authorization (Phase 5+): `Authorization: Bearer <supabase_jwt>` on every non-`/health` route.

---

## 5. Backboard Config

> **PLACEHOLDER until Phase 5 §21.** All values below are filled in at hackathon day.

```
BACKBOARD_API_KEY=             # TBD at hackathon
BACKBOARD_BASE_URL=            # TBD at hackathon
DEFAULT_ASSISTANT_ID=          # TBD — created by first call to create_assistant()
```

Architectural rules (locked):
- One Backboard assistant per org. `assistant_id` stored in Supabase `orgs.backboard_assistant_id`.
- Documents uploaded at the **assistant level** so all org members share one knowledge base.
- One thread per session (per (`user_id`, `org_id`) pair). `thread_id` cached server-side.
- Bulk ingest uses `send_to_llm=False` to avoid burning credits.
- All memory writes are `await`ed — no fire-and-forget.
- All query messages use `memory="Auto"`.

Stub functions (currently in `backboard_stub.py`, swap to `backboard.py` in §21):
- `async def create_assistant(name) -> str`
- `async def upload_document_to_assistant(assistant_id, content, metadata) -> dict`
- `async def create_thread(assistant_id) -> str`
- `async def query_assistant(assistant_id, thread_id, query, memory="Auto") -> dict`

---

## 6. Supabase Schema

> **PLACEHOLDER until Phase 5 §22.** Tables created via Supabase dashboard or migration on hackathon day.

```sql
-- users (managed by Supabase Auth, mirrored row in public.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- orgs
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  backboard_assistant_id text,            -- populated by POST /orgs
  created_at timestamptz default now()
);

-- org_members (many-to-many)
create table public.org_members (
  user_id uuid references public.users(id) on delete cascade,
  org_id  uuid references public.orgs(id)  on delete cascade,
  role text not null default 'member',    -- 'owner' | 'member'
  created_at timestamptz default now(),
  primary key (user_id, org_id)
);

-- (optional) sessions for thread_id caching
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  org_id  uuid references public.orgs(id)  on delete cascade,
  backboard_thread_id text,
  created_at timestamptz default now()
);
```

OAuth provider: Google. Redirect URLs configured for both `http://localhost:5173` and the Vercel prod URL.

---

## 7. Connector Module Structure

All connectors implement the abstract `Connector` interface in `backend/app/connectors/base.py`:

```python
class Connector(ABC):
    name: str
    @abstractmethod
    async def fetch(self) -> list[IngestRequest]: ...
    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool: ...
```

Each connector module reads from `data/meridian/<connector>/*.json` pre-hackathon. Real OAuth swap point is marked with `# BACKBOARD_PLACEHOLDER` (for ingest pipeline) and the connector-specific OAuth block is marked separately.

### 7.1 Slack — `app/connectors/slack.py`
- Reads: `data/meridian/slack/*.json` (one file per channel; each file is an array of message objects).
- Normalizes each message into `IngestRequest(source_type="slack", source_name="#channel", author=user, ...)`.
- OAuth swap: real Slack Web API auth.

### 7.2 Notion — `app/connectors/notion.py`
- Reads: `data/meridian/notion/*.json` (one file per page).
- OAuth swap: Notion integration token + database query.

### 7.3 Google Drive — `app/connectors/drive.py`
- Reads: `data/meridian/drive/*.json` (PDF metadata + extracted text).
- OAuth swap: Google OAuth2 + Drive API + PDF text extraction (`pypdf`).

### 7.4 Confluence — `app/connectors/confluence.py`
- Reads: `data/meridian/confluence/*.json` (one file per page).
- OAuth swap: Atlassian OAuth + Confluence REST API.

### 7.5 Jira — `app/connectors/jira.py`
- Reads: `data/meridian/jira/*.json` (one file containing an array of ticket objects).
- OAuth swap: Atlassian OAuth + Jira REST API.

### 7.6 Microsoft Teams — `app/connectors/teams.py`
- Reads: `data/meridian/teams/*.json` (channel-keyed messages, similar shape to Slack).
- OAuth swap: Microsoft Graph API.

---

## 8. Environment Variables

### Backend `backend/.env.example`

```
# General
ENVIRONMENT=dev                       # dev | prod
LOG_LEVEL=info

# Backboard (Phase 5 §21)
BACKBOARD_API_KEY=
BACKBOARD_BASE_URL=
DEFAULT_ASSISTANT_ID=

# Supabase (Phase 5 §22)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# ElevenLabs (Phase 3 §16)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `frontend/.env.example`

```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=                    # Phase 5 §22
VITE_SUPABASE_ANON_KEY=               # Phase 5 §22
```

---

## 9. Placeholder Registry

> Every `# BACKBOARD_PLACEHOLDER` and `# SUPABASE_PLACEHOLDER` location across the codebase. **This list MUST be kept current** — it is the hackathon-day swap checklist.

### `# BACKBOARD_PLACEHOLDER`

| File | Line / Block | Purpose | Real impl in §21 |
|---|---|---|---|
| _(none yet — add as Phase 1 ships)_ | | | |
| `backend/app/services/backboard_stub.py` | entire module — `create_assistant`, `upload_document_to_assistant`, `create_thread`, `query_assistant` | Stubbed Backboard SDK functions | replaced by `backboard.py` |
| `backend/app/services/ingestion.py` | `process_ingest()` — upload step at end of each chunk loop | upload chunks with `send_to_llm=False` | call `backboard.upload_document_to_assistant` |
| `backend/app/services/query.py` | `handle_query()` retrieval step | RAG retrieval + answer | call `backboard.query_assistant(memory="Auto")` |

### `# SUPABASE_PLACEHOLDER`

| File | Line / Block | Purpose | Real impl in §22 |
|---|---|---|---|
| _(none yet — add as Phase 1 ships)_ | | | |
| `backend/app/services/auth.py` | JWT verification | verify Supabase JWT on every request | real JWKS verify |
| `backend/app/routes/orgs.py` | `POST /orgs`, `GET /orgs/me` | org CRUD | Postgres queries |
| `backend/app/services/store.py` | `data/store.json` persistence | replace local JSON with Postgres tables scoped by `org_id` | per-org tables |
| `backend/app/services/query.py` | session→thread_id cache | look up `backboard_thread_id` in `sessions` table | Postgres lookup |

> **Discipline:** when adding a placeholder, append a row to the relevant table above with file path and brief description. When the real implementation lands in Phase 5, remove the row.

---

## 10. Current Build Status

Legend: ⬜ not started · 🟡 in progress · ✅ done · 🔒 blocked

### Phase 1 — Backend
- ✅ §1 Project setup & monorepo skeleton
- ✅ §2 Core API routes (contracts first)
- ✅ §3 Ingestion pipeline
- ✅ §4 Query handler
- ✅ §5 Connector modules
- ✅ §6 Graph state manager
- ✅ §7 Backend end-to-end verification

### Phase 2 — Shape Interview
- ✅ §8 Frontend shape interview & design brief (`DESIGN_BRIEF.md` + `design/tokens.json`)

### Phase 3 — Frontend
- ✅ §9 Frontend scaffold (Vite + React 19 + TS, Tailwind v3 token-mapped, react-router v7, Zustand, openapi-typescript types, Vercel SPA config)
- ✅ §10 Landing page — PrismaHero exact (cinematic video bg, rounded container, giant ENGRAM wordmark, cream text, white CTA), HowItWorks, BrainPreview (ContainerScroll + MiniBrain R3F Bloom 80-node sphere), ConnectorMosaic (official logos), SplineSection (full-bleed with parallax text), CTA → /connect. All green removed — pure black/white SaaS palette throughout.
- ✅ §11 Connector selection screen — FallingPattern bg, 6 cards with hardcoded official SVG logos (src/lib/connector-icons.ts), framer-motion stagger + pulse on select, "Select all" convenience, "Build your brain →" CTA → /loading
- ⬜ §12 Brain loading animation — FallingPattern particles converge → crystallize into brain nodes
- ⬜ §12 Brain loading animation
- ⬜ §13 Three.js semantic graph — base render
- ⬜ §14 Three.js — query reaction animations
- ⬜ §15 Floating UI panels
- ⬜ §16 Voice input + output
- ⬜ §17 Source drawer

### Phase 4 — Wire + Demo Data
- ⬜ §18 Frontend ↔ backend wiring
- ⬜ §19 Meridian mock dataset
- ⬜ §20 Polish pass

### Phase 5 — Hackathon Integrations
- ⬜ §21 Backboard integration
- ⬜ §22 Supabase auth + org model

---

## 11. Open Questions (Carry-Over from PRD §0 / Cross-Cutting)

These need answers before their owning phase begins. Keep updated as resolved.

| # | Question | Resolved? | Resolution |
|---|---|---|---|
| 1 | Three.js post-processing budget | ✅ | UnrealBloom + ChromaticAberration full quality, lean fallback if GPU struggles (BRIEF §3 / tokens.postprocessing) |
| 2 | Graph layout: force-directed vs. hand-tuned | ✅ | Spatially **sectioned by source** — each connector forms its own 3D cluster, not pure force-directed (BRIEF screen 1) |
| 3 | ElevenLabs voice ID | ⬜ | (§20 polish) |
| 4 | Final demo questions | ⬜ | (before §19) |
| 5 | Node positions backend or frontend | ✅ | Frontend (clusters laid out client-side per source section) |
| 6 | Chunk overlap value (default 50 tokens) | ⬜ | (§19 dataset tuning) |
| 7 | Ripple effect: shader vs. mesh | ✅ | Cascade animation: seed → 1-hop → 2-hop with `60-120ms` randomized hop delay, max 2 hops (tokens.animation.cascade) |
| 8 | Audio cue during loading sequence | ⬜ | (open — BRIEF flagged as implementer decision) |
| 9 | Multi-tenant scope on hackathon day | ⬜ | (before §22) |
