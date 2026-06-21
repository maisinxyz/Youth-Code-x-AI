from fastapi import APIRouter

from app.models.schemas import QueryRequest, QueryResponse
from app.services.query import handle_query

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest) -> QueryResponse:
    # BACKBOARD_PLACEHOLDER — handle_query swapped for backboard.query_assistant in Phase 5 §21
    return await handle_query(req)
