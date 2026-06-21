"""
Curated entity dictionary for the Meridian demo dataset.
Pre-hackathon: keyword matching. Post-hackathon: replaced by Backboard entity extraction.
"""

PEOPLE: list[str] = [
    "Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Hiro",
    "Isabelle", "James", "Karen", "Liam", "Maya", "Nathan", "Olivia",
    "Pedro", "Quinn", "Rachel", "Sam", "Tara", "Uma", "Victor", "Wendy",
    "Xander", "Yara", "Zoe",
    # Meridian-specific personas
    "Jordan", "Morgan", "Taylor", "Casey", "Riley", "Alex", "Drew",
    "Skyler", "Avery", "Blake",
]

TECH: list[str] = [
    # Databases
    "Postgres", "PostgreSQL", "MongoDB", "Redis", "MySQL", "SQLite",
    "DynamoDB", "Cassandra", "Elasticsearch", "Neo4j",
    # Languages
    "Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "Kotlin",
    "Swift", "C++", "Ruby",
    # Frameworks / libraries
    "FastAPI", "Django", "Flask", "React", "Vue", "Angular", "Next.js",
    "Vite", "Express", "Spring",
    # Infra / cloud
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "Ansible",
    "Nginx", "Kafka", "RabbitMQ", "Celery", "Airflow",
    # AI / ML
    "OpenAI", "Claude", "Backboard", "LangChain", "Pinecone", "Weaviate",
    "HuggingFace", "TensorFlow", "PyTorch", "scikit-learn",
    # Tooling
    "GitHub", "GitLab", "Jira", "Confluence", "Notion", "Slack", "Linear",
    "Sentry", "Datadog", "Grafana", "Prometheus",
    # Protocols / standards
    "REST", "GraphQL", "gRPC", "WebSockets", "OAuth", "JWT", "SAML",
    "ACID", "BASE",
]

PROJECTS: list[str] = [
    # Meridian internal project codenames
    "Atlas", "Phoenix", "Orion", "Meridian", "Horizon", "Titan",
    "Nexus", "Apex", "Zenith", "Nova", "Prism", "Vega",
    # Generic project types that appear in demos
    "API", "dashboard", "pipeline", "migration", "refactor", "integration",
    "v2", "platform", "infrastructure", "monorepo",
]

DECISION_KEYWORDS: list[str] = [
    "decided", "decision", "chose", "chosen", "selected", "agreed",
    "adopted", "approved", "rejected", "ruled out", "went with",
    "will use", "we use", "switched to", "migrated to", "replaced",
    "standardized on", "locked in",
]

OPEN_QUESTION_PATTERNS: list[str] = [
    "TBD", "TBC", "to be determined", "to be confirmed",
    "unclear", "undecided", "unknown", "?",
    "open question", "need to decide", "pending",
    "should we", "do we", "will we", "when will",
]
