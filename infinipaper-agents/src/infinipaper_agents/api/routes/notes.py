import logging

from fastapi import APIRouter, Depends, Request

from infinipaper_agents.auth import require_token
from infinipaper_agents.errors import AgentError, rate_limited_error
from infinipaper_agents.schemas import (
    OutlineSection,
    StructureRequest,
    StructureResponse,
    Usage,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/v1/notes/structure", response_model=StructureResponse)
async def structure_note(
    payload: StructureRequest,
    request: Request,
    _: None = Depends(require_token),
) -> StructureResponse:
    settings = request.app.state.settings
    graph = request.app.state.graph

    initial = {
        "job_id": payload.job_id,
        "sources": payload.sources,
        "context": payload.context,
        "retry_count": 0,
        "warnings": [],
    }

    try:
        final = await graph.ainvoke(initial)
    except AgentError:
        raise
    except Exception as exc:  # noqa: BLE001
        limited = rate_limited_error(exc)
        if limited is not None:
            logger.warning("Agent provider rate limited: %s", exc)
            raise limited from exc
        logger.exception("Agent graph failed")
        raise AgentError(
            "AGENT_PROVIDER_ERROR",
            "El proveedor del modelo falló durante la estructuración",
            502,
        ) from exc

    if final.get("error"):
        code = final["error"]
        message = final.get("error_message", "No se pudo estructurar el apunte")
        status = 415 if code == "UNSUPPORTED_SOURCE_TYPE" else 422
        raise AgentError(code, message, status)

    markdown = final.get("draft_markdown")
    if not markdown or not markdown.strip():
        raise AgentError(
            "AGENT_INVALID_OUTPUT",
            "El agente no devolvió contenido estructurado",
            502,
        )

    validation = final.get("validation")
    outline: list[OutlineSection] = final.get("outline", [])
    usage: Usage = final.get("usage") or Usage(
        model=settings.model_structurer or settings.model_name
    )

    return StructureResponse(
        markdown=markdown,
        outline=outline,
        warnings=final.get("warnings", []),
        coverage=validation.coverage if validation else 0.0,
        usage=usage,
        prompt_version=settings.prompt_version,
    )
