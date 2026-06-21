"""
Query handler: canned answer → keyword fallback → structured QueryResponse.
"""
import uuid
from datetime import datetime, timezone

from app.models.schemas import QueryRequest, QueryResponse, Source
from app.services import store
from app.services.canned_answers import (
    get_canned_answer,
    get_follow_up_answer,
    get_gratitude_response,
    is_follow_up,
    is_gratitude,
)
from app.services.graph_state import get_graph_state

_STOPWORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "was", "are", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "this", "that", "these",
    "those", "i", "we", "you", "he", "she", "it", "they", "our", "your",
    "their", "what", "which", "who", "how", "why", "when", "where",
    "did", "not", "no", "so", "if", "as", "from", "up", "about",
    "into", "over", "after",
})

_TOP_K = 5


def _tokenize(text: str) -> list[str]:
    import re
    words = re.sub(r"[^\w\s]", " ", text.lower()).split()
    return [w for w in words if w not in _STOPWORDS and len(w) > 1]


def _score_chunk(chunk_text: str, query_tokens: list[str]) -> float:
    chunk_words = set(_tokenize(chunk_text))
    return sum(1.0 for t in query_tokens if t in chunk_words)


def _build_source_from_chunk(chunk: dict) -> Source:
    ts_raw = chunk.get("timestamp", "")
    try:
        ts = datetime.fromisoformat(ts_raw)
    except Exception:
        ts = datetime.now(timezone.utc)
    return Source(
        title=f"{chunk.get('source_name', 'unknown')} — {ts.strftime('%b %d')} thread",
        type=chunk.get("source_type", "unknown"),
        excerpt=chunk.get("text", "")[:300],
        timestamp=ts,
        author=chunk.get("author", "unknown"),
        source_id=f"{chunk.get('ingested_id', '')}_{chunk.get('chunk_index', 0)}",
    )


async def handle_query(req: QueryRequest) -> QueryResponse:
    """
    1. Gratitude check  — "thanks", "great", etc.
    2. Follow-up check  — "where was that?", "what's the source?" etc.
    3. Canned answer    — short punchy answer for the 6 demo questions.
    4. Keyword fallback — scored chunk retrieval.
    """
    session_id = req.session_id or str(uuid.uuid4())

    # ── 1. Gratitude ─────────────────────────────────────────────────────────
    if is_gratitude(req.query):
        resp = get_gratitude_response(session_id)
        if resp is not None:
            return resp

    # ── 2. Follow-up ─────────────────────────────────────────────────────────
    if is_follow_up(req.query):
        resp = get_follow_up_answer(session_id)
        if resp is not None:
            if resp.activated_nodes:
                await get_graph_state().mark_active(resp.activated_nodes)
            return resp

    # ── 3. Canned answer ─────────────────────────────────────────────────────
    canned = get_canned_answer(req.query, session_id=session_id)
    if canned is not None:
        if canned.activated_nodes:
            await get_graph_state().mark_active(canned.activated_nodes)
        return canned

    # ── 4. Keyword scoring ───────────────────────────────────────────────────
    chunks = store.all_chunks()
    if not chunks:
        return QueryResponse(
            answer=(
                "No data has been ingested yet. Connect a source to start building "
                "your organisation's memory."
            ),
            sources=[],
            activated_nodes=[],
            session_id=session_id,
        )

    query_tokens = _tokenize(req.query)
    scored = [
        (chunk, _score_chunk(chunk.get("text", ""), query_tokens))
        for chunk in chunks
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    top_chunks = [c for c, score in scored[:_TOP_K] if score > 0]

    if not top_chunks:
        return QueryResponse(
            answer="I don't have anything on that yet. Try asking about Atlas, Kafka, or the Q1 decisions.",
            sources=[],
            activated_nodes=[],
            session_id=session_id,
        )

    sources: list[Source] = []
    seed_node_ids: list[str] = []
    seen_source_ids: set[str] = set()

    for chunk in top_chunks:
        src = _build_source_from_chunk(chunk)
        if src.source_id not in seen_source_ids:
            sources.append(src)
            seen_source_ids.add(src.source_id)
        for nid in chunk.get("node_ids", []):
            if nid not in seed_node_ids:
                seed_node_ids.append(nid)

    gs = get_graph_state()
    activated_node_ids = gs.activated_for_query(req.query, seed_node_ids)
    await gs.mark_active(activated_node_ids)

    connectors = list({s.type for s in sources})
    connector_str = ", ".join(connectors) if connectors else "your sources"
    excerpt = top_chunks[0].get("text", "")[:200] if top_chunks else ""
    answer = f"Found {len(sources)} reference(s) in {connector_str}: {excerpt}"

    return QueryResponse(
        answer=answer,
        sources=sources,
        activated_nodes=activated_node_ids,
        session_id=session_id,
    )
