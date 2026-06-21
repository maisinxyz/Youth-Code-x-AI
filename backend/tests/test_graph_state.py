"""
§6 acceptance tests: GraphState singleton — CRUD, concurrency safety,
activated_for_query bounds, and route integration.
"""
import asyncio
import uuid
import pytest
from datetime import datetime, timezone

from app.models.schemas import GraphNode, GraphEdge, GraphResponse, NodeType, IngestRequest
from app.services import store as store_module
from app.services import graph_state as gs_module
from app.services.graph_state import GraphState, get_graph_state
from app.services.ingestion import process_ingest


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_all(tmp_path, monkeypatch):
    monkeypatch.setattr(store_module, "_STORE_PATH", tmp_path / "store.json")
    store_module.reset()
    gs_module.reset()
    yield
    store_module.reset()
    gs_module.reset()


def _node(label: str, ntype: NodeType = NodeType.TECH) -> GraphNode:
    return GraphNode(
        id=str(uuid.uuid4()),
        label=label,
        type=ntype,
        connections=[],
        weight=0.5,
        last_active=None,
    )


def _ingest_req(content: str) -> IngestRequest:
    return IngestRequest(
        content=content,
        source_type="slack",
        source_name="#eng",
        timestamp=datetime(2024, 3, 1, 10, 0, 0, tzinfo=timezone.utc),
        author="alice",
    )


# ── add_or_update_node ────────────────────────────────────────────────────────

async def test_add_or_update_node_returns_true_for_new_node():
    gs = get_graph_state()
    node = _node("Postgres")
    is_new = await gs.add_or_update_node(node)
    assert is_new is True


async def test_add_or_update_node_returns_false_for_existing_node():
    gs = get_graph_state()
    node = _node("Postgres")
    await gs.add_or_update_node(node)
    is_new = await gs.add_or_update_node(node)
    assert is_new is False


async def test_add_or_update_node_dedupes_by_label_case_insensitive():
    gs = get_graph_state()
    await gs.add_or_update_node(_node("Postgres"))
    is_new = await gs.add_or_update_node(_node("postgres"))
    assert is_new is False


async def test_add_or_update_node_increments_weight_on_repeat():
    gs = get_graph_state()
    node = _node("Redis")
    await gs.add_or_update_node(node)
    await gs.add_or_update_node(node)
    nodes = store_module.all_nodes()
    redis_node = next((n for n in nodes if n.label.lower() == "redis"), None)
    assert redis_node is not None
    assert redis_node.weight > 0.5


# ── add_or_strengthen_edge ────────────────────────────────────────────────────

async def test_add_or_strengthen_edge_creates_new_edge():
    gs = get_graph_state()
    n1 = _node("Postgres")
    n2 = _node("Redis")
    r1 = await gs.add_or_update_node(n1)
    r2 = await gs.add_or_update_node(n2)
    edge = await gs.add_or_strengthen_edge(n1.id, n2.id, "co-mentioned")
    assert isinstance(edge, GraphEdge)
    assert edge.strength >= 1.0


async def test_add_or_strengthen_edge_increments_strength_on_repeat():
    gs = get_graph_state()
    n1 = _node("Kafka")
    n2 = _node("Redis")
    await gs.add_or_update_node(n1)
    await gs.add_or_update_node(n2)
    e1 = await gs.add_or_strengthen_edge(n1.id, n2.id, "co-mentioned")
    e2 = await gs.add_or_strengthen_edge(n1.id, n2.id, "co-mentioned")
    assert e2.strength > e1.strength


async def test_add_or_strengthen_edge_is_symmetric_for_dedup():
    gs = get_graph_state()
    n1 = _node("Alice", NodeType.PERSON)
    n2 = _node("Bob", NodeType.PERSON)
    await gs.add_or_update_node(n1)
    await gs.add_or_update_node(n2)
    await gs.add_or_strengthen_edge(n1.id, n2.id, "co-mentioned")
    await gs.add_or_strengthen_edge(n2.id, n1.id, "co-mentioned")  # reversed
    edges = store_module.all_edges()
    # Should be ONE edge, not two
    alice_bob_edges = [
        e for e in edges
        if set([e.source, e.target]) == {n1.id, n2.id}
    ]
    assert len(alice_bob_edges) == 1
    assert alice_bob_edges[0].strength >= 2.0


# ── mark_active ───────────────────────────────────────────────────────────────

