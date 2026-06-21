from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health

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

# Routes registered here — one import per PRD section as they land
app.include_router(health.router, tags=["health"])

# §2 routes (added in next section):
# app.include_router(query.router, tags=["query"])
# app.include_router(ingest.router, tags=["ingest"])
# app.include_router(graph.router, tags=["graph"])
