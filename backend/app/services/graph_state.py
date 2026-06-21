"""
Graph state singleton: lock-protected mutations + graph-level operations.
Wraps store.py — all persistence stays there. This layer adds:
  - asyncio.Lock around every mutation (concurrency safety)
  - mark_active: stamps last_active on queried nodes
  - activated_for_query: 1-hop neighbor expansion, 3-8 node return window
  - to_response: thin wrapper over store reads

Hooked into ingestion (§3) and query (§4).
"""
import asyncio
from datetime import datetime, timezone

from app.models.schemas import GraphEdge, GraphNode, GraphResponse, NodeType
from app.services import store

# Strength threshold for 1-hop expansion in activated_for_query
_NEIGHBOR_THRESHOLD = 1.0
_MIN_ACTIVATED = 3
_MAX_ACTIVATED = 8


class GraphState:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()

    # ── mutations (all lock-protected) ────────────────────────────────────────

    async def add_or_update_node(self, node: GraphNode) -> bool:
        """Upsert a node. Returns True if newly created."""
        async with self._lock:
            _, was_created = store.upsert_node(node)
            return was_created

    async def add_or_strengthen_edge(
        self,
        source_id: str,
        target_id: str,
        relationship_type: str,
    ) -> GraphEdge:
        """Upsert an edge, incrementing strength on repeat. Returns a snapshot."""
        async with self._lock:
            edge = GraphEdge(
                source=source_id,
                target=target_id,
                strength=1.0,
                relationship_type=relationship_type,
            )
            upserted, _ = store.upsert_edge(edge)
            # Return a value-copy so the caller's reference doesn't change under them
            return GraphEdge(
                source=upserted.source,
                target=upserted.target,
                strength=upserted.strength,
                relationship_type=upserted.relationship_type,
            )

    async def mark_active(self, node_ids: list[str]) -> None:
        """Stamp last_active = now() on each node in node_ids."""
        if not node_ids:
            return
        now = datetime.now(timezone.utc)
        all_nodes = {n.id: n for n in store.all_nodes()}
        async with self._lock:
            for nid in node_ids:
                node = all_nodes.get(nid)
                if node is not None:
                    node.last_active = now

    # ── reads (no lock needed — Python GIL protects list/dict reads) ──────────

    def to_response(self) -> GraphResponse:
        return GraphResponse(nodes=store.all_nodes(), edges=store.all_edges())

    def activated_for_query(
        self,
        query: str,
        seed_node_ids: list[str],
    ) -> list[str]:
        """
        Return 3–8 node IDs for graph highlighting:
        1. Start with seed_node_ids (nodes from top-K chunks).
        2. Expand by 1-hop neighbors whose edge strength >= threshold.
        3. Clamp to [_MIN_ACTIVATED, _MAX_ACTIVATED].
        4. If too few nodes exist, return all of them (still within max cap).
        """
        all_nodes = {n.id: n for n in store.all_nodes()}
        all_edges = store.all_edges()

        if not all_nodes:
            return []

        # Build adjacency: node_id → list of (neighbor_id, strength)
        adj: dict[str, list[tuple[str, float]]] = {nid: [] for nid in all_nodes}
        for e in all_edges:
            if e.source in adj:
                adj[e.source].append((e.target, e.strength))
            if e.target in adj:
                adj[e.target].append((e.source, e.strength))

        activated: list[str] = []
        seen: set[str] = set()

        # Add seeds first (only those that actually exist)
        for nid in seed_node_ids:
            if nid in all_nodes and nid not in seen:
                activated.append(nid)
                seen.add(nid)

        # 1-hop expansion
        for seed in list(activated):
            if len(activated) >= _MAX_ACTIVATED:
                break
            for neighbor_id, strength in sorted(
                adj.get(seed, []), key=lambda x: -x[1]
            ):
                if len(activated) >= _MAX_ACTIVATED:
                    break
                if neighbor_id not in seen and strength >= _NEIGHBOR_THRESHOLD:
                    activated.append(neighbor_id)
                    seen.add(neighbor_id)

        # Pad to _MIN_ACTIVATED using highest-weight nodes not yet included
        if len(activated) < _MIN_ACTIVATED:
            ranked = sorted(
                all_nodes.values(), key=lambda n: n.weight, reverse=True
            )
            for node in ranked:
                if len(activated) >= _MIN_ACTIVATED:
                    break
                if node.id not in seen:
                    activated.append(node.id)
                    seen.add(node.id)

        return activated[:_MAX_ACTIVATED]


# ── Module-level singleton ────────────────────────────────────────────────────

_instance: GraphState | None = None


def get_graph_state() -> GraphState:
    global _instance
    if _instance is None:
        _instance = GraphState()
    return _instance


def reset() -> None:
    """Re-create the singleton (resets the Lock). Used in tests."""
    global _instance
    _instance = GraphState()
