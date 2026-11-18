import httpx

from infinipaper_agents.config import Settings
from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.base import (
    ExtractionContext,
    build_document,
    clean_text,
)


async def transcribe_audio(
    data: bytes,
    filename: str,
    mime_type: str,
    settings: Settings,
) -> str:
    if not settings.asr_url:
        raise AgentError(
            "ASR_SERVICE_ERROR",
            "El servicio de transcripción no está configurado",
            502,
        )
    form = {
        "model": "whisper-1",
        "language": settings.asr_default_language,
        "response_format": "json",
    }
    headers = (
        {"Authorization": f"Bearer {settings.asr_api_key}"}
        if settings.asr_api_key
        else {}
    )
    try:
        async with httpx.AsyncClient(timeout=settings.asr_timeout_seconds) as client:
            response = await client.post(
                f"{settings.asr_url.rstrip('/')}/v1/audio/transcriptions",
                headers=headers,
                data=form,
                files={"file": (filename, data, mime_type)},
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        raise AgentError(
            "ASR_SERVICE_ERROR",
            "El servicio de transcripción no respondió correctamente",
            502,
        ) from exc
    except ValueError as exc:
        raise AgentError(
            "ASR_SERVICE_ERROR",
            "El servicio de transcripción devolvió una respuesta inválida",
            502,
        ) from exc

    text = payload.get("text") if isinstance(payload, dict) else None
    if not isinstance(text, str) or not text.strip():
        raise AgentError(
            "ASR_NO_SPEECH",
            "No se detectó voz en el audio",
            422,
        )
    return clean_text(text)


class AudioExtractor:
    name = "audio/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        text = await transcribe_audio(
            data,
            source.name,
            source.mime_type,
            context.settings,
        )
        return build_document(
            source=source,
            extractor=self.name,
            text=text,
            blocks=[
                {
                    "type": "transcript",
                    "locator": "audio",
                    "text": text[:2_000],
                }
            ],
            metadata={"format": "audio", "language": context.settings.asr_default_language},
        )
