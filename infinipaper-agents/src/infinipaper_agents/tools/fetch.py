import hashlib

import httpx

from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef


async def fetch_bytes(source: SourceRef, max_bytes: int) -> bytes:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(source.url)
        response.raise_for_status()
        content = response.content

    if len(content) > max_bytes:
        raise AgentError(
            "SOURCE_TOO_LARGE",
            f"La fuente supera el límite de {max_bytes} bytes",
            422,
        )

    if source.checksum:
        digest = hashlib.sha256(content).hexdigest()
        if digest != source.checksum:
            raise AgentError(
                "SOURCE_CHANGED",
                "La fuente cambió mientras se procesaba",
                409,
            )
    return content


async def fetch_source(source: SourceRef, max_chars: int) -> ExtractedDocument:
    content = await fetch_bytes(source, max_bytes=max(55 * 1024 * 1024, max_chars * 8))
    text = content.decode("utf-8", errors="replace")
    if len(text) > max_chars:
        raise AgentError(
            "NOTE_TOO_LARGE",
            f"La fuente supera el límite de {max_chars} caracteres",
            422,
        )

    return ExtractedDocument(
        source_id=source.resource_id,
        kind=source.kind,
        text=text,
        markdown=text,
        metadata={
            "name": source.name,
            "mimeType": source.mime_type,
            "size": source.size,
            "checksum": source.checksum,
        },
        provenance=[
            {
                "resourceId": source.resource_id,
                "name": source.name,
                "kind": source.kind,
            }
        ],
    )
