# Engram — Product Requirements Document

**Tagline:** Jarvis for your org's brain.
**One-liner:** Every decision, meeting, Slack thread, doc, and *reason why* gets ingested, semantically indexed, and made queryable via voice or text. Answers come back with cited sources, and a live 3D semantic graph visually reacts to show which knowledge nodes were relevant.

---

## 0. Tech Stack (Locked Decisions)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | **React 18 + Vite** | Fast HMR, lightweight, plays well with Three.js. Next.js is overkill — no SSR needed for a graph-first SPA. |
| 3D rendering | **Three.js + react-three-fiber + drei** | r3f gives declarative scene graph; drei provides camera controls, post-processing, performance helpers. |
| Frontend hosting | **Vercel** | Zero-config for Vite SPAs, instant rollbacks, demo-friendly URL. |
| Styling | **Tailwind CSS + custom CSS variables for design tokens** | Token-driven theming for the design brief from Phase 2; Tailwind for utility speed. |
| State | **Zustand** | Tiny, no boilerplate, perfect for graph state + query state slices. Avoids Redux ceremony for a 1-week build. |
| Backend framework | **FastAPI (Python 3.11+)** | Async-native (matches Backboard's async writes), Pydantic for response shape contracts, auto OpenAPI docs. |
| Backend hosting | **Render (web service)** | Free tier sufficient pre-hackathon; Docker support for the day-of integration. Fly.io is acceptable alt. |
| RAG / Memory | **Backboard API** (hackathon day) | Placeholder stubs pre-hackathon, swap-in on day. |
| Auth | **Supabase Google OAuth** (hackathon day) | Stubbed pre-hackathon — landing page → connector screen with no login gate. |
| Primary DB | **Supabase Postgres** (hackathon day) | Stores `orgs`, `users`, `org_members`, `assistant_id`, `thread_id`. Pre-hackathon: in-memory dicts + local JSON. |
| Voice input | **Web Speech API** (browser native) | Zero infra, zero cost. Whisper only if Web Speech fails on demo browser. |
| Voice output | **ElevenLabs** primary, **`speechSynthesis`** fallback | ElevenLabs for cinematic demo voice; browser TTS as a hard fallback if API fails live. |
| Transport | **REST (POST/GET)** | No WebSockets pre-hackathon. Streaming responses are a stretch goal only. |
| Package manager | **pnpm** (frontend), **uv** or **pip** (backend) | pnpm for speed; uv if available, pip otherwise. |

**⚠ Unresolved decisions (flagged inline):**
- 🚩 **Three.js post-processing budget:** UnrealBloom + chromatic aberration vs. cheaper custom shader. Decided in Phase 2 design brief.
- 🚩 **Graph layout algorithm:** force-directed (d3-force-3d) vs. hand-tuned static positions for demo determinism. Recommend **hand-tuned for the demo brain, force-directed during ingest preview** — confirm in Phase 2.
- 🚩 **ElevenLabs voice ID:** to be picked during Phase 4 polish.

---

## Build Phase Map

- **Phase 1:** Backend (Sections 1–7) — fully working before any frontend code.
- **Phase 2:** Frontend Shape Interview (Section 8) — produces design brief.
- **Phase 3:** Frontend (Sections 9–17) — built against approved brief.
- **Phase 4:** Wire + Demo Data (Sections 18–20).
- **Phase 5:** Hackathon-Day Integrations (Sections 21–22).

Each numbered section below = one Claude Code build task. Subsections are allowed where useful.

---

# PHASE 1 — BACKEND

## 1. Project Setup & Monorepo Skeleton

**Goal:** Establish a clean monorepo with `/frontend` and `/backend`, dependency manifests, env templates, and a runnable FastAPI skeleton that responds on `/health`.

**Deliverables:**
- Repo root: `README.md`, `.gitignore` (Python + Node), `.env.example` at root.
- `/backend/`
  - `requirements.txt` with: `fastapi`, `uvicorn[standard]`, `pydantic>=2`, `python-dotenv`, `httpx`, `pytest`, `pytest-asyncio`, `python-multipart`.
  - `app/main.py` — FastAPI app instance with CORS middleware allowing `http://localhost:5173` and the eventual Vercel URL.
  - `app/__init__.py`, `app/routes/`, `app/services/`, `app/models/`, `app/connectors/`.
  - `app/config.py` reading env via `pydantic-settings`.
  - `app/.env.example` listing every var: `BACKBOARD_API_KEY`, `BACKBOARD_BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_API_KEY`, `ENVIRONMENT`.
  - `tests/` directory with one passing smoke test.
- `/frontend/` — empty placeholder folder with a single `.gitkeep`. (Frontend scaffold happens in Phase 3.)
- Run instructions in root README:
  - `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`

**Acceptance criteria:**
- `uvicorn` starts on port 8000 with no errors.
- `curl http://localhost:8000/health` returns `{"status": "ok", "service": "engram-backend"}`.
- `pytest` runs and passes the smoke test.
- `/docs` (FastAPI auto-docs) loads and shows `/health`.

**Dependencies:** None.

**Technical notes + risks:**
- Use **Pydantic v2** patterns (`BaseModel`, `model_dump`) — v1 syntax will silently misbehave.
- CORS must allow `*` in dev, but be locked down before hackathon-day deploy.
- Risk: pip cold install on Windows can fail on `uvloop` — use `uvicorn[standard]` not `uvicorn[uvloop]` on Windows.

---

## 2. Core API Routes (Contracts First)

**Goal:** Define the four core HTTP endpoints with locked request/response shapes. These contracts drive every downstream module.

**Deliverables:**
- `app/models/schemas.py` defining Pydantic models:
  - `IngestRequest`: `content: str`, `source_type: Literal["slack","notion","drive","confluence","jira","teams"]`, `source_name: str`, `timestamp: datetime`, `author: str`, `metadata: dict = {}`.
  - `IngestResponse`: `ingested_id: str`, `nodes_created: int`, `edges_created: int`, `chunk_count: int`.
  - `Source`: `title: str`, `type: str`, `excerpt: str`, `timestamp: datetime`, `author: str`, `source_id: str`.
  - `QueryRequest`: `query: str`, `session_id: str | None = None`.
  - `QueryResponse`: `answer: str`, `sources: list[Source]`, `activated_nodes: list[str]`, `session_id: str`.
  - `GraphNode`: `id: str`, `label: str`, `type: Literal["decision","person","tech","project","open_question"]`, `connections: list[str]`, `weight: float`, `last_active: datetime | None`.
  - `GraphEdge`: `source: str`, `target: str`, `strength: float`, `relationship_type: str`.
  - `GraphResponse`: `nodes: list[GraphNode]`, `edges: list[GraphEdge]`.
- `app/routes/health.py` — `GET /health`.
- `app/routes/query.py` — `POST /query`.
- `app/routes/ingest.py` — `POST /ingest`.
- `app/routes/graph.py` — `GET /graph`.
- All routes registered in `app/main.py`.
- Each route has a stub return that satisfies its response model (real logic comes in §3–§6).

**Acceptance criteria:**
- `/docs` shows all four endpoints with full schema.
- Hitting each endpoint with valid payload returns a 200 with a response that matches the schema.
- Hitting each endpoint with invalid payload returns 422 with Pydantic error details.
- A pytest in `tests/test_routes_contracts.py` validates each route's response shape against its model.

**Dependencies:** §1.

**Technical notes + risks:**
- 🚩 **Decision:** `session_id` semantics — pre-hackathon it's a UUID generated server-side per query if absent. Post-hackathon, it maps 1:1 to a Backboard `thread_id`. Document this in the schema docstring.
- The `activated_nodes` field is the bridge to the Three.js graph — never rename it.
- Risk: schema drift between backend and frontend. Mitigation: generate TypeScript types from OpenAPI in §17 (see "Wire" phase).

---

## 3. Ingestion Pipeline

**Goal:** Convert raw connector content into chunks, entities, nodes, and edges, persisted to a local store. Pipeline must be Backboard-ready (one swap to go live).

**Deliverables:**
- `app/services/ingestion.py` with:
  - `chunk_text(content: str, max_tokens: int = 400) -> list[str]` — token-aware chunking with overlap (~50 tokens). Use `tiktoken` or a simple word-based fallback.
  - `extract_entities(chunk: str) -> dict` — pre-hackathon: keyword/regex matcher over a curated entity list (people names, project codenames, tech terms) loaded from `app/services/entity_dictionary.py`. Returns `{"people": [...], "tech": [...], "projects": [...], "decisions": [...], "open_questions": [...]}`.
  - `classify_node_type(entity: str, context: str) -> NodeType` — rule-based: capitalized noun + verb match → Decision; "?" or "TBD" → Open Question; entity matches person dictionary → Person; etc.
  - `build_edges(nodes_in_chunk: list[str], existing_graph) -> list[GraphEdge]` — co-occurrence within chunk = edge; relationship_type = "co-mentioned" by default; strength = 1/(distance + 1) for tokens within same chunk.
  - `process_ingest(req: IngestRequest) -> IngestResponse` — the orchestrator that calls chunk → extract → classify → graph-update → store.
- `app/services/store.py` — local persistence layer:
  - In-memory: `nodes: dict[str, GraphNode]`, `edges: list[GraphEdge]`, `chunks: list[Chunk]`.
  - Backed by `data/store.json` for persistence between restarts (auto-save on every write, debounced 1s).
- `app/services/backboard_stub.py` — placeholder module with the exact functions we'll swap on hackathon day:
  - `async def upload_document_to_assistant(assistant_id, content, metadata) -> dict` — returns `{"document_id": "stub_<uuid>"}`.
  - `async def create_assistant(name) -> str` — returns `"asst_stub_<uuid>"`.
  - `async def query_assistant(assistant_id, thread_id, query, memory="Auto") -> dict` — returns canned response shape.
  - All functions are `async` and `await`-able **even in stub form**, to ensure no race-condition surprises on swap.

**Acceptance criteria:**
- POST `/ingest` with a 500-word payload completes in <500ms locally.
- Repeated ingest of overlapping content does NOT duplicate nodes (dedupe by lowercased label).
- After 3 ingests of related content, `GET /graph` shows ≥1 edge between co-mentioned entities.
- `data/store.json` persists across server restarts.
- `pytest tests/test_ingestion.py` covers: chunking boundaries, entity extraction recall, dedupe behavior, edge formation.

**Dependencies:** §1, §2.

**Technical notes + risks:**
- Pre-hackathon, embeddings are NOT computed — all retrieval is keyword-based in §4. Real embeddings come from Backboard.
- Risk: rule-based classification will be brittle on real data. Acceptable for the curated Meridian dataset (§19). Document the fragility.
- 🚩 **Decision:** chunk overlap value (50 tokens proposed) — confirm during §19 dataset tuning.
- All Backboard stub functions MUST be `async def` from day one — do not convert sync→async later, that's where race conditions hide.

---

## 4. Query Handler

**Goal:** Accept a natural-language query, return a structured `QueryResponse` with answer, sources, and the node IDs that should light up on the graph.

**Deliverables:**
- `app/services/query.py` with:
  - `async def handle_query(req: QueryRequest) -> QueryResponse`
  - Pre-hackathon retrieval strategy:
    1. Tokenize query, lowercase, remove stopwords.
    2. Score every chunk by keyword overlap (TF-style).
    3. Take top-K (K=5) chunks → derive `sources`.
    4. Collect all node IDs referenced by those chunks → `activated_nodes`.
    5. Generate `answer` by template: `"Based on {N} sources from {connectors}: {top_chunk_excerpt}"` — **OR** if a hardcoded answer exists for this query (§19), return it verbatim.
  - `app/services/canned_answers.py` — dict of `{normalized_query: QueryResponse}` for the demo questions. `normalize_query` lowercases + strips punctuation + collapses whitespace before lookup.
  - Backboard swap point clearly marked with a comment: `# === BACKBOARD SWAP POINT (Phase 5, §21) ===`.

**Acceptance criteria:**
- POST `/query` with a known demo question returns the canned response.
- POST `/query` with an unknown question returns a graceful keyword-based answer + at least 1 source if any data is ingested.
- `activated_nodes` is never empty when `sources` is non-empty.
- Response time <300ms locally.
- `pytest tests/test_query.py` covers canned-hit, fallback path, empty-store path.

**Dependencies:** §3.

**Technical notes + risks:**
- The canned-answer layer is a **demo safety net**, not a crutch — real Backboard responses replace it on hackathon day. But it must exist and work, because live demos fail.
- Risk: keyword search returns garbage for paraphrased queries. Acceptable pre-hackathon; Backboard fixes it on day-of.
- `session_id`: if `None`, generate a UUID and return it; client should reuse it for follow-up queries.

---

## 5. Connector Modules

**Goal:** Six connector modules sharing one interface, each capable of pulling/parsing source-shaped content into the ingestion pipeline. Pre-hackathon, all read from local Meridian JSON fixtures.

**Deliverables:**
- `app/connectors/base.py` — abstract `Connector` class:
  - `name: str`
  - `async def fetch() -> list[IngestRequest]` — yields ingest-ready records.
  - `async def authenticate(credentials: dict) -> bool` — stubbed `return True` pre-hackathon.
- `app/connectors/slack.py` — reads `data/meridian/slack/*.json` (channel-keyed message arrays).
- `app/connectors/notion.py` — reads `data/meridian/notion/*.json` (page objects).
- `app/connectors/drive.py` — reads `data/meridian/drive/*.json` (PDF metadata + extracted text).
- `app/connectors/confluence.py` — reads `data/meridian/confluence/*.json`.
- `app/connectors/jira.py` — reads `data/meridian/jira/*.json` (ticket array).
- `app/connectors/teams.py` — reads `data/meridian/teams/*.json` (channel messages).
- Each connector includes a clearly-marked `# === REAL OAUTH SWAP POINT ===` block returning a stubbed token pre-hackathon.
- `app/routes/ingest.py` extended with `POST /ingest/connector/{name}` that runs `Connector.fetch()` then ingests every yielded record.

**Acceptance criteria:**
- Each connector loads its fixtures without error and yields ≥1 `IngestRequest`.
- `POST /ingest/connector/slack` with the Meridian fixtures populates the graph with ≥10 nodes.
- All six connectors implement the same interface (verified by `pytest tests/test_connector_interface.py` running a parametric test).
- Switching a connector to a "real" OAuth path requires editing only one marked block per file.

**Dependencies:** §3.

**Technical notes + risks:**
- The Meridian fixtures don't exist yet (created in §19). Pre-§19, ship each connector with a tiny sample fixture (3–5 records) so tests pass.
- Risk: divergent fixture schemas across connectors makes the pipeline brittle. Mitigation: each connector module is responsible for normalizing into `IngestRequest` — the pipeline never sees raw connector shapes.

---

## 6. Graph State Manager

**Goal:** A single source of truth for the semantic graph in memory, updated atomically on every ingest, queryable for the frontend, and able to report which nodes a query "activated."

**Deliverables:**
- `app/services/graph_state.py`:
  - `class GraphState` (singleton):
    - `nodes: dict[str, GraphNode]`
    - `edges: dict[tuple[str, str], GraphEdge]` (keyed by sorted source-target pair to dedupe).
    - `add_or_update_node(node) -> bool` — returns True if new.
    - `add_or_strengthen_edge(source, target, relationship_type) -> GraphEdge` — increments `strength` on repeat co-mention.
    - `mark_active(node_ids: list[str])` — updates `last_active = now()` on each.
    - `to_response() -> GraphResponse`.
    - `activated_for_query(query: str, top_chunk_node_ids: list[str]) -> list[str]` — returns top_chunk nodes plus 1-hop neighbors above strength threshold.
- Hooked into ingestion (§3) and query (§4).
- `GET /graph` returns the full graph; `GET /graph?since=<timestamp>` returns only changes since (stretch).

**Acceptance criteria:**
- After ingesting the full Meridian dataset, the graph contains:
  - 30–80 nodes (target range — confirmed during §19).
  - At least 2× as many edges as nodes.
- `activated_for_query` returns 3–8 node IDs for any reasonable query — never zero, never the whole graph.
- Graph state survives server restart (loaded from `data/store.json`).
- Concurrent ingests don't corrupt state (test via `asyncio.gather` over 10 ingests).

**Dependencies:** §3.

**Technical notes + risks:**
- Use an `asyncio.Lock` around mutations to prevent race conditions even pre-Backboard.
- Risk: graph grows unbounded. Pre-hackathon: no pruning needed. Post-MVP: weight decay on `last_active`.
- 🚩 **Decision:** node positions for the 3D graph — computed backend-side or frontend-side? **Recommend frontend-side** (force layout in Three.js), backend only emits topology. Confirm in Phase 2 design brief.

---

## 7. Backend End-to-End Verification

**Goal:** Prove the entire backend works against a realistic payload before any frontend work begins. This is the gate to Phase 2.

**Deliverables:**
- `tests/test_e2e.py` — a single integration test that:
  1. Wipes the store.
  2. Calls each of the six connector ingest endpoints with sample fixtures.
  3. Asserts `GET /graph` returns nodes from each connector.
  4. Calls `POST /query` with 3 demo questions; asserts answer non-empty, sources non-empty, activated_nodes non-empty.
  5. Calls `GET /graph` again and asserts `last_active` was updated on activated nodes.
- A `Makefile` (or `tasks.ps1` for Windows) target `verify-backend` that runs the full suite.
- Manual verification checklist in `backend/VERIFICATION.md`:
  - [ ] All endpoints return correct shapes (curl examples included).
  - [ ] Ingestion pipeline proven end to end with each connector.
  - [ ] Graph state updates correctly on ingest.
  - [ ] Query returns canned responses for the demo questions.
  - [ ] Restart persistence works.

**Acceptance criteria:**
- `make verify-backend` (or pwsh equivalent) exits 0.
- VERIFICATION.md is fully checked off and committed.
- A 60-second screencast (kept locally) showing the curl flow end-to-end.

**Dependencies:** §1–§6.

**Technical notes + risks:**
- Do not skip this gate. Frontend without a verified backend will produce silent demo failures.
- 🚩 If E2E passes but Backboard swap fails on hackathon day, the canned-answer fallback in §4 is the safety net — verify it remains functional even after the swap.

---

# PHASE 2 — FRONTEND SHAPE INTERVIEW

## 8. Frontend Shape Interview & Design Brief

**Goal:** Run a structured discovery interview using the `shape` skill (and `impeccable teach` for design context) to produce a single design brief that guides every frontend implementation in Phase 3. **No frontend code is written until this brief is approved.**

**Deliverables:**
- Run `/impeccable teach` once to load the project's design context (forest green palette, dark canvas, cinematic motion).
- Run `/shape` interview covering:
  1. **Global design language** — typography stack, spacing scale, motion philosophy (recommended: layered easing curves; refinement of motion over flash).
  2. **Color system** — single accent (forest green `#2d6a4f`), node-type palette (decisions green / people white / tech grey / projects white / open questions grey), background depth layers.
  3. **Landing page** — hero copy, scroll narrative beats, feature sections, the "Proceed →" CTA.
  4. **Connector selection screen** — card layout grid, hover affordance, "connecting" animation, particle stream behavior, "Build your brain →" CTA.
  5. **Brain loading screen** — particle source points, crystallization choreography, edge formation timing, transition into main view.
  6. **Main brain view** — Three.js canvas, ambient idle behavior, camera orbit speed, all floating panel positions and visual weight.
  7. **Query interaction** — voice + text input affordances, response panel reveal, graph reaction sequencing.
  8. **Source drawer** — citation chip styling, slide-out panel motion, content layout.
- Output: `design/BRIEF.md` — a single document containing tokens, motion specs, component anatomy, copy decisions, and reference imagery notes.

**Acceptance criteria:**
- `design/BRIEF.md` exists and covers every screen + every floating panel.
- Brief explicitly resolves the unresolved decisions flagged in §0 and §6.
- A design-tokens object (`design/tokens.json`) is exported for direct use in the frontend.
- User has reviewed and approved the brief in writing before §9 starts.

**Dependencies:** §7 (backend verified — frontend can mock against real shapes).

**Technical notes + risks:**
- The brief is a contract. Phase 3 sections reference it by section number — drift is forbidden.
- Risk: scope creep during interview. Mitigation: timebox the interview; defer "nice to haves" to a `BRIEF_v2.md` for post-hackathon.

---

# PHASE 3 — FRONTEND

> All sections below assume `design/BRIEF.md` is approved. Tokens come from `design/tokens.json`. No code-level design decisions are made ad hoc.

## 9. Frontend Scaffold

**Goal:** A runnable Vite + React + TypeScript app with Tailwind, design tokens, and routing in place.

**Deliverables:**
- `pnpm create vite frontend --template react-ts` (already located at `/frontend`).
- Dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `zustand`, `framer-motion`, `tailwindcss`, `clsx`, `react-router-dom`.
- Tailwind configured with tokens from `design/tokens.json` mapped into `tailwind.config.ts`.
- Routes via `react-router-dom`:
  - `/` → Landing
  - `/connect` → Connector selection
  - `/loading` → Brain loading
  - `/brain` → Main brain view
- API client `src/lib/api.ts` with typed wrappers around `/query`, `/ingest`, `/graph`, `/health`. Types generated from backend OpenAPI (`openapi-typescript`) into `src/lib/api-types.ts`.
- Zustand stores: `src/state/graph.ts`, `src/state/query.ts`, `src/state/connectors.ts`.
- Vercel config (`vercel.json`) for SPA fallback routing.

**Acceptance criteria:**
- `pnpm dev` runs on `http://localhost:5173`.
- All four routes render placeholder text without errors.
- Tailwind tokens render correctly (sample swatches visible on `/`).
- `pnpm build` produces a deployable `dist/`.
- `pnpm tsc --noEmit` passes.

**Dependencies:** §8.

**Technical notes + risks:**
- Generate API types ON the backend's running OpenAPI schema, not by hand.
- Risk: Three.js bundle size. Mitigation: lazy-load the brain route via `React.lazy` so the landing page stays light.

---

## 10. Landing Page

**Goal:** A cinematic landing experience that explains Engram and ushers the user into the connector flow. No auth — the "Proceed →" CTA navigates to `/connect`.

**Deliverables:**
- `src/routes/Landing.tsx` with sections:
  - **Hero** — full-viewport, cinematic entrance (per BRIEF). Brand wordmark, tagline, single CTA.
  - **Scroll narrative** — three to five scroll-pinned sections explaining Engram's value (ingestion, semantic graph, voice query). Use `framer-motion` `useScroll` + `useTransform` for parallax / reveal.
  - **Feature blocks** — connector logos, sample query→answer mockup, graph teaser still.
  - **CTA section** — large "Proceed →" button → `navigate("/connect")`.
- Background: subtle particle field hinting at the brain (low-poly, performance-cheap).
- All copy from BRIEF §3.

**Acceptance criteria:**
- Loads in <1s on a clean cache (Lighthouse perf ≥ 85 on a mid-tier laptop).
- Hero animates in within 400ms of mount.
- Scroll sections are smooth (60fps) on the demo machine.
- "Proceed →" navigates correctly.
- Mobile breakpoint isn't broken (acceptable: simplified layout, demo is desktop only).

**Dependencies:** §9.

**Technical notes + risks:**
- 🚩 Hero particle field shares techniques with the main brain — extract a `<ParticleField/>` primitive in §13 and reuse here.
- Risk: scroll animations on Windows Chrome can stutter. Test on the actual demo machine early.

---

## 11. Connector Selection Screen

**Goal:** A visually impressive selection screen where the user "connects" six sources. All mocked — the selection only fires `POST /ingest/connector/{name}` per chosen card and triggers the next step.

**Deliverables:**
- `src/routes/Connect.tsx`:
  - Grid of 6 cards: Slack, Notion, Google Drive, Confluence, Jira, Teams. Each card uses official-ish wordmarks (no logos requiring license — use simple typography per BRIEF).
  - Click → card pulses and turns its border forest green; emits a particle stream from the card center toward screen center (Three.js or canvas overlay; recommend a single canvas overlay shared across all cards for perf).
  - On click, fire `POST /ingest/connector/{name}` (await the response; show subtle spinner if >1s).
  - "Select all" convenience button (used in demo).
  - Once ≥1 connector is "connected": "Build your brain →" CTA appears, bottom center, navigating to `/loading`.
- Connector status mirrored into `connectors` Zustand store for use on `/brain`.

**Acceptance criteria:**
- Selecting a card visibly animates within 100ms.
- Particle stream lasts 1.5–2.5s, ends at screen center, leaves a faint persistent glow.
- Backend `/ingest/connector/{name}` is called and returns 200 for each selection.
- "Build your brain →" only appears after ≥1 successful connection.
- All six connectors can be selected simultaneously without dropped network calls.

**Dependencies:** §10, §5 (backend connector routes).

**Technical notes + risks:**
- 🚩 Use Web Workers or `requestIdleCallback` for the particle physics if frame rate dips during simultaneous ingests.
- Risk: the backend ingest can take >1s for the full Meridian fixture. Mitigation: show indeterminate progress on the card; do not block the CTA on completion (it can finish during the loading screen).

---

## 12. Brain Loading Animation

**Goal:** A 4–6 second cinematic transition where particles fly in from screen edges, nodes crystallize, edges form, and the camera settles into the main brain view. This is the moment of "wow."

**Deliverables:**
- `src/routes/Loading.tsx` rendering a Three.js canvas (r3f).
- Choreography (timing per BRIEF):
  - **0–1.5s:** particles enter from all four edges, swirling toward center.
  - **1.5–3s:** particles snap into node positions (use the topology from `GET /graph`); each node "crystallizes" with a quick scale-bounce + glow ramp.
  - **3–4.5s:** edges draw between nodes (animated line draw, sequenced by edge strength).
  - **4.5–6s:** camera pulls back to the canonical orbit position; UI panels (§15) fade in.
- Pre-fetch `GET /graph` while particles are still flying so node positions are ready by t=1.5s.
- Skippable on click anywhere (jumps to t=4.5s).
- Auto-navigates to `/brain` at t=6s.

**Acceptance criteria:**
- Full sequence runs at 60fps on the demo machine.
- Real graph topology drives crystallization positions (not faked).
- Skip-on-click works.
- No flash of unstyled canvas at start (initial frame is already dark).

**Dependencies:** §11, §6 (backend graph topology), §13 (graph rendering primitives — can be developed in parallel).

**Technical notes + risks:**
- Risk: if `GET /graph` returns >100 nodes, the choreography looks chaotic. Mitigation: cap visible nodes to top-N by weight during loading; rest fade in on `/brain`.
- 🚩 Consider preloading audio cue (subtle whoosh) timed to crystallization. Confirm in BRIEF §5.

---

## 13. Three.js Semantic Graph — Base Render

**Goal:** The core 3D graph: dark fullscreen canvas, diamond-shaped glowing nodes, color-coded by type, ambient idle motion.

**Deliverables:**
- `src/scene/BrainScene.tsx` — the r3f `<Canvas>` root.
- `src/scene/Node.tsx` — diamond geometry (`OctahedronGeometry`), emissive material, color from node-type palette, halo via post-processing bloom.
- `src/scene/Edge.tsx` — thin line geometry, low opacity, optional flowing-particle decoration (off by default; on during query in §14).
- `src/scene/CameraRig.tsx` — slow orbit using `OrbitControls` with auto-rotate at low speed; snaps to target node on demand.
- `src/scene/IdleMotion.tsx` — adds per-node sin-wave drift on Y, slow breathing scale.
- `src/scene/Postprocessing.tsx` — UnrealBloom + subtle film grain.
- `src/scene/layout.ts` — simple force-directed layout (or hand-tuned per the §0 decision); runs once on graph load, results cached.
- Hooked into `graph` Zustand store; re-renders only when topology changes.

**Acceptance criteria:**
- Renders the full Meridian graph (target 30–80 nodes) at 60fps on the demo machine.
- Each node type has the correct color from BRIEF.
- Idle drift is visible but not distracting (≤2px node displacement at canonical zoom).
- Camera orbits at the configured speed; OrbitControls dampening enabled.
- No memory leaks across route changes (verified by mounting/unmounting `/brain` 10× and watching DevTools Memory).

**Dependencies:** §9, §6.

**Technical notes + risks:**
- 🚩 **Decision:** post-processing budget — confirmed in BRIEF. If perf drops below 60fps, drop chromatic aberration first, bloom intensity second.
- Risk: instanced rendering may be needed if node count grows. Pre-hackathon, naive per-node mesh is fine.
- Use `useFrame` sparingly — only the IdleMotion component needs it.

---

## 14. Three.js — Query Reaction Animations

**Goal:** When a query lands, the graph visibly reacts: relevant nodes fly forward, glow, edges pulse with traveling particles, ripples emanate from the cluster. When Engram speaks, nodes pulse to the cadence of the voice.

**Deliverables:**
- `src/scene/QueryReaction.tsx` — orchestrator listening to `query` Zustand store events:
  - On `activated_nodes` update:
    1. Animate those nodes' Z position forward (toward camera) by ~1 unit, eased.
    2. Ramp their emissive intensity 3× and add a layered halo (extra mesh ring).
    3. Identify "hot edges" (edges connecting any two activated nodes); animate traveling particles along them.
    4. Spawn a single ripple shader from the cluster centroid, expanding outward, fading.
- `src/scene/SpeechPulse.tsx` — when TTS audio is playing, sample audio amplitude (Web Audio API analyser node) and modulate node scale + bloom intensity in lockstep. Graph "breathes with the voice."
- On query end: nodes ease back to base positions over ~2s.

**Acceptance criteria:**
- A canned demo query reliably triggers the full reaction sequence.
- 60fps maintained during reaction with up to 10 activated nodes.
- Speech pulse modulation is visibly synchronized to audio (no perceptible lag).
- After 5 consecutive queries, graph state is clean (no orphaned ripples or stuck halos).

**Dependencies:** §13, §16 (voice — for the SpeechPulse audio analyser hookup).

**Technical notes + risks:**
- Risk: WebAudio analyser on ElevenLabs audio requires capturing the audio element's MediaStream — tested patterns exist; budget time for this. Browser TTS fallback can't be analysed → fall back to fake amplitude curve driven by text length.
- 🚩 **Decision:** ripple shader vs. expanding mesh — confirm in BRIEF. Recommend mesh for simplicity unless BRIEF demands a custom shader.

---

## 15. Floating UI Panels

**Goal:** Six floating panels overlaid on the brain canvas, providing all status and interaction surfaces. Each panel is a glass-effect card per BRIEF.

**Deliverables:** Components under `src/panels/`:
- `WordmarkPanel.tsx` — top-left: "Engram" wordmark + "Company Memory" subtitle.
- `LegendPanel.tsx` — top-center: node-type legend (5 swatches + labels).
- `StatsPill.tsx` — top-right: live counters from `GET /graph` (nodes, edges, coverage %, sync status indicator dot).
- `SourcesPanel.tsx` — bottom-left: connector status row, each with a colored dot (green=synced, grey=disconnected). Pulled from `connectors` store.
- `ResponsePanel.tsx` — bottom-right: typewriter-rendered answer text + horizontal row of citation chips. Each chip is clickable → opens drawer (§17).
- `QueryBar.tsx` — bottom-center: mic button + text input + submit. Voice integration in §16.
- All panels use `position: fixed` with z-index above canvas, and `pointer-events: auto` only on interactive elements.

**Acceptance criteria:**
- All six panels render in correct positions across resolutions 1280×720 → 1920×1080.
- Panels do not block essential graph interaction (mouse drag still works on canvas areas not covered by panels).
- StatsPill updates within 1s of a graph mutation.
- ResponsePanel typewriter speed matches BRIEF (~30 chars/sec recommended).

**Dependencies:** §13.

**Technical notes + risks:**
- Use `framer-motion` for panel mount/unmount transitions (slide-in from edge per BRIEF).
- Risk: backdrop-filter (glass effect) on Chrome Windows can be costly. Test on demo machine; have a flat fallback ready.

---

## 16. Voice Input + Output

**Goal:** Push-to-talk voice input via Web Speech API, ElevenLabs TTS for responses, browser TTS fallback. Visual feedback on the mic button while listening.

**Deliverables:**
- `src/voice/useSpeechRecognition.ts` — wraps Web Speech API `SpeechRecognition`. Returns `{ start, stop, transcript, isListening, error }`.
- `src/voice/useTTS.ts` — `speak(text)` that:
  1. Calls backend `POST /tts` (NEW route — stream/return ElevenLabs audio bytes; backend keeps the API key, frontend never sees it).
  2. Plays the audio via an `<audio>` element with WebAudio analyser piped into §14's SpeechPulse.
  3. On any failure, falls back to `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`.
- New backend route `POST /tts` in `app/routes/tts.py` — proxies to ElevenLabs with the org's voice ID, returns audio/mpeg stream.
- `QueryBar.tsx` mic button:
  - Hold-to-talk (mousedown/touchstart → start; mouseup/touchend → stop).
  - While listening: pulsing red ring + waveform visualizer.
  - On stop: transcript populates the text field; user can edit before submit; pressing Enter or clicking submit fires `POST /query`.
- Auto-speak the answer: when a query response arrives, `useTTS.speak(response.answer)` is invoked.

**Acceptance criteria:**
- Mic button records and produces an accurate transcript on Chrome (the demo browser).
- ElevenLabs TTS plays within ~1s of response arriving.
- Fallback TTS triggers correctly when backend `/tts` is offline (test by stopping backend mid-flow).
- Audio analyser feeds SpeechPulse correctly (visual sync confirmed).

**Dependencies:** §15, §14.

**Technical notes + risks:**
- 🚩 Web Speech API is Chrome-only in practice. Demo MUST be on Chrome. Document this.
- Risk: ElevenLabs API rate limits during demo. Mitigation: pre-generate the 3 demo answers as static MP3 files and serve them from the backend if the canned-answer path is hit.
- The backend TTS route MUST never expose the API key in responses — use streaming response only.

---

## 17. Source Drawer

**Goal:** A right-edge slide-out drawer revealing the full source detail (title, type, author, timestamp, excerpt) when any citation chip is tapped.

**Deliverables:**
- `src/panels/SourceDrawer.tsx`:
  - Slides in from right over 250ms (framer-motion).
  - Shows: source title, type icon, author, formatted timestamp, full excerpt (not truncated), "View original" placeholder button (no-op pre-hackathon).
  - Closes on: tap outside, Escape key, X button.
  - Drawer state in a small Zustand slice: `{ activeSource: Source | null, open: bool }`.
- Citation chips in `ResponsePanel` set `activeSource` and `open: true` on click.

**Acceptance criteria:**
- Click any citation chip → drawer slides in within 300ms.
- All fields render correctly for every source type.
- Click outside / Escape / X all close the drawer.
- Drawer is keyboard-accessible (focus trap, focus returns to chip on close).

**Dependencies:** §15.

**Technical notes + risks:**
- Use `framer-motion`'s `AnimatePresence` for clean unmount.
- Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the title.

---

# PHASE 4 — WIRE + DEMO DATA

## 18. Frontend ↔ Backend Wiring

**Goal:** Replace all frontend mocks with real backend calls. End-to-end loop: connector click → ingest → graph populates → query → response panel + graph reaction.

**Deliverables:**
- All Zustand stores fetch from real endpoints.
- Error states handled in UI (toast on failure, retry button).
- API base URL via `VITE_API_BASE_URL` env var (`http://localhost:8000` dev, Render URL prod).
- `src/lib/api.ts` includes a request interceptor logging request/response IDs in dev for debugging.

**Acceptance criteria:**
- Full demo flow runs end-to-end with no mocks: Landing → Connect (click all six) → Loading → Brain → ask 3 demo questions → graph reacts, voice plays, drawer opens for each citation.
- Graceful failure: if backend is offline, landing still loads, connector screen shows clear error.
- Network panel shows expected calls in expected order.

**Dependencies:** §17, §7.

**Technical notes + risks:**
- 🚩 CORS: ensure backend allows the deployed Vercel origin before the demo.
- Risk: slow responses make the UI feel broken. Add a 100ms-debounced loading indicator on the QueryBar so micro-delays don't show a spinner, but real waits do.

---

## 19. Meridian Mock Dataset

**Goal:** A fictional startup "Meridian" with rich, interconnected content across all six connectors, designed to make the demo questions return spectacular answers.

**Deliverables:**
- `data/meridian/` containing:
  - `slack/` — 5 channels × 40+ messages = **200+ messages** (`#general`, `#engineering`, `#product`, `#design`, `#leadership`).
  - `notion/` — **10 pages** (product spec, design system, OKRs, hiring loop, retro notes, architecture decision records, runbook, customer research, roadmap, brand guide).
  - `confluence/` — 10 pages (overlapping topics, written more formally).
  - `drive/` — **3 PDFs** with extracted text: pitch deck, tech spec, onboarding doc.
  - `jira/` — **20 tickets** (mix of bugs, stories, epics) referencing people from Slack and decisions from Notion.
  - `teams/` — equivalent to a few Slack threads, formatted as Teams messages.
- `data/meridian/demo_questions.md` — the **canonical 3–5 demo questions** with their canned answers (these become `app/services/canned_answers.py` entries):
  - Examples (TBD, finalize during this section):
    - "Why did we choose Postgres over Mongo?"
    - "Who's the owner of the new pricing model?"
    - "What's blocking the v2 launch?"
- All content cross-referenced: every demo question's answer cites ≥3 sources from ≥2 different connectors, and activates ≥4 graph nodes spread across node types.

**Acceptance criteria:**
- Ingesting the full Meridian dataset produces a graph in the target 30–80 node range with rich edge density.
- Each demo question, when asked through the live UI, produces:
  - A coherent multi-sentence answer.
  - 3+ citation chips that open valid drawer content.
  - 4+ activated nodes spanning ≥2 node types.
  - A graph reaction that visually "lights up" a recognizable cluster.
- Hardcoded fallback in `canned_answers.py` is byte-for-byte identical to the live answer for each demo question (so the demo is bulletproof).

**Dependencies:** §18.

**Technical notes + risks:**
- 🚩 **Hard requirement:** demo questions must be locked before this section starts. Confirm with user.
- Risk: the dataset takes longer than expected to author. Budget 1 full day; reuse generated content patterns across connectors where possible.
- Quality > quantity. Better to have 200 great Slack messages than 1000 throwaway ones.

---

## 20. Polish Pass

**Goal:** A final round of UX/UI polish before the demo recording. Catch alignment, spacing, motion, and copy bugs.

**Deliverables:**
- Run `/polish` skill on the full frontend.
- Run `/critique` skill targeting the main brain view.
- Address all P0/P1 findings.
- Cross-browser smoke test (Chrome desktop is primary; verify nothing is catastrophically broken on Edge).
- Performance pass: bundle analyser run, drop unused dependencies, lazy-load Three.js route.
- Record a 60–90 second demo video as the gold-master flow.

**Acceptance criteria:**
- No P0 or P1 polish findings remaining.
- Lighthouse perf ≥ 80 on `/`.
- No console errors or warnings during the full demo flow.
- Demo video shows the entire flow without any visible jank or error toast.

**Dependencies:** §19.

**Technical notes + risks:**
- Risk: late-stage polish reveals architectural issues (e.g., panel z-index conflicts with drawer). Budget 30% buffer time.

---

# PHASE 5 — HACKATHON-DAY INTEGRATIONS

## 21. Backboard Integration (Day-Of)

**Goal:** Replace every Backboard placeholder with real API calls. Org assistant created on first run, Meridian documents uploaded, queries routed through real RAG with `memory="Auto"`.

**Deliverables:**
- `app/services/backboard.py` — real implementation replacing `backboard_stub.py`. Same function signatures (zero-touch upstream swap):
  - `async def create_assistant(name) -> str` — calls Backboard create-assistant endpoint, returns real `asst_*` id.
  - `async def upload_document_to_assistant(assistant_id, content, metadata) -> dict` — real upload with `send_to_llm=False`.
  - `async def create_thread(assistant_id) -> str`.
  - `async def query_assistant(assistant_id, thread_id, query, memory="Auto") -> dict`.
- `app/services/ingestion.py` updated: every chunk is also uploaded to Backboard via `upload_document_to_assistant` with `send_to_llm=False`.
- `app/services/query.py` updated:
  - On query, look up `assistant_id` from `orgs` table (§22) — pre-auth, use a single env-var assistant id.
  - Look up or create `thread_id` for the session.
  - Call `query_assistant` with `memory="Auto"`.
  - Map response into `QueryResponse` shape (sources from Backboard's citation metadata).
  - Canned-answer fallback remains active as a safety net.
- All Backboard writes are `await`ed (no fire-and-forget).
- `BACKBOARD_API_KEY` and `BACKBOARD_BASE_URL` set in Render env.

**Acceptance criteria:**
- First run creates an assistant and stores the id (env var or DB).
- Bulk upload of full Meridian content completes without burning visible credits (`send_to_llm=False` confirmed in logs).
- A live query (not a canned one) returns a reasonable answer with real citations.
- Concurrent queries (2 sessions) don't cross-contaminate threads.
- Falling back to canned answers still works if Backboard returns an error.

**Dependencies:** §20.

**Technical notes + risks:**
- 🚩 **Critical risk:** all memory writes must be `await`ed. Verify with a stress test (10 concurrent ingests + 5 concurrent queries). Race conditions here are silent and wreck the demo.
- Risk: Backboard's response shape may not match exactly; budget time to write a translator layer.
- Keep stub module on disk (`backboard_stub.py`) and make `backboard.py` the active import — easy rollback if integration breaks mid-day.

---

## 22. Supabase Auth + Org Model (Day-Of)

**Goal:** Real Google OAuth, users, orgs, org membership. The auth screen is added here — it's the only point in the build where it appears.

**Deliverables:**
- Supabase project created; tables:
  - `users (id, email, name, avatar_url, created_at)`
  - `orgs (id, name, backboard_assistant_id, created_at)`
  - `org_members (user_id, org_id, role, created_at)` — composite PK.
- Supabase Google OAuth provider configured with prod redirect URL.
- Frontend:
  - New route `/login` with a single "Sign in with Google" button.
  - On first authenticated load with no org: prompt user to create org → triggers backend `POST /orgs` which creates Backboard assistant and stores `assistant_id`.
  - Auth guard wraps `/connect`, `/loading`, `/brain` routes.
  - Landing page CTA changes to "Sign in →" → `/login`.
  - Session token sent in `Authorization: Bearer <jwt>` header to backend.
- Backend:
  - `app/services/auth.py` — Supabase JWT verification middleware.
  - `app/routes/orgs.py` — `POST /orgs`, `GET /orgs/me`.
  - `session_id` in `QueryRequest` is now derived from `(user_id, current_org_id)`; `thread_id` cached per session in `org_members` extension table or Redis (or in-memory dict for hackathon).
- All existing endpoints now require auth (except `/health`).

**Acceptance criteria:**
- New user can: land → "Sign in" → Google OAuth → first-org-create flow → connector screen → full demo.
- Returning user lands directly on their last org's brain view.
- An unauthenticated request to `/query` returns 401.
- `backboard_assistant_id` is populated for the org and reused across the org's members.

**Dependencies:** §21.

**Technical notes + risks:**
- 🚩 OAuth redirect URLs must be configured for both `localhost:5173` AND the Vercel prod URL before the demo.
- Risk: JWT verification adds latency to every request. Mitigation: cache the JWKS keys; verify locally without round-tripping to Supabase.
- 🚩 Multi-tenant data isolation: every backend store mutation must scope by `org_id`. The pre-hackathon single-tenant `data/store.json` does NOT survive this change — refactor to `data/store/{org_id}.json` or Supabase Postgres tables.
- This section is the largest day-of risk. If time is tight, ship with a single hardcoded org and skip multi-org until post-hackathon.

---

# Cross-Cutting Concerns

## Open Questions (Roll-Up)

These are the unresolved items flagged inline above. All must be answered before their owning phase begins.

| # | Question | Owner | Resolved by |
|---|---|---|---|
| 1 | Three.js post-processing budget (which effects, intensities) | Design | §8 BRIEF |
| 2 | Graph layout: force-directed vs. hand-tuned for demo determinism | Design + Eng | §8 BRIEF |
| 3 | ElevenLabs voice ID | Design | §20 polish |
| 4 | Final demo questions (drives canned answers + dataset shape) | Product | Before §19 starts |
| 5 | Node positions backend or frontend | Eng | §8 BRIEF (recommend frontend) |
| 6 | Chunk overlap value (default 50 tokens) | Eng | §19 dataset tuning |
| 7 | Ripple effect: shader vs. mesh | Design | §8 BRIEF |
| 8 | Audio cue during loading sequence (yes/no) | Design | §8 BRIEF §5 |
| 9 | Multi-tenant scope on hackathon day (single org vs. real multi-org) | Product | Before §22 starts |

## Risks Roll-Up (Top 5)

1. **Backboard async race conditions** — every memory write must be awaited; stress-test in §21.
2. **Demo voice failure** — Web Speech API + ElevenLabs are external dependencies; both have fallbacks but they must be tested.
3. **Three.js perf on demo machine** — test §13 and §14 on the actual demo hardware before §20.
4. **Meridian dataset author time** — §19 is a content-heavy task that historically blows budgets; start it the moment §18 wires up.
5. **CORS / OAuth redirect misconfiguration** — both have bitten every demo deploy; checklist them in §18 and §22.

## Definition of Done — Whole Product

The full Engram demo is done when:
- A first-time visitor on Chrome can: land → proceed → connect 6 sources → watch the brain form → ask a voice question → hear the answer spoken → see the graph react → tap a citation → see the source detail. **In under 90 seconds, with zero console errors, on the demo machine.**
- The 3–5 canonical demo questions all return spectacular answers with cited sources and visible graph reactions.
- All Backboard and Supabase integrations are live (Phase 5 complete) OR the pre-Phase-5 build is the demo and Phase 5 is post-demo polish — confirm with user before hackathon day.
