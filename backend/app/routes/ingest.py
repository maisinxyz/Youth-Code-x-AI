import uuid

from fastapi import APIRouter, HTTPException

from app.connectors.base import Connector
from app.connectors.confluence import ConfluenceConnector
from app.connectors.drive import DriveConnector
from app.connectors.jira import JiraConnector
from app.connectors.notion import NotionConnector
from app.connectors.slack import SlackConnector
from app.connectors.teams import TeamsConnector
from app.models.schemas import IngestRequest, IngestResponse
from app.services.ingestion import process_ingest

router = APIRouter()

_CONNECTORS: dict[str, type[Connector]] = {
    "slack": SlackConnector,
    "notion": NotionConnector,
    "drive": DriveConnector,
    "confluence": ConfluenceConnector,
    "jira": JiraConnector,
    "teams": TeamsConnector,
}


@router.post("/ingest", response_model=IngestResponse)
async def ingest(req: IngestRequest) -> IngestResponse:
    # BACKBOARD_PLACEHOLDER — upload_document_to_assistant() wired in Phase 5 §21
    return await process_ingest(req)


@router.post("/ingest/connector/{connector_name}", response_model=IngestResponse)
async def ingest_connector(connector_name: str) -> IngestResponse:
    cls = _CONNECTORS.get(connector_name)
    if cls is None:
        raise HTTPException(status_code=404, detail=f"Connector '{connector_name}' not found")
    connector = cls()
    records = await connector.fetch()
    total_nodes = 0
    total_edges = 0
    total_chunks = 0
    ingested_id = str(uuid.uuid4())
    for req in records:
        resp = await process_ingest(req)
        total_nodes += resp.nodes_created
        total_edges += resp.edges_created
        total_chunks += resp.chunk_count
    return IngestResponse(
        ingested_id=ingested_id,
        nodes_created=total_nodes,
        edges_created=total_edges,
        chunk_count=total_chunks,
    )
