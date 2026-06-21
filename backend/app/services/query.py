"""
Query handler: canned answer → keyword fallback → structured QueryResponse.
# === BACKBOARD SWAP POINT (Phase 5, §21) ===
Replace the keyword scoring block with backboard_stub.query_assistant().
"""
import uuid
from datetime import datetime, timezone

from app.models.schemas import QueryRequest, QueryResponse, Source
from app.services import store
from app.services.canned_answers import get_canned_answer, normalize_query
from app.services.graph_state import get_graph_state

# Common English stopwords to ignore during keyword scoring
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
    """Lowercase words, strip non-alpha, remove stopwords."""
    import re
    words = re.sub(r"[^\w\s]", " ", text.lower()).split()
    return [w for w in words if w not in _STOPWORDS and len(w) > 1]


def _score_chunk(chunk_text: str, query_tokens: list[str]) -> float:
    """TF-style overlap: count unique query tokens present in chunk."""
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
    1. Try canned answer (demo safety net).
    2. Keyword-score all stored chunks, take top-K.
    3. Derive sources + activated_nodes from top chunks.
    4. Build answer string from template.

    # === BACKBOARD SWAP POINT (Phase 5, §21) ===
    Replace step 2–4 with:
        result = await backboard.query_assistant(
            assistant_id=org.backboard_assistant_id,
            thread_id=session_thread_id,
            query=req.query,
            memory="Auto",
        )
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            activated_nodes=...,
            session_id=session_id,
        )
    """
    session_id = req.session_id or str(uuid.uuid4())

    # ── 1. Canned answer check ────────────────────────────────────────────────
    canned = get_canned_answer(req.query, session_id=session_id)
    if canned is not None:
        # Enrich activated_nodes from live store if we have any
        if not canned.activated_nodes:
            all_nodes = store.all_nodes()
            canned = QueryResponse(
                answer=canned.answer,
                sources=canned.sources,
                activated_nodes=[n.id for n in all_nodes[:10]],
                session_id=session_id,
            )
        return canned

    # ── 2. Keyword scoring ────────────────────────────────────────────────────
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
        # No keyword overlap — return graceful fallback
        top_chunks = [chunks[0]] if chunks else []

    # ── 3. Build sources + seed node IDs from top chunks ─────────────────────
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

    # ── 4. Expand activated_nodes via GraphState (1-hop, 3-8 cap) ────────────
    gs = get_graph_state()
    activated_node_ids = gs.activated_for_query(req.query, seed_node_ids)
    await gs.mark_active(activated_node_ids)

    # ── 5. Generate answer ────────────────────────────────────────────────────
    connectors = list({s.type for s in sources})
    connector_str = ", ".join(connectors) if connectors else "unknown"
    excerpt = top_chunks[0].get("text", "")[:200] if top_chunks else ""
    answer = (
        f"Based on {len(sources)} source(s) from {connector_str}: {excerpt}"
        if sources else "No relevant content found for this query."
    )

    return QueryResponse(
        answer=answer,
        sources=sources,
        activated_nodes=activated_node_ids,
        session_id=session_id,
    )
