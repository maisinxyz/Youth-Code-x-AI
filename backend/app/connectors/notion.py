"""
Notion connector — reads data/meridian/notion/*.json (page objects).
# === REAL OAUTH SWAP POINT ===
Replace _stub_authenticate with Notion integration token exchange.
Replace fetch() with Notion API database queries and page content reads.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from app.connectors.base import Connector
from app.models.schemas import IngestRequest

_FIXTURE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "meridian" / "notion"


class NotionConnector(Connector):
    name = "notion"

    async def authenticate(self, credentials: dict) -> bool:
        # === REAL OAUTH SWAP POINT ===
        # return bool(await notion_client.users.me(token=credentials["token"]))
        return True

    async def fetch(self) -> list[IngestRequest]:
        records: list[IngestRequest] = []
        for path in sorted(_FIXTURE_DIR.glob("*.json")):
            pages = json.loads(path.read_text())
            for page in pages:
                content = page.get("content", "").strip()
                if not content:
                    continue
                ts_raw = page.get("last_edited", "")
                try:
                    ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.now(timezone.utc)
                records.append(IngestRequest(
                    content=f"{page.get('title', '')}\n\n{content}",
                    source_type="notion",
                    source_name=page.get("title", "Untitled"),
                    timestamp=ts,
                    author=page.get("author", "unknown"),
                    metadata={"page_title": page.get("title", "")},
                ))
        return records
