"""
Conversational demo answers for Meridian's 6 key questions.

Flow per question:
  1. User asks → short punchy answer (2-3 sentences)
  2. User asks "where was that?" / "show me the source" → surfaces references
  3. User says "thanks" / "cool" → casual acknowledgment
"""
import re
import uuid
from datetime import datetime, timezone

from app.models.schemas import QueryResponse, Source
from app.services import store

_DEMO_TS = datetime(2024, 3,  1, 10, 0, 0, tzinfo=timezone.utc)
_Q1_TS   = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
_FEB_TS  = datetime(2024, 2, 14, 10, 0, 0, tzinfo=timezone.utc)
_STUB    = "demo-session-meridian"

# ── Session context ───────────────────────────────────────────────────────────
# Tracks the last canonical question per session so follow-ups resolve correctly
_session_context: dict[str, str] = {}  # session_id → last canonical key


def _set_context(session_id: str, canonical_key: str) -> None:
    _session_context[session_id] = canonical_key


def _get_context(session_id: str) -> str | None:
    return _session_context.get(session_id)


# ── Normalisation ─────────────────────────────────────────────────────────────

def normalize_query(query: str) -> str:
    q = query.lower()
    q = re.sub(r"['''`]", "", q)
    q = re.sub(r"[^\w\s]", " ", q)
    q = re.sub(r"\s+", " ", q).strip()
    return q


# ── Short answers (first hit) ─────────────────────────────────────────────────

_SHORT: dict[str, str] = {
    "why did we choose postgres": (
        "We went with Postgres for Atlas because ACID compliance was non-negotiable "
        "for a transaction ledger. Alice made the final call in January 2024 — "
        "MongoDB's eventual consistency was a hard no for financial data."
    ),
    "why postgres": (
        "Postgres, because ACID compliance. Atlas is a transaction ledger — "
        "MongoDB's eventual consistency model was a dealbreaker. Alice locked it in January 2024."
    ),
    "who owns the atlas project": (
        "Alice leads Atlas end-to-end and made all the key architecture calls. "
        "Grace is her senior backend engineer, Bob owns the Phoenix event pipeline "
        "that feeds Atlas, and Frank runs the Titan infrastructure underneath it."
    ),
    "what is the atlas project": (
        "Atlas is Meridian's core transaction ledger — Postgres, 12,000 TPS in production. "
        "Alice leads it. The Q2 target is 50k TPS."
    ),
    "why did we choose kafka": (
        "Kafka replaced RabbitMQ for Phoenix after RabbitMQ hit its ceiling at "
        "80k messages per second in the Q4 2023 load test. Bob led the migration — "
        "Kafka now handles 600k msg/s."
    ),
    "what decisions were made in q1": (
        "Five foundational decisions shipped in Q1 2024: Postgres for Atlas, "
        "Kafka for Phoenix, TypeScript strict mode for Horizon, PyTorch for Orion, "
        "and Kubernetes on GCP for Titan. Alice, Bob, Carol, Dave, and Frank each owned one."
    ),
    "whats blocking v2": (
        "Three things: Atlas needs to scale from 12k to 50k TPS, "
        "Orion accuracy needs to stay above 96% on production data, "
        "and Carol's Horizon redesign is 60% done. Pricing model is still TBD."
    ),
}

# ── Follow-up answers (sourced detail) ───────────────────────────────────────

