"""
Local persistence layer: in-memory nodes/edges/chunks dicts backed by data/store.json.
# SUPABASE_PLACEHOLDER — replaced with per-org Postgres tables in Phase 5 §22.
"""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.schemas import GraphEdge, GraphNode

# Resolved at module load; tests can monkeypatch this attribute.
_STORE_PATH: Path = Path(__file__).parent.parent.parent / "data" / "store.json"

# In-memory state
_nodes: dict[str, GraphNode] = {}          # id → GraphNode
_nodes_by_label: dict[str, str] = {}       # lowercase label → id
_edges: dict[tuple[str, str], GraphEdge] = {}  # (src, tgt) sorted pair → GraphEdge
_chunks: list[dict[str, Any]] = []


# ── public read API ───────────────────────────────────────────────────────────

def all_nodes() -> list[GraphNode]:
    return list(_nodes.values())


def all_edges() -> list[GraphEdge]:
    return list(_edges.values())


def get_node_by_label(label: str) -> GraphNode | None:
    node_id = _nodes_by_label.get(label.lower())
    return _nodes.get(node_id) if node_id else None


def all_chunks() -> list[dict[str, Any]]:
    return list(_chunks)


# ── public write API ──────────────────────────────────────────────────────────

def upsert_node(node: GraphNode) -> tuple[GraphNode, bool]:
    """Return (node, was_created). Dedupes by lowercased label."""
    key = node.label.lower()
    existing_id = _nodes_by_label.get(key)
    if existing_id:
        existing = _nodes[existing_id]
        existing.weight = min(1.0, existing.weight + 0.05)
        existing.last_active = datetime.now(timezone.utc)
        _save()
        return existing, False
    _nodes[node.id] = node
    _nodes_by_label[key] = node.id
    _save()
    return node, True


def upsert_edge(edge: GraphEdge) -> tuple[GraphEdge, bool]:
    """Return (edge, was_created). Dedupes by sorted (source, target) pair."""
    key = (min(edge.source, edge.target), max(edge.source, edge.target))
    if key in _edges:
        _edges[key].strength += 1.0
        _save()
        return _edges[key], False
    _edges[key] = GraphEdge(
        source=key[0],
        target=key[1],
        strength=edge.strength,
        relationship_type=edge.relationship_type,
    )
    _save()
    return _edges[key], True


def add_chunk(chunk: dict[str, Any]) -> None:
    _chunks.append(chunk)
    _save()


# ── persistence ───────────────────────────────────────────────────────────────

def _save() -> None:
    path = _STORE_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "nodes": {nid: n.model_dump(mode="json") for nid, n in _nodes.items()},
        "edges": [e.model_dump(mode="json") for e in _edges.values()],
        "chunks": _chunks,
    }
    path.write_text(json.dumps(data, indent=2, default=str))


def _load() -> None:
    global _nodes, _nodes_by_label, _edges, _chunks
    path = _STORE_PATH
    if not path.exists():
        return
    try:
        data = json.loads(path.read_text())
        _nodes = {nid: GraphNode.model_validate(n) for nid, n in data.get("nodes", {}).items()}
        _nodes_by_label = {n.label.lower(): nid for nid, n in _nodes.items()}
        raw_edges = data.get("edges", [])
        _edges = {}
        for e in raw_edges:
            ge = GraphEdge.model_validate(e)
            key = (min(ge.source, ge.target), max(ge.source, ge.target))
            _edges[key] = ge
        _chunks = data.get("chunks", [])
    except Exception:
        pass


def reset() -> None:
    """Clear all in-memory state. Used in tests."""
    global _nodes, _nodes_by_label, _edges, _chunks
    _nodes = {}
    _nodes_by_label = {}
    _edges = {}
    _chunks = []


# Load on first import
_load()
