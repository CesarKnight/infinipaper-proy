import logging

from fastapi import APIRouter, Depends, Request

from infinipaper_agents.auth import require_token
from infinipaper_agents.errors import AgentError, rate_limited_error
from infinipaper_agents.schemas import ExtractRequest, ExtractResponse
from infinipaper_agents.sources.orchestrator import extract_one

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/v1/sources/extract", response_model=ExtractResponse)
async def extract_source(
    payload: ExtractRequest,
    request: Request,
    _: None = Depends(require_token),
) -> ExtractResponse:
    settings = request.app.state.settings
    model = request.app.state.model
    try:
        document = await extract_one(payload.source, settings, model)
    except AgentError:
        raise
    except Exception as exc:  # noqa: BLE001
        limited = rate_limited_error(exc)
        if limited is not None:
            logger.warning("Agent provider rate limited: %s", exc)
            raise limited from exc
        logger.exception("Source extraction failed")
        raise AgentError(
            "SOURCE_EXTRACTION_FAILED",
            "No se pudo extraer la fuente",
            502,
        ) from exc
    return ExtractResponse(
        document=document,
        warnings=document.warnings,
        usage=document.usage,
        prompt_version=f"source-extraction/{settings.extraction_version}",
    )
