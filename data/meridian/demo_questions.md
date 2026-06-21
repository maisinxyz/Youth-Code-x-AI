# Meridian Demo Questions

Five canonical demo questions for the Engram demo flow.
Each answer cites ≥3 sources from ≥2 connectors and activates ≥4 graph nodes.

---

## Q1 — Why did we choose Postgres over Mongo?

**Canonical phrasings:**
- "Why did we choose Postgres over Mongo?"
- "Why did we pick Postgres?"
- "Why not MongoDB?"
- "Postgres vs MongoDB decision"

**Expected answer:**
We chose PostgreSQL over MongoDB for the Atlas transaction ledger in January 2024 because ACID compliance was non-negotiable for financial transactions. Alice led the two-week evaluation and the decision was unanimous — MongoDB's eventual consistency model was a dealbreaker for a ledger that cannot tolerate partial writes. Atlas is running at 12,000 transactions per second with full ACID guarantees. 18 of 20 enterprise customers cited Postgres ACID compliance as a reason they chose Meridian over MongoDB-backed competitors.

**Sources cited (≥3, ≥2 connectors):**
1. #engineering Slack — Jan 15 thread (Alice: "MongoDB's eventual consistency was a dealbreaker")
2. ADR-001 Confluence — "Postgres provides full ACID compliance. MongoDB rejected."
3. Atlas Project Overview Notion — "Atlas built on Postgres for ACID-compliant transaction processing"
4. Meridian Series A Pitch Deck Drive — "Postgres ACID compliance is our primary enterprise differentiator"

**Activated nodes:** Alice (PERSON), Postgres (TECH), MongoDB (TECH), Atlas (PROJECT), ACID (TECH)

---

## Q2 — Who owns the Atlas project?

**Canonical phrasings:**
- "Who owns the Atlas project?"
- "Who leads Atlas?"
- "Atlas project owner?"

**Expected answer:**
Alice is the lead on the Atlas project and made all key architectural decisions, including choosing PostgreSQL over MongoDB. Grace is her senior backend engineer focused on Postgres performance. Bob handles Phoenix Kafka integration. Frank owns the Titan Kubernetes infrastructure.

**Sources cited:**
1. Atlas Project Overview Notion
2. MER-001 Jira ticket (assignee: alice)
3. #general Slack (Grace hire announcement)

**Activated nodes:** Alice (PERSON), Grace (PERSON), Bob (PERSON), Frank (PERSON), Atlas (PROJECT), Postgres (TECH)

---

## Q3 — Why did we choose Kafka?

**Canonical phrasings:**
- "Why did we choose Kafka?"
- "Why not RabbitMQ?"
- "Kafka over RabbitMQ decision"

**Expected answer:**
Kafka was adopted for the Phoenix event streaming pipeline in February 2024 because RabbitMQ reached its throughput ceiling at 80,000 messages per second during the Q4 2023 load test. Bob led the migration. Kafka now handles 600,000 messages per second with 3 brokers on the Titan Kubernetes cluster.

**Sources cited:**
1. #engineering Slack — Feb 14 thread (Bob: "RabbitMQ topped out at 80k msg/s")
2. ADR-002 Confluence — "RabbitMQ ceiling 80k msg/s. Kafka handles 600k msg/s."
3. MER-002 Jira — "Full migration from RabbitMQ to Apache Kafka"

**Activated nodes:** Bob (PERSON), Kafka (TECH), RabbitMQ (TECH), Phoenix (PROJECT), Titan (PROJECT)

---

## Q4 — What decisions were made in Q1?

**Canonical phrasings:**
- "What decisions were made in Q1?"
- "Q1 2024 decisions"
- "What did we decide in Q1?"

**Expected answer:**
Five foundational decisions in Q1 2024: (1) Postgres for Atlas (ACID, Alice), (2) Kafka for Phoenix (scale, Bob), (3) TypeScript for Horizon (maintainability, Carol), (4) PyTorch for Orion (ML, Dave), (5) Kubernetes on GCP for Titan (operations, Frank).

**Sources cited:**
1. Q1 Architecture Decision Records Notion
2. Q1 Engineering Decisions Summary Confluence
3. #leadership Slack — Q1 decisions summary
4. Teams Engineering Leadership — Eve's Q1 wrap

**Activated nodes:** Alice, Bob, Carol, Dave, Frank (PERSON × 5), Postgres, Kafka, TypeScript, PyTorch, Kubernetes (TECH × 5), Atlas, Phoenix, Orion, Horizon, Titan (PROJECT × 5)

---

## Q5 — What's blocking the v2 launch?

**Canonical phrasings:**
- "What's blocking v2?"
- "V2 launch blockers?"
- "Why is v2 delayed?"

**Expected answer:**
Three blockers: (1) Atlas scaling — Alice needs to reach 50k TPS via Postgres optimization and Elasticsearch integration. (2) Horizon v2 redesign — Carol and Skyler are 60% complete on the TypeScript React dashboard. (3) v2 pricing model — Eve and Nathan have not yet decided seat-based vs usage-based. Nathan needs a date for the enterprise pipeline.

**Sources cited:**
1. #product Slack — v2 launch thread
2. #leadership Slack — v2 planning
3. MER-020 Jira — "V2 pricing model — OPEN"

**Activated nodes:** Alice (PERSON), Carol (PERSON), Eve (PERSON), Nathan (PERSON), Atlas (PROJECT), Horizon (PROJECT), Postgres (TECH), TypeScript (TECH)
