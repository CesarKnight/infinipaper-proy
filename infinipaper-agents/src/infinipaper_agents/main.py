from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from infinipaper_agents.api.routes.notes import router as notes_router
from infinipaper_agents.config import get_settings
from infinipaper_agents.errors import AgentError
from infinipaper_agents.graph.builder import build_graph
from infinipaper_agents.model import create_model
from infinipaper_agents.observability import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings)
    app.state.settings = settings
    app.state.graph = build_graph(settings, create_model(settings))
    yield


app = FastAPI(
    title="Infinipaper Agents",
    description="Servicio de estructuración de apuntes con LangGraph",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(notes_router)


@app.exception_handler(AgentError)
async def agent_error_handler(
    request: Request, exc: AgentError
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message},
    )


@app.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "infinipaper-agents",
        "promptVersion": settings.prompt_version,
    }
