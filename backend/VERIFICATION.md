# Backend Verification Checklist — Phase 1 Gate

> Run `.\tasks.ps1 verify-backend` from `backend/` before advancing to Phase 2.
> Every item below must be checked before the frontend shape interview begins.

---

## Automated (pytest)

- [x] **154 tests pass** with zero warnings (`pytest --tb=short`)
- [x] **§2 contracts**: all 4 routes return correct shapes; invalid payloads return 422
- [x] **§3 ingestion**: chunking, entity extraction, dedup, edge formation, store.json persistence
- [x] **§4 query**: canned answers hit for demo questions; keyword fallback for unknown queries; `activated_nodes` non-empty when sources exist; <300ms
- [x] **§5 connectors**: all 6 implement the Connector interface; each yields ≥1 `IngestRequest`; OAuth swap-point comment present in every module
- [x] **§6 graph state**: `add_or_update_node`, `add_or_strengthen_edge`, `mark_active` all correct; `activated_for_query` returns 3–8 IDs; concurrent ingests don't corrupt state
- [x] **§7 E2E**: all 6 connectors ingest successfully; graph has ≥10 nodes and edges ≥ nodes; 3 demo questions all return non-empty answer/sources/activated_nodes; `last_active` updated after query; graph survives simulated restart

---

## Manual curl verification

### Health
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"engram-backend"}
```

### Ingest a Slack connector batch
```bash
curl -X POST http://localhost:8000/ingest/connector/slack
# Expected: {"ingested_id":"...","nodes_created":N,"edges_created":M,"chunk_count":K}
```

### Query — demo question (canned answer)
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Why did we choose Postgres?"}'
# Expected: answer non-empty, sources non-empty, activated_nodes non-empty
```

### Query — unknown question (keyword fallback)
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the deployment strategy for orion?"}'
# Expected: answer contains excerpt or graceful fallback; no 500
```

### Graph state
```bash
curl http://localhost:8000/graph
# Expected: {"nodes":[...],"edges":[...]} — non-empty after connector ingest
```

### Restart persistence
```bash
# 1. Run: uvicorn app.main:app --reload --port 8000
# 2. POST /ingest/connector/slack
# 3. Stop uvicorn (Ctrl-C)
# 4. Restart uvicorn
# 5. GET /graph — nodes must still be present (loaded from data/store.json)
```

---

## Security checklist

- [x] No API keys hardcoded — all read from `.env` via `pydantic-settings`
- [x] `.gitignore` covers all `.env` variants (`*.env`, `.env.*`, `backend/.env`)
- [x] ElevenLabs key is backend-only (`ELEVENLABS_API_KEY` in `backend/.env.example`)
- [x] Backboard and Supabase keys are backend-only with clear `# PLACEHOLDER` markers
- [x] CORS locked to `http://localhost:5173` + Vercel URL (configured via env)

---

## Placeholder registry confirmed

All swap points accounted for in `ENGRAM.md §9`:
- [x] `backboard_stub.py` — entire module, 4 functions
- [x] `ingestion.py` — `upload_document_to_assistant` call in `process_ingest`
- [x] `query.py` — `query_assistant` call in `handle_query` (marked `=== BACKBOARD SWAP POINT ===`)
- [x] `store.py` — in-memory/JSON replaced by Postgres in §22
- [x] All 6 connectors — `# === REAL OAUTH SWAP POINT ===` in each

---

**Gate status: ✅ PASSED — Phase 1 complete. Ready for Phase 2 (§8 frontend shape interview).**
