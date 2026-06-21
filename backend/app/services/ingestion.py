"""
Ingestion pipeline: chunk → extract → classify → graph-update → store.
Pre-hackathon: keyword/regex entity extraction, rule-based classification.
Post-hackathon: Backboard handles embeddings and semantic retrieval.
"""
import re
import uuid
from datetime import datetime, timezone

from app.models.schemas import GraphEdge, GraphNode, IngestRequest, IngestResponse, NodeType
from app.services import backboard_stub, store
from app.services.graph_state import get_graph_state
from app.services.entity_dictionary import (
    DECISION_KEYWORDS,
    OPEN_QUESTION_PATTERNS,
    PEOPLE,
    PROJECTS,
    TECH,
)

# Pre-compute lowercase sets for fast membership checks
_PEOPLE_SET = {p.lower() for p in PEOPLE}
_TECH_SET = {t.lower() for t in TECH}
_PROJECTS_SET = {p.lower() for p in PROJECTS}


# ── chunk_text ────────────────────────────────────────────────────────────────

def chunk_text(
    content: str,
    max_tokens: int = 400,
    overlap: int = 50,
) -> list[str]:
    """
    Word-based chunker. 'max_tokens' treated as max words per chunk.
    Adjacent chunks share 'overlap' words to preserve context across boundaries.
    """
    if not content or not content.strip():
        return []
    words = content.split()
    if len(words) <= max_tokens:
        return [content]
    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(start + max_tokens, len(words))
        chunk_words = words[start:end]
        chunks.append(" ".join(chunk_words))
        if end == len(words):
            break
        start = end - overlap
    return chunks


# ── extract_entities ──────────────────────────────────────────────────────────

def extract_entities(chunk: str) -> dict[str, list[str]]:
    """
    Keyword/regex entity extractor over the curated Meridian dictionary.
    Returns {people, tech, projects, decisions, open_questions}.
    Pre-hackathon only — Backboard replaces this in §21.
    """
    result: dict[str, list[str]] = {
        "people": [],
        "tech": [],
        "projects": [],
        "decisions": [],
        "open_questions": [],
    }
    chunk_lower = chunk.lower()

    for name in PEOPLE:
        if re.search(r"\b" + re.escape(name) + r"\b", chunk, re.IGNORECASE):
            result["people"].append(name)

    for term in TECH:
        if re.search(r"\b" + re.escape(term) + r"\b", chunk, re.IGNORECASE):
            result["tech"].append(term)

    for project in PROJECTS:
        if re.search(r"\b" + re.escape(project) + r"\b", chunk, re.IGNORECASE):
            result["projects"].append(project)

    for kw in DECISION_KEYWORDS:
        if kw.lower() in chunk_lower:
            # Extract a short phrase around the keyword as the decision label
            idx = chunk_lower.index(kw.lower())
            snippet = chunk[max(0, idx - 20) : idx + 60].strip()
            snippet = re.sub(r"\s+", " ", snippet)
            if snippet and snippet not in result["decisions"]:
                result["decisions"].append(snippet)
            break  # one decision label per chunk

    for pattern in OPEN_QUESTION_PATTERNS:
        if re.search(r"\b" + re.escape(pattern) + r"\b", chunk, re.IGNORECASE):
            result["open_questions"].append(pattern)

    return result


# ── classify_node_type ────────────────────────────────────────────────────────

def classify_node_type(entity: str, context: str) -> NodeType:
    """
    Rule-based classifier:
    - Matches person list → PERSON
    - Matches tech list → TECH
    - Matches project list → PROJECT
    - Contains "?" or "TBD"/"TBC" → OPEN_QUESTION
    - Otherwise → DECISION (catch-all for labelled phrases)
    """
    entity_lower = entity.lower()

    if entity_lower in _PEOPLE_SET:
        return NodeType.PERSON
    if entity_lower in _TECH_SET:
        return NodeType.TECH
    if entity_lower in _PROJECTS_SET:
        return NodeType.PROJECT
    for oq in OPEN_QUESTION_PATTERNS:
        if oq.lower() in entity_lower:
            return NodeType.OPEN_QUESTION
    return NodeType.DECISION


