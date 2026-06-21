"""Abstract connector interface — all connectors implement this."""
from abc import ABC, abstractmethod

from app.models.schemas import IngestRequest


class Connector(ABC):
    name: str

    @abstractmethod
    async def fetch(self) -> list[IngestRequest]:
        """Pull content from the source and return ingest-ready records."""
        ...

    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool:
        """Verify credentials. Stub returns True pre-hackathon."""
        ...
