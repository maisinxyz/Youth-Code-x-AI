"""
Backboard placeholder functions — all async, all await-able.
# BACKBOARD_PLACEHOLDER — entire module replaced by backboard.py in Phase 5 §21.
Every function signature here MUST match the real implementation exactly.
"""
import uuid


async def create_assistant(name: str) -> str:
    """Create a Backboard assistant for an org. Returns assistant_id."""
    # BACKBOARD_PLACEHOLDER
    return f"asst_stub_{uuid.uuid4().hex[:8]}"


async def upload_document_to_assistant(
    assistant_id: str,
    content: str,
    metadata: dict,
) -> dict:
    """Upload a document chunk. send_to_llm=False for bulk ingest."""
    # BACKBOARD_PLACEHOLDER
    return {"document_id": f"stub_{uuid.uuid4().hex[:8]}"}


async def create_thread(assistant_id: str) -> str:
    """Create a conversation thread for a user session."""
    # BACKBOARD_PLACEHOLDER
    return f"thread_stub_{uuid.uuid4().hex[:8]}"


async def query_assistant(
    assistant_id: str,
    thread_id: str,
    query: str,
    memory: str = "Auto",
) -> dict:
    """Send a query and get a response with sources."""
    # BACKBOARD_PLACEHOLDER
    return {
        "answer": f"[Stub answer for: {query[:60]}]",
        "sources": [],
        "thread_id": thread_id,
    }
