"""
Slack connector — reads data/meridian/slack/*.json (channel message arrays).
# === REAL OAUTH SWAP POINT ===
Replace _stub_authenticate with real Slack Web API OAuth token exchange.
Replace fetch() fixture loading with Slack Web API conversations.history calls.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from app.connectors.base import Connector
from app.models.schemas import IngestRequest

_FIXTURE_DIR = Path(__file__).parent.parent.parent / "data" / "meridian" / "slack"


class SlackConnector(Connector):
    name = "slack"

    async def authenticate(self, credentials: dict) -> bool:
        # === REAL OAUTH SWAP POINT ===
        # token = await slack_web_api.oauth_v2_access(credentials["code"])
        # return bool(token.get("ok"))
        return True

    async def fetch(self) -> list[IngestRequest]:
        records: list[IngestRequest] = []
        for path in sorted(_FIXTURE_DIR.glob("*.json")):
            messages = json.loads(path.read_text())
            channel = path.stem  # filename without .json = channel name
            for msg in messages:
                text = msg.get("text", "").strip()
                if not text:
                    continue
                ts_raw = msg.get("ts", "0")
                try:
                    ts = datetime.fromtimestamp(float(ts_raw), tz=timezone.utc)
                except Exception:
                    ts = datetime.now(timezone.utc)
                records.append(IngestRequest(
                    content=text,
                    source_type="slack",
                    source_name=f"#{msg.get('channel', channel)}",
                    timestamp=ts,
                    author=msg.get("user", "unknown"),
                    metadata={"channel": msg.get("channel", channel), "ts": ts_raw},
                ))
        return records