async def test_mark_active_updates_last_active_timestamp():
    gs = get_graph_state()
    node = _node("Docker")
    await gs.add_or_update_node(node)
    before = datetime.now(timezone.utc)
    await gs.mark_active([node.id])
    nodes = store_module.all_nodes()
    docker = next((n for n in nodes if n.label.lower() == "docker"), None)
    assert docker is not None
    assert docker.last_active is not None
    assert docker.last_active >= before


async def test_mark_active_with_empty_list_does_not_raise():
    gs = get_graph_state()
    await gs.mark_active([])  # should not raise


async def test_mark_active_ignores_unknown_node_ids():
    gs = get_graph_state()
    await gs.mark_active(["nonexistent-id-xyz"])  # should not raise


# ── to_response ───────────────────────────────────────────────────────────────

async def test_to_response_returns_graph_response():
    gs = get_graph_state()
    resp = gs.to_response()
    assert isinstance(resp, GraphResponse)
    assert isinstance(resp.nodes, list)
    assert isinstance(resp.edges, list)


async def test_to_response_includes_added_nodes():
    gs = get_graph_state()
    await gs.add_or_update_node(_node("Kubernetes"))
    resp = gs.to_response()
    labels = [n.label for n in resp.nodes]
    assert "Kubernetes" in labels


# ── activated_for_query ───────────────────────────────────────────────────────

async def test_activated_for_query_returns_between_3_and_8_ids():
    gs = get_graph_state()
    # Ingest enough content to build a meaningful graph
    await process_ingest(_ingest_req(
        "Alice and Bob decided to use Postgres and Redis for the Atlas project. "
        "Docker and Kubernetes handle the infrastructure. Python is the language."
    ))
    await process_ingest(_ingest_req(
        "Carol reviewed the React dashboard with Dave. TypeScript was chosen. "
        "The Orion project uses Kafka and Airflow for the pipeline."
    ))
    nodes = store_module.all_nodes()
    seed_ids = [nodes[0].id] if nodes else []
    result = gs.activated_for_query("postgres redis database", seed_ids)
    assert 3 <= len(result) <= 8, f"Expected 3-8 IDs, got {len(result)}: {result}"


async def test_activated_for_query_never_empty_when_nodes_exist():
    gs = get_graph_state()
    await process_ingest(_ingest_req(
        "Alice owns the Atlas project and uses Postgres."
    ))
    nodes = store_module.all_nodes()
    seed_ids = [nodes[0].id] if nodes else []
    result = gs.activated_for_query("atlas postgres", seed_ids)
    assert len(result) > 0


async def test_activated_for_query_never_returns_all_nodes():
    gs = get_graph_state()
    # Create a larger graph
    for i in range(10):
        await gs.add_or_update_node(_node(f"Node{i}"))
    total = len(store_module.all_nodes())
    result = gs.activated_for_query("query", [store_module.all_nodes()[0].id])
    assert len(result) < total


async def test_activated_for_query_includes_seed_ids():
    gs = get_graph_state()
    await process_ingest(_ingest_req(
        "Alice and Postgres are core to Atlas. Bob handles Docker."
    ))
    nodes = store_module.all_nodes()
    seed_id = nodes[0].id
    result = gs.activated_for_query("anything", [seed_id])
    assert seed_id in result


# ── concurrency ───────────────────────────────────────────────────────────────

async def test_concurrent_ingests_dont_corrupt_node_count():
    """10 concurrent ingests of different content — node count must be consistent."""
    contents = [
        f"Alice and Postgres work on the Atlas project in Q{i+1}."
        for i in range(10)
    ]
    reqs = [_ingest_req(c) for c in contents]
    await asyncio.gather(*[process_ingest(r) for r in reqs])
    nodes = store_module.all_nodes()
    # Alice and Postgres and Atlas should each appear exactly once (deduped)
    alice_nodes = [n for n in nodes if n.label.lower() == "alice"]
    assert len(alice_nodes) == 1, f"Alice dedup failed: {len(alice_nodes)} copies"
    postgres_nodes = [n for n in nodes if n.label.lower() == "postgres"]
    assert len(postgres_nodes) == 1, f"Postgres dedup failed: {len(postgres_nodes)} copies"


async def test_concurrent_ingests_dont_duplicate_edges():
    contents = [
        "Alice and Postgres are the key players in Atlas. " * 3
        for _ in range(5)
    ]
    await asyncio.gather(*[process_ingest(_ingest_req(c)) for c in contents])
    edges = store_module.all_edges()
    # Check no duplicate (source, target) pairs
    pairs = [(min(e.source, e.target), max(e.source, e.target)) for e in edges]
    assert len(pairs) == len(set(pairs)), "Duplicate edges found after concurrent ingests"
