"""
Jira connector — reads data/meridian/jira/*.json (ticket arrays).
# === REAL OAUTH SWAP POINT ===
Replace _stub_authenticate with Atlassian OAuth2 3-legged flow.
Replace fetch() with Jira REST API issue search (JQL).
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from app.connectors.base import Connector
from app.models.schemas import IngestRequest

_FIXTURE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "meridian" / "jira"


class JiraConnector(Connector):
    name = "jira"

    async def authenticate(self, credentials: dict) -> bool:
        # === REAL OAUTH SWAP POINT ===
        # token = await atlassian_oauth.exchange(credentials["code"])
        # return bool(token)
        return True

    async def fetch(self) -> list[IngestRequest]:
        records: list[IngestRequest] = []
        for path in sorted(_FIXTURE_DIR.glob("*.json")):
            tickets = json.loads(path.read_text())
            for ticket in tickets:
                summary = ticket.get("summary", "")
                description = ticket.get("description", "").strip()
                content = f"{summary}\n\n{description}".strip()
                if not content:
                    continue
                ts_raw = ticket.get("created", "")
                try:
                    ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.now(timezone.utc)
                key = ticket.get("key", "")
                records.append(IngestRequest(
                    content=content,
                    source_type="jira",
                    source_name=f"{key}: {summary}",
                    timestamp=ts,
                    author=ticket.get("assignee", "unknown"),
                    metadata={
                        "key": key,
                        "status": ticket.get("status", ""),
                        "summary": summary,
                    },
                ))
        return records
