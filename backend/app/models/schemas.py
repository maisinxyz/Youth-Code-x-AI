from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class NodeType(str, Enum):
    DECISION = "decision"
    PERSON = "person"
    TECH = "tech"
    PROJECT = "project"
    OPEN_QUESTION = "open_question"


class GraphNode(BaseModel):
    id: str
    label: str
    type: NodeType
    connections: list[str] = Field(default_factory=list)
    weight: float = 0.0
    last_active: datetime | None = None
    source_type: str | None = None  # connector source: slack | notion | drive | ...


class GraphEdge(BaseModel):
    source: str  # node id
    target: str  # node id
    strength: float = 1.0
    relationship_type: str = "co-mentioned"


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class Source(BaseModel):
    title: str
    type: str                 # connector type: slack | notion | drive | ...
    excerpt: str              # full cited passage — never truncate
    timestamp: datetime
    author: str
    source_id: str            # internal id for drawer lookup


class IngestRequest(BaseModel):
    content: str
    source_type: Literal["slack", "notion", "drive", "confluence", "jira", "teams"]
    source_name: str          # e.g. "#engineering" or "Architecture ADR"
    timestamp: datetime
    author: str
    metadata: dict = Field(default_factory=dict)


class IngestResponse(BaseModel):
    ingested_id: str
    nodes_created: int
    edges_created: int
    chunk_count: int


class QueryRequest(BaseModel):
    query: str
    # Pre-§21: UUID generated server-side if absent.
    # Post-§21: maps 1:1 to a Backboard thread_id.
    session_id: str | None = None


class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]
    # Node ids that should light up on the Three.js graph. NEVER rename this field.
    activated_nodes: list[str]
    session_id: str           # echoed or freshly generated; reuse on follow-ups
