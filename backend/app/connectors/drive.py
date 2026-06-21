"""
Google Drive connector — reads data/meridian/drive/*.json (PDF metadata + extracted text).
# === REAL OAUTH SWAP POINT ===
Replace _stub_authenticate with Google OAuth2 flow.
Replace fetch() with Drive API file listing + pypdf text extraction.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from app.connectors.base import Connector
from app.models.schemas import IngestRequest

_FIXTURE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "meridian" / "drive"


class DriveConnector(Connector):
    name = "drive"

    async def authenticate(self, credentials: dict) -> bool:
        # === REAL OAUTH SWAP POINT ===
        # creds = google.oauth2.credentials.Credentials(credentials["token"])
        # return creds.valid
        return True

    async def fetch(self) -> list[IngestRequest]:
        records: list[IngestRequest] = []
        for path in sorted(_FIXTURE_DIR.glob("*.json")):
            docs = json.loads(path.read_text())
            for doc in docs:
                text = doc.get("extracted_text", "").strip()
                if not text:
                    continue
                ts_raw = doc.get("modified_at", "")
                try:
                    ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.now(timezone.utc)
                records.append(IngestRequest(
                    content=f"{doc.get('title', '')}\n\n{text}",
                    source_type="drive",
                    source_name=doc.get("title", "Untitled"),
                    timestamp=ts,
                    author=doc.get("author", "unknown"),
                    metadata={"doc_title": doc.get("title", "")},
                ))
        return records
