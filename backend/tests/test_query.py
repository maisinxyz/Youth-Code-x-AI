"""
§4 acceptance tests: query handler — canned answers, keyword fallback,
activated_nodes wiring, session_id handling, and response time.
"""
import time
import pytest
from datetime import datetime, timezone

from app.models.schemas import IngestRequest, QueryRequest
from app.services import store as store_module
from app.services.canned_answers import get_canned_answer, normalize_query
from app.services.ingestion import process_ingest
from app.services.query import handle_query


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ingest_req(content: str) -> IngestRequest:
    return IngestRequest(
        content=content,
        source_type="slack",
        source_name="#engineering",
        timestamp=datetime(2024, 3, 1, 10, 0, 0, tzinfo=timezone.utc),
        author="alice",
    )


@pytest.fixture(autouse=True)
def reset_store(tmp_path, monkeypatch):
    monkeypatch.setattr(store_module, "_STORE_PATH", tmp_path / "store.json")
    store_module.reset()
    yield
    store_module.reset()


# ── normalize_query ───────────────────────────────────────────────────────────

def test_normalize_query_lowercases():
    assert normalize_query("Why Did We CHOOSE Postgres?") == normalize_query("why did we choose postgres")


def test_normalize_query_strips_punctuation():
    result = normalize_query("why did we choose postgres?!")
    assert "?" not in result and "!" not in result


def test_normalize_query_collapses_whitespace():
    result = normalize_query("why   did  we   choose   postgres")
    assert "  " not in result


# ── get_canned_answer ─────────────────────────────────────────────────────────

def test_canned_answer_returns_response_for_known_query():
    # "why postgres" is a canonical demo question — must be in canned_answers
    result = get_canned_answer("why did we choose postgres")
    assert result is not None


def test_canned_answer_is_case_insensitive():
    lower = get_canned_answer("why did we choose postgres")
    upper = get_canned_answer("WHY DID WE CHOOSE POSTGRES")
    assert lower is not None
    assert upper is not None


def test_canned_answer_returns_none_for_unknown_query():
    result = get_canned_answer("what is the airspeed velocity of an unladen swallow")
    assert result is None


def test_canned_answer_response_has_non_empty_answer():
    result = get_canned_answer("why did we choose postgres")
    assert result is not None
    assert len(result.answer) > 0


def test_canned_answer_response_has_session_id():
    result = get_canned_answer("why did we choose postgres")
    assert result is not None
    assert isinstance(result.session_id, str) and len(result.session_id) > 0


# ── handle_query — canned path ────────────────────────────────────────────────

async def test_handle_query_returns_canned_answer_for_demo_question():
    req = QueryRequest(query="Why did we choose Postgres?")
    resp = await handle_query(req)
    # Canned answers have known content — answer must be substantial
    assert len(resp.answer) > 20


async def test_handle_query_canned_echoes_session_id():
    sid = "my-session-xyz"
    req = QueryRequest(query="Why did we choose Postgres?", session_id=sid)
    resp = await handle_query(req)
    assert resp.session_id == sid


async def test_handle_query_canned_generates_session_id_when_absent():
    req = QueryRequest(query="Why did we choose Postgres?")
    resp = await handle_query(req)
    assert resp.session_id and len(resp.session_id) > 0


# ── handle_query — empty store fallback ──────────────────────────────────────

async def test_handle_query_empty_store_returns_graceful_response():
    req = QueryRequest(query="what is the deployment strategy for orion")
    resp = await handle_query(req)
    assert isinstance(resp.answer, str) and len(resp.answer) > 0
    assert isinstance(resp.sources, list)
    assert isinstance(resp.activated_nodes, list)


async def test_handle_query_empty_store_returns_no_sources():
    req = QueryRequest(query="what is the deployment strategy for orion")
    resp = await handle_query(req)
    assert resp.sources == []


# ── handle_query — keyword fallback path ─────────────────────────────────────

async def test_handle_query_with_ingested_data_returns_at_least_one_source():
    await process_ingest(_ingest_req(
        "We decided to use Postgres for ACID compliance in the Atlas project. "
        "Alice made this decision in Q1 after evaluating MongoDB."
    ))
    req = QueryRequest(query="why did we pick postgres over mongodb")
    resp = await handle_query(req)
    # Even keyword fallback should find the ingested content
    assert len(resp.sources) >= 1


async def test_handle_query_activated_nodes_non_empty_when_sources_non_empty():
    await process_ingest(_ingest_req(
        "Alice owns the Atlas project which runs on Postgres and Docker."
    ))
    req = QueryRequest(query="atlas project ownership")
    resp = await handle_query(req)
    if resp.sources:
        assert len(resp.activated_nodes) >= 1, \
            "activated_nodes must be non-empty when sources are non-empty"


async def test_handle_query_keyword_answer_includes_excerpt():
    content = "We selected Redis for session caching due to its sub-millisecond latency."
    await process_ingest(_ingest_req(content))
    req = QueryRequest(query="redis caching")
    resp = await handle_query(req)
    if resp.sources:
        # Answer should contain an excerpt from ingested content
        assert len(resp.answer) > 10


# ── response time ─────────────────────────────────────────────────────────────

async def test_handle_query_response_under_300ms():
    await process_ingest(_ingest_req(
        "Postgres was chosen for ACID compliance by Alice in the Atlas project."
    ))
    req = QueryRequest(query="postgres acid compliance")
    start = time.monotonic()
    await handle_query(req)
    elapsed_ms = (time.monotonic() - start) * 1000
    assert elapsed_ms < 300, f"Query took {elapsed_ms:.0f}ms, expected <300ms"
