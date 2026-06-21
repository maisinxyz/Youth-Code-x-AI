"""
§3 acceptance tests: ingestion pipeline — chunking, entity extraction,
node classification, edge formation, dedupe, and store persistence.
All tests written BEFORE implementation (TDD red phase).
"""
import json
import os
import uuid
import pytest
from datetime import datetime, timezone
from pathlib import Path

from app.models.schemas import NodeType, GraphEdge, IngestRequest
from app.services.ingestion import (
    chunk_text,
    extract_entities,
    classify_node_type,
    build_edges,
    process_ingest,
)
from app.services import store as store_module


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_req(content: str, source_type: str = "slack") -> IngestRequest:
    return IngestRequest(
        content=content,
        source_type=source_type,
        source_name="#engineering",
        timestamp=datetime(2024, 3, 1, 10, 0, 0, tzinfo=timezone.utc),
        author="alice",
    )


def _long_content(word_count: int) -> str:
    """Generate deterministic content with a known entity: 'Postgres'."""
    base = "We decided to use Postgres for ACID compliance in the Atlas project. "
    reps = (word_count // len(base.split())) + 1
    return (base * reps)[: word_count * 6]  # rough char truncation


# ── chunk_text ────────────────────────────────────────────────────────────────

def test_chunk_text_short_content_returns_single_chunk():
    text = "We decided to use Postgres."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_text_long_content_splits_into_multiple_chunks():
    text = _long_content(900)
    chunks = chunk_text(text, max_tokens=400)
    assert len(chunks) >= 2


def test_chunk_text_no_chunk_exceeds_max_tokens():
    text = _long_content(1200)
    chunks = chunk_text(text, max_tokens=400)
    for chunk in chunks:
        word_count = len(chunk.split())
        # Allow slight overshoot for overlap boundary, but never > 450
        assert word_count <= 450, f"Chunk too long: {word_count} words"


def test_chunk_text_adjacent_chunks_share_overlap_words():
    text = _long_content(900)
    chunks = chunk_text(text, max_tokens=400, overlap=50)
    assert len(chunks) >= 2
    # Last 50 words of chunk[0] should appear at start of chunk[1]
    tail_words = chunks[0].split()[-50:]
    head_words = chunks[1].split()[:50]
    shared = set(tail_words) & set(head_words)
    assert len(shared) >= 10, "Adjacent chunks should share significant overlap"


def test_chunk_text_empty_string_returns_empty_list():
    assert chunk_text("") == []


# ── extract_entities ──────────────────────────────────────────────────────────

def test_extract_entities_returns_all_categories():
    result = extract_entities("We use Postgres and Alice owns the Atlas project.")
    assert set(result.keys()) == {"people", "tech", "projects", "decisions", "open_questions"}


def test_extract_entities_finds_known_tech():
    result = extract_entities("The team chose Postgres over MongoDB for ACID compliance.")
    assert "Postgres" in result["tech"] or "MongoDB" in result["tech"]


def test_extract_entities_finds_known_person():
    result = extract_entities("Alice reviewed the architecture with Bob yesterday.")
    assert "Alice" in result["people"] or "Bob" in result["people"]


def test_extract_entities_finds_known_project():
    result = extract_entities("The Atlas project is on track for Q2.")
    assert "Atlas" in result["projects"]


def test_extract_entities_finds_open_question():
    result = extract_entities("Should we migrate to Kafka? TBD pending infra review.")
    assert len(result["open_questions"]) >= 1


def test_extract_entities_no_false_positives_on_empty():
    result = extract_entities("Hello world this is a boring sentence with nothing.")
    for key in result:
        assert isinstance(result[key], list)


# ── classify_node_type ────────────────────────────────────────────────────────

def test_classify_node_type_person():
    nt = classify_node_type("Alice", "Alice reviewed the pull request.")
    assert nt == NodeType.PERSON


def test_classify_node_type_tech():
    nt = classify_node_type("Postgres", "We use Postgres for storage.")
    assert nt == NodeType.TECH


def test_classify_node_type_project():
    nt = classify_node_type("Atlas", "The Atlas project launched last week.")
    assert nt == NodeType.PROJECT


def test_classify_node_type_open_question_tbd():
    nt = classify_node_type("TBD", "The deployment strategy is TBD.")
    assert nt == NodeType.OPEN_QUESTION


def test_classify_node_type_decision_fallback():
    nt = classify_node_type("ACID compliance", "We decided on ACID compliance.")
    assert nt == NodeType.DECISION


# ── build_edges ───────────────────────────────────────────────────────────────

def test_build_edges_creates_edge_between_comentioned_nodes():
    existing: list[GraphEdge] = []
    edges = build_edges(["node-a", "node-b"], existing)
    assert len(edges) >= 1
    sources = {(e.source, e.target) for e in edges}
    assert ("node-a", "node-b") in sources or ("node-b", "node-a") in sources


def test_build_edges_single_node_produces_no_edges():
    edges = build_edges(["node-a"], [])
    assert edges == []


def test_build_edges_strengthens_existing_edge_instead_of_duplicating():
    existing = [GraphEdge(source="node-a", target="node-b", strength=1.0, relationship_type="co-mentioned")]
    edges = build_edges(["node-a", "node-b"], existing)
    # Should update existing, not add a duplicate
    all_pairs = [(e.source, e.target) for e in edges]
    pair_count = sum(
        1 for p in all_pairs
        if set(p) == {"node-a", "node-b"}
    )
    assert pair_count == 1


def test_build_edges_strength_increases_on_repeated_mention():
    existing = [GraphEdge(source="node-a", target="node-b", strength=1.0, relationship_type="co-mentioned")]
    edges = build_edges(["node-a", "node-b"], existing)
    for e in edges:
        if set([e.source, e.target]) == {"node-a", "node-b"}:
            assert e.strength > 1.0


# ── process_ingest ────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_store(tmp_path, monkeypatch):
    """Reset the global store and redirect store.json to a temp dir."""
    monkeypatch.setattr(store_module, "_STORE_PATH", tmp_path / "store.json")
    store_module.reset()
    yield
    store_module.reset()


async def test_process_ingest_returns_ingest_response():
    req = _make_req("We decided to use Postgres for ACID compliance in the Atlas project.")
    resp = await process_ingest(req)
    assert isinstance(resp.ingested_id, str) and len(resp.ingested_id) > 0
    assert isinstance(resp.nodes_created, int)
    assert isinstance(resp.edges_created, int)
    assert isinstance(resp.chunk_count, int) and resp.chunk_count >= 1


async def test_process_ingest_dedupes_nodes_on_repeated_ingest():
    content = "Alice and Postgres are key to the Atlas project."
    req = _make_req(content)
    r1 = await process_ingest(req)
    r2 = await process_ingest(req)
    # Second ingest should create 0 new nodes (all already exist)
    assert r2.nodes_created == 0


async def test_process_ingest_creates_edges_after_related_content():
    await process_ingest(_make_req("Alice works on the Atlas project using Postgres."))
    await process_ingest(_make_req("Atlas uses Postgres for storage. Alice is the owner."))
    await process_ingest(_make_req("Postgres was chosen for Atlas by Alice in Q1."))
    nodes = store_module.all_nodes()
    edges = store_module.all_edges()
    assert len(edges) >= 1


async def test_process_ingest_500_word_payload_under_500ms():
    import time
    content = ("We decided to use Postgres over MongoDB for ACID compliance. " * 50)
    req = _make_req(content)
    start = time.monotonic()
    await process_ingest(req)
    elapsed_ms = (time.monotonic() - start) * 1000
    assert elapsed_ms < 500, f"Ingest took {elapsed_ms:.0f}ms, expected <500ms"


# ── store persistence ─────────────────────────────────────────────────────────

async def test_store_json_written_after_ingest(tmp_path, monkeypatch):
    monkeypatch.setattr(store_module, "_STORE_PATH", tmp_path / "store.json")
    store_module.reset()
    req = _make_req("Alice uses Postgres in the Atlas project.")
    await process_ingest(req)
    assert (tmp_path / "store.json").exists()
    data = json.loads((tmp_path / "store.json").read_text())
    assert "nodes" in data
    assert "edges" in data
