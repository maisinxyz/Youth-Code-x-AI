"""
Demo safety net: hardcoded answers for Meridian's key demo questions.
normalize_query → dict lookup → QueryResponse | None.
# BACKBOARD_PLACEHOLDER — Backboard answers replace these in Phase 5 §21.
"""
import re
import uuid

from app.models.schemas import QueryResponse, Source
from datetime import datetime, timezone

_DEMO_TS = datetime(2024, 3, 1, 10, 0, 0, tzinfo=timezone.utc)

_STUB_SESSION = "demo-session-meridian"


def normalize_query(query: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    q = query.lower()
    q = re.sub(r"[^\w\s]", " ", q)
    q = re.sub(r"\s+", " ", q).strip()
    return q


# ── Canonical demo questions + answers ───────────────────────────────────────

_CANNED: dict[str, QueryResponse] = {
    "why did we choose postgres": QueryResponse(
        answer=(
            "We chose Postgres over MongoDB in Q1 2024 because we needed ACID "
            "compliance for the Atlas project's transaction ledger. Alice led the "
            "evaluation and the team agreed on Postgres after a week of benchmarking."
        ),
        sources=[
            Source(
                title="#engineering — Mar 1 thread",
                type="slack",
                excerpt=(
                    "We decided to use Postgres for ACID compliance. MongoDB's "
                    "eventual consistency was a dealbreaker for the Atlas ledger."
                ),
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-001",
            )
        ],
        activated_nodes=[],  # filled at call time from live store
        session_id=_STUB_SESSION,
    ),

    "why postgres": QueryResponse(
        answer=(
            "Postgres was chosen for ACID compliance, specifically for the Atlas "
            "project's transaction ledger. The decision was made by Alice in Q1 2024 "
            "after evaluating MongoDB and finding its eventual consistency unacceptable."
        ),
        sources=[
            Source(
                title="#engineering — Mar 1 thread",
                type="slack",
                excerpt="We decided Postgres over MongoDB for ACID compliance.",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-001",
            )
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "who owns the atlas project": QueryResponse(
        answer=(
            "Alice is the lead on the Atlas project. She made the key architectural "
            "decisions in Q1, including the Postgres adoption and the move to a "
            "microservices architecture. Bob handles the infrastructure side."
        ),
        sources=[
            Source(
                title="Atlas Project — Notion page",
                type="notion",
                excerpt="Alice: project lead. Bob: infra. Carol: product.",
                timestamp=_DEMO_TS,
                author="carol",
                source_id="canned-src-002",
            )
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "what is the atlas project": QueryResponse(
        answer=(
            "Atlas is Meridian's core data platform project, launched in Q1 2024. "
            "It unifies the company's transaction ledger, reporting pipeline, and "
            "real-time analytics into a single Postgres-backed service. Alice leads it."
        ),
        sources=[
            Source(
                title="Atlas Project — Notion page",
                type="notion",
                excerpt="Atlas: unified data platform. Postgres backend. Q1 2024 launch.",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-002",
            )
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "why did we choose kafka": QueryResponse(
        answer=(
            "Kafka was adopted for the Phoenix pipeline to handle high-throughput "
            "event streaming between microservices. The decision was made after "
            "RabbitMQ hit its throughput ceiling during the Q4 load test."
        ),
        sources=[
            Source(
                title="#infrastructure — Feb 14 thread",
                type="slack",
                excerpt=(
                    "RabbitMQ topped out at 80k msg/s. We're moving Phoenix to Kafka "
                    "for horizontal scalability."
                ),
                timestamp=_DEMO_TS,
                author="bob",
                source_id="canned-src-003",
            )
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "what decisions were made in q1": QueryResponse(
        answer=(
            "In Q1 2024 Meridian made three major decisions: (1) Adopt Postgres for "
            "the Atlas ledger — ACID compliance, led by Alice. (2) Move Phoenix to "
            "Kafka for event streaming — scalability, led by Bob. (3) Standardise on "
            "TypeScript across all frontend services — led by Carol."
        ),
        sources=[
            Source(
                title="#decisions — Q1 summary",
                type="confluence",
                excerpt="Q1 decisions: Postgres (Atlas), Kafka (Phoenix), TypeScript (frontend).",
                timestamp=_DEMO_TS,
                author="carol",
                source_id="canned-src-004",
            )
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),
}

# Alias map: alternate phrasings → canonical key
_ALIASES: dict[str, str] = {
    "why did we pick postgres": "why did we choose postgres",
    "why did we use postgres": "why did we choose postgres",
    "why postgres over mongodb": "why did we choose postgres",
    "postgres decision": "why did we choose postgres",
    "who leads atlas": "who owns the atlas project",
    "atlas project owner": "who owns the atlas project",
    "atlas owner": "who owns the atlas project",
    "what is atlas": "what is the atlas project",
    "kafka decision": "why did we choose kafka",
    "why kafka": "why did we choose kafka",
    "q1 decisions": "what decisions were made in q1",
    "decisions q1": "what decisions were made in q1",
}


def get_canned_answer(query: str, session_id: str | None = None) -> QueryResponse | None:
    """
    Return a canned QueryResponse if query normalizes to a known demo question.
    session_id is injected so the caller's session is preserved.
    """
    norm = normalize_query(query)
    key = _ALIASES.get(norm, norm)
    template = _CANNED.get(key)
    if template is None:
        return None
    return QueryResponse(
        answer=template.answer,
        sources=template.sources,
        activated_nodes=template.activated_nodes,
        session_id=session_id or _STUB_SESSION,
    )
