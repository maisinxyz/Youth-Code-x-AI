"""
§5 acceptance tests: connector interface contract + route wiring.
All six connectors must implement the same abstract interface and load fixtures.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models.schemas import IngestRequest
from app.services import store as store_module

from app.connectors.slack import SlackConnector
from app.connectors.notion import NotionConnector
from app.connectors.drive import DriveConnector
from app.connectors.confluence import ConfluenceConnector
from app.connectors.jira import JiraConnector
from app.connectors.teams import TeamsConnector

TRANSPORT = ASGITransport(app=app)
BASE = "http://test"

ALL_CONNECTORS = [
    SlackConnector,
    NotionConnector,
    DriveConnector,
    ConfluenceConnector,
    JiraConnector,
    TeamsConnector,
]

CONNECTOR_NAMES = ["slack", "notion", "drive", "confluence", "jira", "teams"]


# ── Store reset fixture ───────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_store(tmp_path, monkeypatch):
    monkeypatch.setattr(store_module, "_STORE_PATH", tmp_path / "store.json")
    store_module.reset()
    yield
    store_module.reset()


# ── Interface contract (parametric) ───────────────────────────────────────────

@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
def test_connector_has_name_attribute(connector_cls):
    c = connector_cls()
    assert isinstance(c.name, str) and len(c.name) > 0


@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
def test_connector_has_fetch_method(connector_cls):
    c = connector_cls()
    assert callable(c.fetch)


@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
def test_connector_has_authenticate_method(connector_cls):
    c = connector_cls()
    assert callable(c.authenticate)


@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
async def test_connector_authenticate_returns_bool(connector_cls):
    c = connector_cls()
    result = await c.authenticate({})
    assert isinstance(result, bool)


@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
async def test_connector_fetch_returns_at_least_one_record(connector_cls):
    c = connector_cls()
    records = await c.fetch()
    assert len(records) >= 1, f"{connector_cls.__name__}.fetch() returned no records"


@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
async def test_connector_fetch_returns_ingest_requests(connector_cls):
    c = connector_cls()
    records = await c.fetch()
    for r in records:
        assert isinstance(r, IngestRequest), \
            f"{connector_cls.__name__} yielded a non-IngestRequest object"


@pytest.mark.parametrize("connector_cls, expected_source_type", [
    (SlackConnector, "slack"),
    (NotionConnector, "notion"),
    (DriveConnector, "drive"),
    (ConfluenceConnector, "confluence"),
    (JiraConnector, "jira"),
    (TeamsConnector, "teams"),
])
async def test_connector_fetch_records_have_correct_source_type(connector_cls, expected_source_type):
    c = connector_cls()
    records = await c.fetch()
    for r in records:
        assert r.source_type == expected_source_type, \
            f"{connector_cls.__name__} returned wrong source_type: {r.source_type}"


@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
async def test_connector_fetch_records_have_non_empty_content(connector_cls):
    c = connector_cls()
    records = await c.fetch()
    for r in records:
        assert r.content.strip(), f"{connector_cls.__name__} returned empty content"


# ── OAuth swap-point discipline ───────────────────────────────────────────────

@pytest.mark.parametrize("connector_cls", ALL_CONNECTORS)
def test_connector_source_contains_oauth_swap_comment(connector_cls):
    """Each connector module must contain the real OAuth swap-point marker."""
    import inspect
    src = inspect.getsource(connector_cls)
    assert "REAL OAUTH SWAP POINT" in src, \
        f"{connector_cls.__name__} is missing the # === REAL OAUTH SWAP POINT === marker"


# ── Route wiring: POST /ingest/connector/{name} ───────────────────────────────

@pytest.mark.parametrize("name", CONNECTOR_NAMES)
async def test_ingest_connector_route_returns_200(name):
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post(f"/ingest/connector/{name}")
    assert r.status_code == 200


@pytest.mark.parametrize("name", CONNECTOR_NAMES)
async def test_ingest_connector_route_returns_ingest_response_schema(name):
    from app.models.schemas import IngestResponse
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        r = await c.post(f"/ingest/connector/{name}")
    body = r.json()
    parsed = IngestResponse.model_validate(body)
    assert parsed.chunk_count >= 1


async def test_ingest_connector_slack_populates_graph_with_ten_nodes():
    async with AsyncClient(transport=TRANSPORT, base_url=BASE) as c:
        await c.post("/ingest/connector/slack")
    nodes = store_module.all_nodes()
    assert len(nodes) >= 10, \
        f"Expected ≥10 nodes after Slack ingest, got {len(nodes)}"