_FOLLOW_UP_TEXT: dict[str, str] = {
    "why did we choose postgres": (
        "Alice posted it in #engineering on January 15th — "
        "'MongoDB's eventual consistency is a dealbreaker for a transaction ledger. "
        "We're going with Postgres.' It's also formalized in Confluence ADR-001. "
        "Blake later validated the call: 18 of 20 enterprise customers cited "
        "ACID compliance as a purchase reason."
    ),
    "why postgres": (
        "Alice posted it in #engineering on January 15th — "
        "'MongoDB's eventual consistency is a dealbreaker. We're going with Postgres.' "
        "It's also in Confluence ADR-001."
    ),
    "who owns the atlas project": (
        "Alice's ownership is in the Atlas Project Overview in Notion. "
        "Jira ticket MER-001 shows her coordinating with Frank on the Kubernetes "
        "Postgres configmap. Eve announced Grace's hire in #general."
    ),
    "what is the atlas project": (
        "The overview lives in Notion — Alice authored it. "
        "The full technical spec — Postgres architecture, Redis caching, "
        "Elasticsearch search — is in Google Drive as the Atlas v1.0 Technical Specification."
    ),
    "why did we choose kafka": (
        "Bob flagged the RabbitMQ ceiling in #engineering on February 14th. "
        "It's formalized in Confluence ADR-002. The full migration — "
        "24 partitions for atlas-events, 12 for orion-predictions — "
        "is tracked in Jira under MER-002."
    ),
    "what decisions were made in q1": (
        "All five are in the Q1 2024 ADR doc in Notion and the Engineering Decisions "
        "Summary in Confluence. Eve also wrapped them up in a #leadership Slack post "
        "and a Teams message to the board: 'five major decisions executed flawlessly.'"
    ),
    "whats blocking v2": (
        "Eve called out the launch risk in the #product Slack thread. "
        "The Atlas scaling conversation is in #leadership. "
        "The pricing decision is Jira MER-020 — open, Eve as owner, Q2 deadline. "
        "Horizon progress is tracked by Carol and Skyler."
    ),
}

# ── Sources per question ──────────────────────────────────────────────────────

