"""Count how many records each connector produces and measure ingestion time."""
import asyncio, sys, time
sys.path.insert(0, ".")

async def main():
    from app.connectors.slack import SlackConnector
    from app.connectors.notion import NotionConnector
    from app.connectors.drive import DriveConnector
    from app.connectors.confluence import ConfluenceConnector
    from app.connectors.jira import JiraConnector
    from app.connectors.teams import TeamsConnector
    from app.services.ingestion import process_ingest
    from app.services import store

    connectors = [
        SlackConnector(), NotionConnector(), DriveConnector(),
        ConfluenceConnector(), JiraConnector(), TeamsConnector(),
    ]

    total_records = 0
    for conn in connectors:
        records = await conn.fetch()
        print(f"{conn.name}: {len(records)} records")
        total_records += len(records)
    print(f"\nTOTAL: {total_records} records to ingest")

    # Now time how long FULL ingestion takes
    store.reset()
    t0 = time.perf_counter()
    save_count = [0]
    orig_save = store._save
    def counting_save():
        save_count[0] += 1
        orig_save()
    store._save = counting_save

    total_ingested = 0
    for conn in connectors:
        records = await conn.fetch()
        for rec in records:
            await process_ingest(rec)
            total_ingested += 1
            if total_ingested % 50 == 0:
                elapsed = time.perf_counter() - t0
                print(f"  ...ingested {total_ingested}/{total_records} ({elapsed:.1f}s, {save_count[0]} disk writes)")

    elapsed = time.perf_counter() - t0
    print(f"\nDone in {elapsed:.1f}s")
    print(f"Total disk writes (_save calls): {save_count[0]}")
    print(f"Nodes: {len(store.all_nodes())}, Edges: {len(store.all_edges())}, Chunks: {len(store.all_chunks())}")

asyncio.run(main())