# ── build_edges ───────────────────────────────────────────────────────────────

def build_edges(
    nodes_in_chunk: list[str],
    existing: list[GraphEdge],
) -> list[GraphEdge]:
    """
    Co-occurrence within a chunk = edge. Returns the full deduplicated edge list
    (existing + new), with strength incremented for existing pairs.
    """
    if len(nodes_in_chunk) < 2:
        return list(existing)

    # Build a mutable dict keyed by sorted (src, tgt) pair
    edge_map: dict[tuple[str, str], GraphEdge] = {}
    for e in existing:
        key = (min(e.source, e.target), max(e.source, e.target))
        edge_map[key] = GraphEdge(
            source=key[0],
            target=key[1],
            strength=e.strength,
            relationship_type=e.relationship_type,
        )

    for i, a in enumerate(nodes_in_chunk):
        for b in nodes_in_chunk[i + 1 :]:
            key = (min(a, b), max(a, b))
            if key in edge_map:
                edge_map[key].strength += 1.0
            else:
                edge_map[key] = GraphEdge(
                    source=key[0],
                    target=key[1],
                    strength=1.0,
                    relationship_type="co-mentioned",
                )

    return list(edge_map.values())


# ── process_ingest (orchestrator) ─────────────────────────────────────────────

async def process_ingest(req: IngestRequest) -> IngestResponse:
    """
    Full pipeline: chunk → extract → classify → graph-update → store → Backboard stub.
    # BACKBOARD_PLACEHOLDER — upload_document_to_assistant() wired in Phase 5 §21.
    """
    ingested_id = str(uuid.uuid4())
    nodes_created = 0
    edges_created = 0

    chunks = chunk_text(req.content)

    for chunk_idx, chunk in enumerate(chunks):
        entities = extract_entities(chunk)
        node_ids_in_chunk: list[str] = []

        # Flatten all entity categories into (label, node_type) pairs
        entity_pairs: list[tuple[str, NodeType]] = []
        for name in entities["people"]:
            entity_pairs.append((name, NodeType.PERSON))
        for term in entities["tech"]:
            entity_pairs.append((term, NodeType.TECH))
        for proj in entities["projects"]:
            entity_pairs.append((proj, NodeType.PROJECT))
        for dec in entities["decisions"]:
            entity_pairs.append((dec, NodeType.DECISION))
        for oq in entities["open_questions"]:
            entity_pairs.append((oq, NodeType.OPEN_QUESTION))

        for label, node_type in entity_pairs:
            node = GraphNode(
                id=str(uuid.uuid4()),
                label=label,
                type=node_type,
                connections=[],
                weight=0.1,
                last_active=datetime.now(timezone.utc),
                source_type=req.source_type,
            )
            upserted, was_created = store.upsert_node(node)
            if was_created:
                nodes_created += 1
            node_ids_in_chunk.append(upserted.id)

        # Build edges from co-occurrence in this chunk
        current_edges = store.all_edges()
        new_edge_list = build_edges(node_ids_in_chunk, current_edges)
        # Persist new/updated edges
        for edge in new_edge_list:
            _, was_created = store.upsert_edge(edge)
            if was_created:
                edges_created += 1

        store.add_chunk({
            "ingested_id": ingested_id,
            "chunk_index": chunk_idx,
            "source_type": req.source_type,
            "source_name": req.source_name,
            "author": req.author,
            "timestamp": req.timestamp.isoformat(),
            "text": chunk,
            "node_ids": node_ids_in_chunk,
        })

        # Mark nodes active on ingest so last_active reflects freshness
        await get_graph_state().mark_active(node_ids_in_chunk)

        # BACKBOARD_PLACEHOLDER — upload_document_to_assistant() wired in Phase 5 §21
        await backboard_stub.upload_document_to_assistant(
            assistant_id="stub_assistant",
            content=chunk,
            metadata={
                "ingested_id": ingested_id,
                "source_type": req.source_type,
                "source_name": req.source_name,
                "author": req.author,
                "chunk_index": chunk_idx,
            },
        )

    return IngestResponse(
        ingested_id=ingested_id,
        nodes_created=nodes_created,
        edges_created=edges_created,
        chunk_count=len(chunks),
    )