_SOURCES: dict[str, list[Source]] = {
    "why did we choose postgres": [
        Source(title="#engineering — Jan 15 thread", type="slack",
               excerpt="We need to make a final call on the database for Atlas. Postgres for ACID compliance. MongoDB's eventual consistency is a dealbreaker.",
               timestamp=_Q1_TS, author="alice", source_id="canned-src-001a"),
        Source(title="ADR-001: Postgres over MongoDB for Atlas", type="confluence",
               excerpt="Decision: PostgreSQL. Rationale: full ACID compliance. MongoDB rejected — eventual consistency incompatible with a financial transaction ledger.",
               timestamp=_Q1_TS, author="alice", source_id="canned-src-001b"),
        Source(title="Atlas Project Overview", type="notion",
               excerpt="Atlas is built on Postgres for ACID-compliant transaction processing. Alice is the project lead. MongoDB was rejected for its eventual consistency model.",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-001c"),
        Source(title="Meridian Series A Pitch Deck", type="drive",
               excerpt="18 of 20 enterprise customer interviews cited Postgres ACID compliance as a primary reason they chose Meridian over MongoDB-backed competitors.",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-001d"),
    ],
    "why postgres": [
        Source(title="#engineering — Jan 15 thread", type="slack",
               excerpt="Postgres for ACID compliance. MongoDB's eventual consistency was a dealbreaker for the Atlas ledger.",
               timestamp=_Q1_TS, author="alice", source_id="canned-src-001a"),
        Source(title="ADR-001: Postgres over MongoDB for Atlas", type="confluence",
               excerpt="Postgres chosen for full ACID compliance. MongoDB rejected for eventual consistency.",
               timestamp=_Q1_TS, author="alice", source_id="canned-src-001b"),
    ],
    "who owns the atlas project": [
        Source(title="Atlas Project Overview", type="notion",
               excerpt="Alice is the project lead. Bob handles the Phoenix Kafka event stream integration. Grace is senior backend engineer.",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-002a"),
        Source(title="MER-001: Atlas Postgres connection pool tuning", type="jira",
               excerpt="Alice: We need to tune PgBouncer for Atlas production. Work with Frank to update the Kubernetes configmap.",
               timestamp=_Q1_TS, author="alice", source_id="canned-src-002b"),
        Source(title="#general — Mar thread", type="slack",
               excerpt="Grace is joining as senior backend engineer working with Alice on Atlas. She's a Postgres expert who has scaled ledger systems to millions of TPS.",
               timestamp=_DEMO_TS, author="eve", source_id="canned-src-002c"),
    ],
    "what is the atlas project": [
        Source(title="Atlas Project Overview", type="notion",
               excerpt="Atlas is Meridian's core transaction ledger, launched in Q1 2024, built on Postgres for ACID-compliant transaction processing. Alice is the project lead.",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-002a"),
        Source(title="Meridian Technical Specification — Atlas v1.0", type="drive",
               excerpt="Atlas v1.0: Postgres primary (writes), read replica (reporting), Redis cache, Elasticsearch search. 12k TPS. v2 target: 50k TPS.",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-003a"),
        Source(title="ADR-001: Postgres over MongoDB for Atlas", type="confluence",
               excerpt="Postgres provides full ACID compliance. Atlas transaction ledger cannot tolerate MongoDB's eventual consistency.",
               timestamp=_Q1_TS, author="alice", source_id="canned-src-001b"),
    ],
    "why did we choose kafka": [
        Source(title="#engineering — Feb 14 thread", type="slack",
               excerpt="For Phoenix, we're moving from RabbitMQ to Kafka. RabbitMQ topped out at 80k msg/s in the Q4 load test. Kafka scales to 600k. Bob is leading.",
               timestamp=_FEB_TS, author="bob", source_id="canned-src-004a"),
        Source(title="ADR-002: Kafka over RabbitMQ for Phoenix", type="confluence",
               excerpt="RabbitMQ hit its ceiling at 80,000 msg/s. Kafka cluster now handles 600,000 msg/s with 3 brokers. Migration completed February 2024.",
               timestamp=_FEB_TS, author="bob", source_id="canned-src-004b"),
        Source(title="MER-002: Phoenix Kafka migration", type="jira",
               excerpt="Full migration from RabbitMQ to Kafka. Topics: atlas-events (24 partitions), orion-predictions (12 partitions), horizon-notifications (6 partitions).",
               timestamp=_Q1_TS, author="bob", source_id="canned-src-004c"),
    ],
    "what decisions were made in q1": [
        Source(title="Q1 2024 Architecture Decision Records", type="notion",
               excerpt="ADR-001: Postgres (Alice). ADR-002: Kafka (Bob). ADR-003: TypeScript strict (Carol). ADR-004: PyTorch (Dave). ADR-005: Kubernetes GCP (Frank).",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-005a"),
        Source(title="Q1 2024 Engineering Decisions Summary", type="confluence",
               excerpt="Five decisions ratified by Eve: Postgres, Kafka, TypeScript strict mode, PyTorch, Kubernetes on GCP.",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-005b"),
        Source(title="#leadership — Q1 decisions thread", type="slack",
               excerpt="Q1 decisions: Postgres (Alice), Kafka (Bob), TypeScript (Carol), PyTorch (Dave), Kubernetes GCP (Frank).",
               timestamp=_DEMO_TS, author="eve", source_id="canned-src-005c"),
        Source(title="Engineering Leadership — Teams", type="teams",
               excerpt="Five major decisions executed flawlessly: Atlas on Postgres, Phoenix on Kafka, Horizon with TypeScript React, Orion on PyTorch, infra on Kubernetes with Terraform.",
               timestamp=_DEMO_TS, author="eve", source_id="canned-src-005d"),
    ],
    "whats blocking v2": [
        Source(title="#product — v2 launch thread", type="slack",
               excerpt="Key blockers: 1) Atlas scale to 50k TPS (Alice), 2) Orion accuracy above 95% (Dave), 3) Horizon v2 redesign (Carol + Skyler). Nathan needs a v2 date.",
               timestamp=_DEMO_TS, author="eve", source_id="canned-src-006a"),
        Source(title="#leadership — v2 planning thread", type="slack",
               excerpt="Biggest risk: Atlas Postgres scaling. Alice needs 3 additional engineers for connection pooling, replication, and Elasticsearch integration. Approved.",
               timestamp=_DEMO_TS, author="alice", source_id="canned-src-006b"),
        Source(title="MER-020: V2 pricing model — OPEN", type="jira",
               excerpt="Pricing model TBD before enterprise sales push. Seat-based vs usage-based vs hybrid. Decision owner: Eve. Deadline: end of Q2.",
               timestamp=_DEMO_TS, author="eve", source_id="canned-src-006c"),
    ],
}

# ── Node label hints per question ─────────────────────────────────────────────

_CANNED_NODE_LABELS: dict[str, list[str]] = {
    "why did we choose postgres": ["Postgres", "PostgreSQL", "MongoDB", "Atlas", "Alice", "ACID", "Blake", "Meridian"],
    "why postgres":               ["Postgres", "PostgreSQL", "MongoDB", "Atlas", "Alice", "ACID"],
    "who owns the atlas project":  ["Alice", "Atlas", "Grace", "Bob", "Frank", "Phoenix", "Kafka", "Postgres", "PostgreSQL"],
    "what is the atlas project":   ["Atlas", "Postgres", "PostgreSQL", "Phoenix", "Kafka", "Alice", "Bob", "Redis", "Elasticsearch"],
    "why did we choose kafka":     ["Kafka", "RabbitMQ", "Phoenix", "Bob", "Kubernetes", "Titan", "Atlas"],
    "what decisions were made in q1": [
        "Postgres", "PostgreSQL", "Kafka", "TypeScript", "PyTorch",
        "Kubernetes", "Atlas", "Phoenix", "Horizon", "Orion", "Titan",
        "Alice", "Bob", "Carol", "Dave", "Frank",
    ],
    "whats blocking v2": [
        "v2", "Atlas", "Postgres", "PostgreSQL", "Orion", "Horizon",
        "Alice", "Dave", "Carol", "Skyler", "Eve", "Nathan", "Elasticsearch", "PyTorch",
    ],
}

_MIN_ACTIVATED = 4
_MAX_ACTIVATED = 12

# ── Alias map ─────────────────────────────────────────────────────────────────

_ALIASES: dict[str, str] = {
    "why did we pick postgres":       "why did we choose postgres",
    "why did we use postgres":        "why did we choose postgres",
    "why postgres over mongodb":      "why did we choose postgres",
    "postgres decision":              "why did we choose postgres",
    "why not mongodb":                "why did we choose postgres",
    "mongodb vs postgres":            "why did we choose postgres",
    "postgres vs mongodb":            "why did we choose postgres",
    "why did we reject mongodb":      "why did we choose postgres",
    "who leads atlas":                "who owns the atlas project",
    "atlas project owner":            "who owns the atlas project",
    "atlas owner":                    "who owns the atlas project",
    "who is responsible for atlas":   "who owns the atlas project",
    "what is atlas":                  "what is the atlas project",
    "atlas overview":                 "what is the atlas project",
    "tell me about atlas":            "what is the atlas project",
    "kafka decision":                 "why did we choose kafka",
    "why kafka":                      "why did we choose kafka",
    "why did we use kafka":           "why did we choose kafka",
    "kafka over rabbitmq":            "why did we choose kafka",
    "why not rabbitmq":               "why did we choose kafka",
    "rabbitmq vs kafka":              "why did we choose kafka",
    "q1 decisions":                   "what decisions were made in q1",
    "decisions q1":                   "what decisions were made in q1",
    "q1 2024 decisions":              "what decisions were made in q1",
    "what did we decide in q1":       "what decisions were made in q1",
    "q1 architecture decisions":      "what decisions were made in q1",
    "five decisions":                 "what decisions were made in q1",
    "v2 blockers":                    "whats blocking v2",
    "what is blocking v2":            "whats blocking v2",
    "v2 launch blockers":             "whats blocking v2",
    "why is v2 delayed":              "whats blocking v2",
    "v2 status":                      "whats blocking v2",
}

# ── Follow-up detection ───────────────────────────────────────────────────────

_FOLLOW_UP_TOKENS = frozenset([
    "where", "when", "source", "reference", "show", "elaborate", "detail",
    "more", "which", "from", "cited", "mentioned", "documented", "recorded",
    "said", "know", "find", "look", "see", "come", "that", "get",
])

_FOLLOW_UP_PHRASES = [
    "where was that", "when was that", "where did that come from",
    "what's the source", "whats the source", "show me the source",
    "show me the reference", "where is that from", "where does that come from",
    "tell me more", "can you elaborate", "more detail", "more details",
    "which document", "which slack", "what document", "where was this",
    "what reference", "where was it", "when was it", "what's that from",
    "whats that from", "how do you know", "where did you get that",
    "can you show me", "show me where",
]


def is_follow_up(query: str) -> bool:
    norm = normalize_query(query)
    for phrase in _FOLLOW_UP_PHRASES:
        if phrase in norm:
            return True
    tokens = set(norm.split())
    # If the query is short (≤5 words) and contains follow-up tokens, treat as follow-up
    if len(tokens) <= 5 and tokens & _FOLLOW_UP_TOKENS:
        return True
    return False


# ── Gratitude detection ───────────────────────────────────────────────────────

_GRATITUDE_PHRASES = frozenset([
    "thanks", "thank you", "thankyou", "thx", "ty",
    "great thanks", "nice thanks", "cool thanks", "perfect thanks",
    "got it thanks", "got it", "cool", "great", "perfect",
    "awesome", "nice", "cheers", "appreciate it", "appreciated",
    "that helps", "helpful", "makes sense",
])


def is_gratitude(query: str) -> bool:
    norm = normalize_query(query)
    return norm in _GRATITUDE_PHRASES or any(norm.startswith(p) for p in _GRATITUDE_PHRASES)


# ── Node resolution ───────────────────────────────────────────────────────────

def _resolve_activated_nodes(canonical_key: str) -> list[str]:
    label_hints = _CANNED_NODE_LABELS.get(canonical_key, [])
    seen: set[str] = set()
    ids: list[str] = []

    for label in label_hints:
        if len(ids) >= _MAX_ACTIVATED:
            break
        node = store.get_node_by_label(label)
        if node is not None and node.id not in seen:
            ids.append(node.id)
            seen.add(node.id)

    if len(ids) < _MIN_ACTIVATED:
        ranked = sorted(store.all_nodes(), key=lambda n: n.weight, reverse=True)
        for node in ranked:
            if len(ids) >= _MIN_ACTIVATED:
                break
            if node.id not in seen:
                ids.append(node.id)
                seen.add(node.id)

    return ids


# ── Public API ────────────────────────────────────────────────────────────────

def get_canned_answer(query: str, session_id: str | None = None) -> QueryResponse | None:
    """Return a SHORT canned answer if the query matches a demo question."""
    norm = normalize_query(query)
    canonical = _ALIASES.get(norm, norm)
    short = _SHORT.get(canonical)

    if short is None:
        for key in _SHORT:
            if key in norm or norm in key:
                canonical = key
                short = _SHORT[key]
                break

    if short is None:
        return None

    sid = session_id or _STUB
    _set_context(sid, canonical)

    return QueryResponse(
        answer=short,
        sources=_SOURCES.get(canonical, []),
        activated_nodes=_resolve_activated_nodes(canonical),
        session_id=sid,
    )


def get_follow_up_answer(session_id: str) -> QueryResponse | None:
    """
    Return the sourced follow-up answer for the session's last canonical question.
    """
    canonical = _get_context(session_id)
    if canonical is None:
        return None

    follow_text = _FOLLOW_UP_TEXT.get(canonical)
    if follow_text is None:
        return None

    return QueryResponse(
        answer=follow_text,
        sources=_SOURCES.get(canonical, []),
        activated_nodes=_resolve_activated_nodes(canonical),
        session_id=session_id,
    )


def get_gratitude_response(session_id: str) -> QueryResponse | None:
    """Return a casual acknowledgment. Only responds if there's session context."""
    canonical = _get_context(session_id)
    if canonical is None:
        return None  # Don't respond to "thanks" with no prior context

    return QueryResponse(
        answer="Happy to help. What else would you like to know?",
        sources=[],
        activated_nodes=[],
        session_id=session_id,
    )
