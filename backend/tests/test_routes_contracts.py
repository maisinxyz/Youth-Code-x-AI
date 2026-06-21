"""
§2 acceptance test: every endpoint returns a response that matches its schema,
and invalid payloads return 422.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models.schemas import GraphResponse, IngestResponse, QueryResponse

TRANSPORT = ASGITransport(app=app)
BASE = "http://test"

VALID_INGEST_PAYLOAD = {
    "content": "We decided to use Postgres over Mongo for ACID compliance.",
    "source_type": "slack",
    "source_name": "#engineering",
    "timestamp": "2024-03-01T10:00:00Z",
    "author": "alice",
}

VALID_QUERY_PAYLOAD = {"query": "Why did we choose Postgres?"}


# ── GET /health ──────────────────────────────────────────────────────────────

async def test_health_shape():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "engram-backend"


# ── POST /query ──────────────────────────────────────────────────────────────

async def test_query_valid_payload_returns_200():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/query", json=VALID_QUERY_PAYLOAD)
    assert r.status_code == 200


async def test_query_response_matches_schema():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/query", json=VALID_QUERY_PAYLOAD)
    parsed = QueryResponse.model_validate(r.json())
    assert isinstance(parsed.answer, str)
    assert isinstance(parsed.sources, list)
    assert isinstance(parsed.activated_nodes, list)
    assert isinstance(parsed.session_id, str) and len(parsed.session_id) > 0


async def test_query_session_id_generated_when_absent():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/query", json={"query": "test"})
    body = r.json()
    assert "session_id" in body
    assert body["session_id"]  # non-empty


async def test_query_session_id_echoed_when_provided():
    sid = "my-session-abc"
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/query", json={"query": "test", "session_id": sid})
    assert r.json()["session_id"] == sid


async def test_query_missing_query_field_returns_422():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/query", json={})
    assert r.status_code == 422


# ── POST /ingest ─────────────────────────────────────────────────────────────

async def test_ingest_valid_payload_returns_200():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/ingest", json=VALID_INGEST_PAYLOAD)
    assert r.status_code == 200


async def test_ingest_response_matches_schema():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/ingest", json=VALID_INGEST_PAYLOAD)
    parsed = IngestResponse.model_validate(r.json())
    assert isinstance(parsed.ingested_id, str) and len(parsed.ingested_id) > 0
    assert isinstance(parsed.nodes_created, int)
    assert isinstance(parsed.edges_created, int)
    assert isinstance(parsed.chunk_count, int)


async def test_ingest_invalid_source_type_returns_422():
    payload = {**VALID_INGEST_PAYLOAD, "source_type": "twitter"}
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/ingest", json=payload)
    assert r.status_code == 422


async def test_ingest_missing_content_returns_422():
    payload = {k: v for k, v in VALID_INGEST_PAYLOAD.items() if k != "content"}
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/ingest", json=payload)
    assert r.status_code == 422


async def test_ingest_connector_stub_returns_200():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/ingest/connector/slack")
    assert r.status_code == 200
    IngestResponse.model_validate(r.json())


# ── GET /graph ───────────────────────────────────────────────────────────────

async def test_graph_returns_200():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.get("/graph")
    assert r.status_code == 200


async def test_graph_response_matches_schema():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.get("/graph")
    parsed = GraphResponse.model_validate(r.json())
    assert isinstance(parsed.nodes, list)
    assert isinstance(parsed.edges, list)
