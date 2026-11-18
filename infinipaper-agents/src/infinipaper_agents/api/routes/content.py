import logging

from fastapi import APIRouter, Depends, Request

from infinipaper_agents.auth import require_token
from infinipaper_agents.errors import AgentError, rate_limited_error
from infinipaper_agents.graph.content import generate_mindmap, generate_quiz
from infinipaper_agents.schemas import (
    MindmapRequest,
    MindmapResponse,
    QuizGenerationRequest,
    QuizGenerationResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/v1/mindmaps/generate", response_model=MindmapResponse)
async def create_mindmap(
    payload: MindmapRequest,
    request: Request,
    _: None = Depends(require_token),
) -> MindmapResponse:
    settings = request.app.state.settings
    model = request.app.state.model
    try:
        mindmap, used_source_ids, warnings, usage = await generate_mindmap(
            model, settings, payload
        )
    except AgentError:
        raise
    except Exception as exc:  # noqa: BLE001
        limited = rate_limited_error(exc)
        if limited is not None:
            logger.warning("Agent provider rate limited: %s", exc)
            raise limited from exc
        logger.exception("Mindmap generation failed")
        raise AgentError(
            "AGENT_PROVIDER_ERROR",
            "El proveedor del modelo falló durante el mapa mental",
            502,
        ) from exc
    return MindmapResponse(
        mindmap=mindmap,
        used_source_ids=used_source_ids,
        warnings=warnings,
        usage=usage,
        prompt_version=settings.prompt_version,
    )


@router.post("/v1/quizzes/generate", response_model=QuizGenerationResponse)
async def create_quiz(
    payload: QuizGenerationRequest,
    request: Request,
    _: None = Depends(require_token),
) -> QuizGenerationResponse:
    settings = request.app.state.settings
    model = request.app.state.model
    try:
        quiz, used_source_ids, warnings, usage = await generate_quiz(
            model, settings, payload
        )
    except AgentError:
        raise
    except Exception as exc:  # noqa: BLE001
        limited = rate_limited_error(exc)
        if limited is not None:
            logger.warning("Agent provider rate limited: %s", exc)
            raise limited from exc
        logger.exception("Quiz generation failed")
        raise AgentError(
            "AGENT_PROVIDER_ERROR",
            "El proveedor del modelo falló durante el cuestionario",
            502,
        ) from exc
    return QuizGenerationResponse(
        quiz=quiz,
        used_source_ids=used_source_ids,
        warnings=warnings,
        usage=usage,
        prompt_version=settings.prompt_version,
    )
