"""
Demo safety net: hardcoded answers for Meridian's key demo questions.
normalize_query → dict lookup → QueryResponse | None.
# BACKBOARD_PLACEHOLDER — Backboard answers replace these in Phase 5 §21.
"""
import re
import uuid

from app.models.schemas import QueryResponse, Source
from app.services import store
from datetime import datetime, timezone

_DEMO_TS    = datetime(2024, 3,  1, 10, 0, 0, tzinfo=timezone.utc)
_Q1_TS      = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
_FEB_TS     = datetime(2024, 2, 14, 10, 0, 0, tzinfo=timezone.utc)
_STUB_SESSION = "demo-session-meridian"


def normalize_query(query: str) -> str:
    """Lowercase, strip apostrophes, replace remaining punctuation with spaces, collapse whitespace."""
    q = query.lower()
    # Strip apostrophes / smart quotes WITHOUT inserting a space, so "what's" → "whats"
    q = re.sub(r"[’‘'`]", "", q)
    q = re.sub(r"[^\w\s]", " ", q)
    q = re.sub(r"\s+", " ", q).strip()
    return q


# ── Canonical demo questions + answers ───────────────────────────────────────

_CANNED: dict[str, QueryResponse] = {

    "why did we choose postgres": QueryResponse(
        answer=(
            "We chose PostgreSQL over MongoDB for the Atlas transaction ledger in January 2024 "
            "because ACID compliance was non-negotiable for financial transactions. "
            "Alice led the two-week evaluation and the decision was unanimous — MongoDB's "
            "eventual consistency model was a dealbreaker for a ledger that cannot tolerate "
            "partial writes. The choice has proven correct: Atlas is running at 12,000 "
            "transactions per second in production with full ACID guarantees, and 18 of 20 "
            "enterprise customers interviewed by Blake cited Postgres ACID compliance as a "
            "primary reason they chose Meridian over MongoDB-backed competitors."
        ),
        sources=[
            Source(
                title="#engineering — Jan 15 thread",
                type="slack",
                excerpt=(
                    "We need to make a final call on the database for Atlas. I've been evaluating "
                    "Postgres vs MongoDB for the past two weeks. Given that Atlas is a transaction "
                    "ledger, ACID compliance is non-negotiable. MongoDB's eventual consistency model "
                    "is a dealbreaker. We're going with Postgres. Alice made this decision and it's locked in."
                ),
                timestamp=_Q1_TS,
                author="alice",
                source_id="canned-src-001a",
            ),
            Source(
                title="ADR-001: Postgres over MongoDB for Atlas",
                type="confluence",
                excerpt=(
                    "Decision: PostgreSQL was chosen. MongoDB was rejected. Rationale: Postgres "
                    "provides full ACID compliance. MongoDB's default eventual consistency model "
                    "is a dealbreaker for the Atlas transaction ledger — partial writes on financial "
                    "records cannot be tolerated. This decision is final."
                ),
                timestamp=_Q1_TS,
                author="alice",
                source_id="canned-src-001b",
            ),
            Source(
                title="Atlas Project Overview",
                type="notion",
                excerpt=(
                    "Atlas is Meridian's core transaction ledger service, built on Postgres for "
                    "ACID-compliant transaction processing. Alice is the project lead. The Atlas "
                    "Postgres database handles all financial transactions — this was a deliberate "
                    "decision over MongoDB, which was rejected for its eventual consistency model."
                ),
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-001c",
            ),
            Source(
                title="Meridian Series A Pitch Deck",
                type="drive",
                excerpt=(
                    "Our competitors use MongoDB for their transaction data — this has caused "
                    "publicized data consistency issues for their customers. Our Postgres-based "
                    "Atlas ledger with ACID compliance is our primary enterprise differentiator, "
                    "as validated by 18 of 20 customer interviews."
                ),
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-001d",
            ),
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "why postgres": QueryResponse(
        answer=(
            "Postgres was chosen for the Atlas transaction ledger for ACID compliance. "
            "MongoDB was evaluated and rejected by Alice in January 2024 — its eventual "
            "consistency model is incompatible with financial transaction guarantees. "
            "Postgres is handling 12k transactions per second in production."
        ),
        sources=[
            Source(
                title="#engineering — Jan 15 thread",
                type="slack",
                excerpt="Postgres for ACID compliance. MongoDB's eventual consistency was a dealbreaker for the Atlas ledger.",
                timestamp=_Q1_TS,
                author="alice",
                source_id="canned-src-001a",
            ),
            Source(
                title="ADR-001: Postgres over MongoDB for Atlas",
                type="confluence",
                excerpt="Postgres chosen for full ACID compliance. MongoDB rejected for eventual consistency.",
                timestamp=_Q1_TS,
                author="alice",
                source_id="canned-src-001b",
            ),
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "who owns the atlas project": QueryResponse(
        answer=(
            "Alice is the lead on the Atlas project and made all key architectural decisions, "
            "including choosing PostgreSQL over MongoDB for ACID compliance. Grace is Alice's "
            "senior backend engineer on Atlas, focusing on Postgres performance and scaling. "
            "Bob handles the Phoenix Kafka event stream integration that Atlas depends on. "
            "Frank owns the Titan Kubernetes infrastructure that Atlas runs on."
        ),
        sources=[
            Source(
                title="Atlas Project Overview",
                type="notion",
                excerpt="Alice is the project lead. Bob handles the Phoenix Kafka event stream integration. The Atlas Postgres database handles all financial transactions.",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-002a",
            ),
            Source(
                title="MER-001: Atlas Postgres connection pool tuning",
                type="jira",
                excerpt="Alice: We need to tune PgBouncer connection pool settings for Atlas production. Work with Frank to update the Kubernetes configmap.",
                timestamp=_Q1_TS,
                author="alice",
                source_id="canned-src-002b",
            ),
            Source(
                title="#general — Mar thread",
                type="slack",
                excerpt="Grace is joining as senior backend engineer this Monday, working with Alice on Atlas. She's a Postgres expert who has scaled ledger systems to millions of transactions per day.",
                timestamp=_DEMO_TS,
                author="eve",
                source_id="canned-src-002c",
            ),
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "what is the atlas project": QueryResponse(
        answer=(
            "Atlas is Meridian's core transaction ledger service, launched in Q1 2024. "
            "It is built on PostgreSQL for ACID-compliant transaction processing and handles "
            "12,000 transactions per second in production. The architecture includes a "
            "Postgres primary for writes, a read replica for Horizon and Prism reporting, "
            "Redis caching for hot reads, and Elasticsearch for full-text search. "
            "Alice leads Atlas. Bob's Phoenix Kafka pipeline handles all Atlas event streaming. "
            "The Q2 target is 50,000 TPS."
        ),
        sources=[
            Source(
                title="Atlas Project Overview",
                type="notion",
                excerpt="Atlas is Meridian's core transaction ledger service, launched in Q1 2024, built on Postgres for ACID-compliant transaction processing. Alice is the project lead.",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-002a",
            ),
            Source(
                title="Meridian Technical Specification — Atlas v1.0",
                type="drive",
                excerpt="Atlas v1.0: Postgres primary (writes), read replica (reporting), Redis cache, Elasticsearch search. 12k TPS. v2 target: 50k TPS.",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-003a",
            ),
            Source(
                title="ADR-001: Postgres over MongoDB for Atlas",
                type="confluence",
                excerpt="Postgres provides full ACID compliance. Atlas transaction ledger cannot tolerate MongoDB's eventual consistency.",
                timestamp=_Q1_TS,
                author="alice",
                source_id="canned-src-001b",
            ),
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "why did we choose kafka": QueryResponse(
        answer=(
            "Kafka was adopted for the Phoenix event streaming pipeline in February 2024 because "
            "RabbitMQ reached its throughput ceiling at 80,000 messages per second during the "
            "Q4 2023 load test. Bob led the migration. Kafka now handles 600,000 messages per "
            "second with 3 brokers in KRaft mode on the Titan Kubernetes cluster. Kafka's "
            "log-based storage also enables Orion's ML training pipeline to replay Atlas events, "
            "and Horizon uses Kafka WebSockets for real-time dashboard updates."
        ),
        sources=[
            Source(
                title="#engineering — Feb 14 thread",
                type="slack",
                excerpt=(
                    "For the Phoenix pipeline, we decided to move from RabbitMQ to Kafka. "
                    "During the Q4 load test, RabbitMQ topped out at 80k messages per second. "
                    "Kafka scales horizontally and we need at least 500k msg/s. Bob is leading the Phoenix migration."
                ),
                timestamp=_FEB_TS,
                author="bob",
                source_id="canned-src-004a",
            ),
            Source(
                title="ADR-002: Kafka over RabbitMQ for Phoenix",
                type="confluence",
                excerpt=(
                    "RabbitMQ hit its throughput ceiling at 80,000 messages per second. "
                    "Kafka scales horizontally — our cluster now handles 600,000 messages per second "
                    "with 3 brokers. Migration completed in February 2024."
                ),
                timestamp=_FEB_TS,
                author="bob",
                source_id="canned-src-004b",
            ),
            Source(
                title="MER-002: Phoenix Kafka migration",
                type="jira",
                excerpt="Full migration from RabbitMQ to Apache Kafka. RabbitMQ hit 80k msg/s ceiling. Kafka target: 600k msg/s with 3-broker cluster on Kubernetes. Topics: atlas-events (24 partitions), orion-predictions (12 partitions), horizon-notifications (6 partitions).",
                timestamp=_Q1_TS,
                author="bob",
                source_id="canned-src-004c",
            ),
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "what decisions were made in q1": QueryResponse(
        answer=(
            "In Q1 2024, Meridian made five foundational architectural decisions: "
            "(1) Postgres for Atlas — ACID compliance for the transaction ledger, led by Alice, rejecting MongoDB. "
            "(2) Kafka for Phoenix — migrated from RabbitMQ after hitting 80k msg/s ceiling, led by Bob, now at 600k msg/s. "
            "(3) TypeScript strict mode for Horizon — standardized after mixed JS/TypeScript caused production errors, led by Carol. "
            "(4) PyTorch for Orion — chosen over TensorFlow for dynamic computation graph and team expertise, led by Dave. "
            "(5) Kubernetes on GCP for Titan — migrated from AWS EC2 with Terraform IaC, led by Frank, saving 30% on compute."
        ),
        sources=[
            Source(
                title="Q1 2024 Architecture Decision Records",
                type="notion",
                excerpt="ADR-001: Postgres (ACID, Alice). ADR-002: Kafka over RabbitMQ (scale, Bob). ADR-003: TypeScript strict mode (maintainability, Carol). ADR-004: PyTorch over TensorFlow (ML, Dave). ADR-005: Kubernetes on GCP (ops, Frank).",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-005a",
            ),
            Source(
                title="Q1 2024 Engineering Decisions Summary",
                type="confluence",
                excerpt="Postgres for Atlas (ACID compliance). Kafka for Phoenix (scalability). TypeScript for Horizon (maintainability). PyTorch for Orion (ML accuracy). Kubernetes on GCP for Titan (operations). All five decisions ratified by Eve and the board.",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-005b",
            ),
            Source(
                title="#leadership — Q1 decisions thread",
                type="slack",
                excerpt="Q1 engineering decisions summary for the board: Postgres (Atlas, ACID, Alice), Kafka (Phoenix, scale, Bob), TypeScript (Horizon, maintainability, Carol), PyTorch (Orion, ML accuracy, Dave), Kubernetes on GCP (Titan, ops, Frank).",
                timestamp=_DEMO_TS,
                author="eve",
                source_id="canned-src-005c",
            ),
            Source(
                title="Engineering Leadership — Teams",
                type="teams",
                excerpt="Eve to leadership: we delivered Atlas on Postgres, Phoenix on Kafka, Horizon beta with TypeScript React, Orion alpha on PyTorch GCP, all infrastructure on Kubernetes with Terraform. Five major decisions executed flawlessly.",
                timestamp=_DEMO_TS,
                author="eve",
                source_id="canned-src-005d",
            ),
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

    "whats blocking v2": QueryResponse(
        answer=(
            "Three items are currently blocking the v2 launch: "
            "(1) Atlas scaling — Alice needs to get Atlas from 12k to 50k TPS via Postgres optimization, "
            "Elasticsearch integration, and connection pool tuning. Three additional engineers have been approved. "
            "(2) Orion accuracy — Dave's PyTorch model needs to reach 96%+ on production data (currently at 96%, on track). "
            "(3) Horizon v2 redesign — Carol and Skyler are 60% complete on the new TypeScript React dashboard. "
            "The pricing model is also pending Eve and Nathan's decision. Nathan needs a v2 date for the enterprise pipeline."
        ),
        sources=[
            Source(
                title="#product — v2 launch thread",
                type="slack",
                excerpt="The v2 launch is TBD. Key blockers in Jira: 1) Atlas scale to 50k TPS (Alice), 2) Orion prediction accuracy above 95% (Dave), 3) Horizon v2 redesign (Carol + Skyler). Nathan needs a v2 date for the enterprise pipeline.",
                timestamp=_DEMO_TS,
                author="eve",
                source_id="canned-src-006a",
            ),
            Source(
                title="#leadership — v2 planning thread",
                type="slack",
                excerpt="The biggest risk to v2 launch is the Atlas Postgres scaling work. Alice needs three additional engineers for the connection pooling, replication, and Elasticsearch integration. Approved.",
                timestamp=_DEMO_TS,
                author="alice",
                source_id="canned-src-006b",
            ),
            Source(
                title="MER-020: V2 pricing model — OPEN",
                type="jira",
                excerpt="The v2 pricing model needs to be decided before the enterprise sales push. Open question: seat-based vs usage-based vs hybrid. Decision owner: Eve. Deadline: end of Q2.",
                timestamp=_DEMO_TS,
                author="eve",
                source_id="canned-src-006c",
            ),
        ],
        activated_nodes=[],
        session_id=_STUB_SESSION,
    ),

}


# ── Per-question semantic activation map ─────────────────────────────────────
# Each canonical query maps to a list of node LABELS to light up on the brain
# visual. Labels are resolved against the live store at request time, so any
# label that didn't survive ingest is silently dropped (the response still
# pads to _MIN_ACTIVATED via top-weight nodes).
_CANNED_NODE_LABELS: dict[str, list[str]] = {
    "why did we choose postgres": [
        "Postgres", "PostgreSQL", "MongoDB", "Atlas", "Alice", "ACID",
        "Blake", "Meridian",
    ],
    "why postgres": [
        "Postgres", "PostgreSQL", "MongoDB", "Atlas", "Alice", "ACID",
    ],
    "who owns the atlas project": [
        "Alice", "Atlas", "Grace", "Bob", "Frank", "Phoenix", "Kafka",
        "Postgres", "PostgreSQL",
    ],
    "what is the atlas project": [
        "Atlas", "Postgres", "PostgreSQL", "Phoenix", "Kafka", "Alice",
        "Bob", "Redis", "Elasticsearch",
    ],
    "why did we choose kafka": [
        "Kafka", "RabbitMQ", "Phoenix", "Bob", "Kubernetes", "Titan",
        "Atlas",
    ],
    "what decisions were made in q1": [
        "Postgres", "PostgreSQL", "Kafka", "TypeScript", "PyTorch",
        "Kubernetes", "Atlas", "Phoenix", "Horizon", "Orion", "Titan",
        "Alice", "Bob", "Carol", "Dave", "Frank",
    ],
    "whats blocking v2": [
        "v2", "Atlas", "Postgres", "PostgreSQL", "Orion", "Horizon",
        "Alice", "Dave", "Carol", "Skyler", "Eve", "Nathan",
        "Elasticsearch", "PyTorch",
    ],
}

_MIN_ACTIVATED = 4
_MAX_ACTIVATED = 12


# Alias map: alternate phrasings → canonical key
_ALIASES: dict[str, str] = {
    # Postgres
    "why did we pick postgres":          "why did we choose postgres",
    "why did we use postgres":           "why did we choose postgres",
    "why postgres over mongodb":         "why did we choose postgres",
    "postgres decision":                 "why did we choose postgres",
    "why not mongodb":                   "why did we choose postgres",
    "mongodb vs postgres":               "why did we choose postgres",
    "postgres vs mongodb":               "why did we choose postgres",
    "why did we reject mongodb":         "why did we choose postgres",

    # Atlas ownership
    "who leads atlas":                   "who owns the atlas project",
    "atlas project owner":               "who owns the atlas project",
    "atlas owner":                       "who owns the atlas project",
    "who is responsible for atlas":      "who owns the atlas project",

    # Atlas overview
    "what is atlas":                     "what is the atlas project",
    "atlas overview":                    "what is the atlas project",
    "tell me about atlas":               "what is the atlas project",

    # Kafka
    "kafka decision":                    "why did we choose kafka",
    "why kafka":                         "why did we choose kafka",
    "why did we use kafka":              "why did we choose kafka",
    "kafka over rabbitmq":               "why did we choose kafka",
    "why not rabbitmq":                  "why did we choose kafka",
    "rabbitmq vs kafka":                 "why did we choose kafka",

    # Q1 decisions
    "q1 decisions":                      "what decisions were made in q1",
    "decisions q1":                      "what decisions were made in q1",
    "q1 2024 decisions":                 "what decisions were made in q1",
    "what did we decide in q1":          "what decisions were made in q1",
    "q1 architecture decisions":         "what decisions were made in q1",
    "five decisions":                    "what decisions were made in q1",

    # v2 blockers
    "v2 blockers":                       "whats blocking v2",
    "what is blocking v2":               "whats blocking v2",
    "v2 launch blockers":                "whats blocking v2",
    "why is v2 delayed":                 "whats blocking v2",
    "v2 status":                         "whats blocking v2",
}


def _resolve_activated_nodes(canonical_key: str) -> list[str]:
    """
    Translate the per-question label hints into concrete node IDs from the
    live store. Pads with top-weight nodes so the brain always lights up at
    least _MIN_ACTIVATED, capped at _MAX_ACTIVATED.
    """
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

    # Pad with top-weight nodes if we under-resolved
    if len(ids) < _MIN_ACTIVATED:
        ranked = sorted(store.all_nodes(), key=lambda n: n.weight, reverse=True)
        for node in ranked:
            if len(ids) >= _MIN_ACTIVATED:
                break
            if node.id not in seen:
                ids.append(node.id)
                seen.add(node.id)

    return ids


def get_canned_answer(query: str, session_id: str | None = None) -> QueryResponse | None:
    """
    Return a canned QueryResponse if query normalizes to a known demo question.
    session_id is injected so the caller's session is preserved.
    activated_nodes are resolved live against the store via label hints, so the
    correct meridian nodes light up on the brain visual.
    """
    norm = normalize_query(query)

    # Try exact key (with alias fallthrough)
    canonical = _ALIASES.get(norm, norm)
    template = _CANNED.get(canonical)

    # Try prefix / containment match if exact not found
    if template is None:
        for canned_key in _CANNED:
            if canned_key in norm or norm in canned_key:
                template = _CANNED[canned_key]
                canonical = canned_key
                break

    if template is None:
        return None

    return QueryResponse(
        answer=template.answer,
        sources=template.sources,
        activated_nodes=_resolve_activated_nodes(canonical),
        session_id=session_id or _STUB_SESSION,
    )
