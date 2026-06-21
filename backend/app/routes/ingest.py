import uuid

from fastapi import APIRouter

from app.models.schemas import IngestRequest, IngestResponse
from app.services.ingestion import process_ingest

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest(req: IngestRequest) -> IngestResponse:
    # BACKBOARD_PLACEHOLDER — upload_document_to_assistant() wired in Phase 5 §21
    return await process_ingest(req)


@router.post("/ingest/connector/{connector_name}", response_model=IngestResponse)
async def ingest_connector(connector_name: str) -> IngestResponse:
    # Connector fetch-and-ingest loop lands in §5.
    return IngestResponse(
        ingested_id=str(uuid.uuid4()),
        nodes_created=0,
        edges_created=0,
        chunk_count=0,
    )
