from fastapi import APIRouter

from app.models.schemas import GraphResponse
from app.services import store

router = APIRouter()


@router.get("/graph", response_model=GraphResponse)
async def get_graph() -> GraphResponse:
    # GraphState singleton wired in §6.
    return GraphResponse(nodes=store.all_nodes(), edges=store.all_edges())
