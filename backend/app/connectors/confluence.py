"""
Confluence connector — reads data/meridian/confluence/*.json (page objects).
# === REAL OAUTH SWAP POINT ===
Replace _stub_authenticate with Atlassian OAuth2 3-legged flow.
Replace fetch() with Confluence REST API space + page content queries.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from app.connectors.base import Connector
from app.models.schemas import IngestRequest

_FIXTURE_DIR = Path(__file__).parent.parent.parent / "data" / "meridian" / "confluence"


class ConfluenceConnector(Connector):
    name = "confluence"

    async def authenticate(self, credentials: dict) -> bool:
        # === REAL OAUTH SWAP POINT ===
        # token = await atlassian_oauth.exchange(credentials["code"])
        # return bool(token)
        return True

    async def fetch(self) -> list[IngestRequest]:
        records: list[IngestRequest] = []
        for path in sorted(_FIXTURE_DIR.glob("*.json")):
            pages = json.loads(path.read_text())
            for page in pages:
                body = page.get("body", "").strip()
                if not body:
                    continue
                ts_raw = page.get("created_at", "")
                try:
                    ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.now(timezone.utc)
                space = page.get("space", "")
                records.append(IngestRequest(
                    content=f"{page.get('title', '')}\n\n{body}",
                    source_type="confluence",
                    source_name=f"{space}/{page.get('title', 'Untitled')}",
                    timestamp=ts,
                    author=page.get("author", "unknown"),
                    metadata={"space": space, "title": page.get("title", "")},
                ))
        return records
