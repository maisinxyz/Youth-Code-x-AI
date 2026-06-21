"""
Microsoft Teams connector — reads data/meridian/teams/*.json (channel messages).
# === REAL OAUTH SWAP POINT ===
Replace _stub_authenticate with Microsoft Graph API OAuth2 flow.
Replace fetch() with Graph API /teams/{id}/channels/{id}/messages calls.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from app.connectors.base import Connector
from app.models.schemas import IngestRequest

_FIXTURE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "meridian" / "teams"


class TeamsConnector(Connector):
    name = "teams"

    async def authenticate(self, credentials: dict) -> bool:
        # === REAL OAUTH SWAP POINT ===
        # token = await msal.ConfidentialClientApplication(...).acquire_token_by_auth_code_flow(...)
        # return bool(token.get("access_token"))
        return True

    async def fetch(self) -> list[IngestRequest]:
        records: list[IngestRequest] = []
        for path in sorted(_FIXTURE_DIR.glob("*.json")):
            messages = json.loads(path.read_text())
            for msg in messages:
                text = msg.get("text", "").strip()
                if not text:
                    continue
                ts_raw = msg.get("timestamp", "")
                try:
                    ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.now(timezone.utc)
                channel = msg.get("channel", "General")
                records.append(IngestRequest(
                    content=text,
                    source_type="teams",
                    source_name=f"Teams/{channel}",
                    timestamp=ts,
                    author=msg.get("user", "unknown"),
                    metadata={"channel": channel},
                ))
        return records
