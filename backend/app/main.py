from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import graph, health, ingest, query

app = FastAPI(
    title="Engram API",
    description="Company institutional memory — semantic graph + voice query backend.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(query.router, tags=["query"])
app.include_router(ingest.router, tags=["ingest"])
app.include_router(graph.router, tags=["graph"])
