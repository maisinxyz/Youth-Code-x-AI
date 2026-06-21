"""
§7 End-to-End integration test: full backend pipeline gate before Phase 2.

Flow:
  1. Wipe store.
  2. Ingest all six connector endpoints.
  3. GET /graph — assert nodes present from each connector.
  4. POST /query with three demo questions — assert answer / sources / activated_nodes.
  5. GET /graph again — assert last_active updated on activated nodes.
  6. Simulate server restart — assert graph reloads from store.json.
"""
import json
import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.services import store as store_module
from app.services import graph_state as gs_module

TRANSPORT = ASGITransport(app=app)
BASE = "http://test"

DEMO_QUESTIONS = [
    "Why did we choose Postgres?",
    "Who owns the Atlas project?",
    "What decisions were made in Q1?",
]

ALL_CONNECTORS = ["slack", "notion", "drive", "confluence", "jira", "teams"]


# ── Module-level setup: one fresh store for the entire E2E suite ──────────────

@pytest.fixture(scope="module", autouse=True)
def e2e_store(tmp_path_factory):
    """Single fresh store shared across all E2E tests in this module."""
    tmp = tmp_path_factory.mktemp("e2e_store")
    store_path = tmp / "store.json"
    # Directly patch the module attribute (module scope, so monkeypatch can't be used)
    original_path = store_module._STORE_PATH
    store_module._STORE_PATH = store_path
    store_module.reset()
    gs_module.reset()
    yield store_path
    # Restore
    store_module._STORE_PATH = original_path
    store_module.reset()
    gs_module.reset()


# ── Step 1 + 2: Ingest all six connectors ────────────────────────────────────

async def test_e2e_01_all_connectors_return_200():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        for name in ALL_CONNECTORS:
            r = await c.post(f"/ingest/connector/{name}")
            assert r.status_code == 200, f"Connector {name} returned {r.status_code}"
            body = r.json()
            assert body["chunk_count"] >= 1, f"Connector {name} produced no chunks"


# ── Step 3: Graph populated ───────────────────────────────────────────────────

async def test_e2e_02_graph_has_nodes_after_all_connectors():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.get("/graph")
    assert r.status_code == 200
    body = r.json()
    assert len(body["nodes"]) >= 10, \
        f"Expected ≥10 nodes after all connectors, got {len(body['nodes'])}"


async def test_e2e_03_graph_has_more_edges_than_nodes():
    nodes = store_module.all_nodes()
    edges = store_module.all_edges()
    assert len(edges) >= len(nodes), \
        f"Expected edges ({len(edges)}) ≥ nodes ({len(nodes)})"


async def test_e2e_04_graph_contains_known_entities():
    nodes = store_module.all_nodes()
    labels = {n.label.lower() for n in nodes}
    for expected in ["alice", "postgres", "atlas"]:
        assert expected in labels, f"'{expected}' missing from graph after full ingest"


# ── Step 4: Query against the live graph ─────────────────────────────────────

async def test_e2e_05_demo_questions_return_non_empty_answers():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        for question in DEMO_QUESTIONS:
            r = await c.post("/query", json={"query": question})
            assert r.status_code == 200, f"Query failed for: {question!r}"
            body = r.json()
            assert body["answer"], f"Empty answer for: {question!r}"


async def test_e2e_06_demo_questions_return_sources():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        for question in DEMO_QUESTIONS:
            r = await c.post("/query", json={"query": question})
            body = r.json()
            assert isinstance(body["sources"], list), f"No sources list for: {question!r}"


async def test_e2e_07_demo_questions_return_activated_nodes():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        for question in DEMO_QUESTIONS:
            r = await c.post("/query", json={"query": question})
            body = r.json()
            assert len(body["activated_nodes"]) >= 1, \
                f"No activated_nodes for: {question!r}"


async def test_e2e_08_activated_nodes_are_valid_graph_node_ids():
    all_node_ids = {n.id for n in store_module.all_nodes()}
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/query", json={"query": "Why did we choose Postgres?"})
    body = r.json()
    for nid in body["activated_nodes"]:
        assert nid in all_node_ids, f"activated_node {nid!r} not in graph"


async def test_e2e_09_session_id_present_on_all_responses():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        for question in DEMO_QUESTIONS:
            r = await c.post("/query", json={"query": question})
            body = r.json()
            assert body.get("session_id"), f"Missing session_id for: {question!r}"


# ── Step 5: last_active updated after queries ─────────────────────────────────

async def test_e2e_10_last_active_updated_on_activated_nodes():
    before = datetime.now(timezone.utc)
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post("/query", json={"query": "atlas postgres"})
    activated = r.json()["activated_nodes"]
    nodes_by_id = {n.id: n for n in store_module.all_nodes()}
    updated = [
        nodes_by_id[nid] for nid in activated
        if nid in nodes_by_id and nodes_by_id[nid].last_active is not None
    ]
    assert len(updated) >= 1, "No activated nodes had last_active updated"
    for node in updated:
        assert node.last_active >= before, \
            f"Node {node.label!r} last_active not refreshed"


# ── Step 6: Persistence across restart ───────────────────────────────────────

async def test_e2e_11_graph_persists_across_simulated_restart(e2e_store):
    node_count_before = len(store_module.all_nodes())
    edge_count_before = len(store_module.all_edges())
    assert node_count_before > 0, "Nothing to persist — ingest tests must run first"

    # Simulate restart: wipe in-memory, reload from disk
    store_module.reset()
    gs_module.reset()
    store_module._load()  # re-run the load that happens at import time

    node_count_after = len(store_module.all_nodes())
    edge_count_after = len(store_module.all_edges())

    assert node_count_after == node_count_before, \
        f"Node count changed after reload: {node_count_before} → {node_count_after}"
    assert edge_count_after == edge_count_before, \
        f"Edge count changed after reload: {edge_count_before} → {edge_count_after}"


# ── Health check still passes ─────────────────────────────────────────────────

async def test_e2e_12_health_check_passes():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
