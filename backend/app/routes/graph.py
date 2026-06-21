from fastapi import APIRouter

from app.models.schemas import GraphResponse
from app.services import store

router = APIRouter()


@router.get("/graph", response_model=GraphResponse)
async def get_graph() -> GraphResponse:
    all_nodes = store.all_nodes()
    all_edges = store.all_edges()

    from collections import defaultdict
    adj = defaultdict(list)
    for e in all_edges:
        adj[e.source].append(e)
        adj[e.target].append(e)

    filtered_edges = {}
    for node_id, node_edges in adj.items():
        node_edges.sort(key=lambda x: x.strength, reverse=True)
        for e in node_edges[:2]:
            key = tuple(sorted([e.source, e.target]))
            filtered_edges[key] = e

    return GraphResponse(nodes=all_nodes, edges=list(filtered_edges.values()))
