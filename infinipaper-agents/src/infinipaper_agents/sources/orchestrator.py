from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from langchain_core.language_models import BaseChatModel

from infinipaper_agents.config import Settings
from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef, Usage
from infinipaper_agents.sources.base import ExtractionContext, clean_text
from infinipaper_agents.sources.registry import get_extractor
from infinipaper_agents.tools.fetch import fetch_bytes


@dataclass
class OrchestrationResult:
    context_text: str
    used_source_ids: list[str]
    warnings: list[str] = field(default_factory=list)
    usage: Usage = field(default_factory=Usage)


def _merge_usage(current: Usage, extra: Usage) -> Usage:
    return Usage(
        model=extra.model or current.model,
        input_tokens=current.input_tokens + extra.input_tokens,
        output_tokens=current.output_tokens + extra.output_tokens,
    )


def _truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit]
    boundary = cut.rfind("\n\n")
    if boundary > limit // 2:
        cut = cut[:boundary]
    return cut.rstrip() + "\n\n[…contenido recortado por límite de contexto…]"


async def extract_one(
    source: SourceRef,
    settings: Settings,
    model: BaseChatModel | None,
) -> ExtractedDocument:
    if source.extraction:
        try:
            document = ExtractedDocument.model_validate(source.extraction)
        except Exception as exc:  # noqa: BLE001
            raise AgentError(
                "SOURCE_EXTRACTION_FAILED",
                "La extracción cacheada no es válida",
                422,
            ) from exc
        document = document.model_copy(
            update={
                "source_id": source.resource_id,
                "kind": source.kind,
                "metadata": {
                    **document.metadata,
                    "name": source.name,
                    "mimeType": source.mime_type,
                },
            }
        )
    else:
        data = await fetch_bytes(source, settings.max_source_bytes)
        extractor = get_extractor(source)
        document = await extractor.extract(
            source,
            data,
            ExtractionContext(settings=settings, model=model),
        )

    text = clean_text(document.markdown or document.text)
    if not text:
        raise AgentError(
            "SOURCE_EMPTY",
            f"La fuente {source.name} no contiene texto reconocible",
            422,
        )
    if len(text) > settings.max_extracted_chars:
        document = document.model_copy(
            update={
                "text": _truncate(text, settings.max_extracted_chars),
                "markdown": _truncate(text, settings.max_extracted_chars),
                "warnings": [
                    *document.warnings,
                    f"Se recortó la extracción a {settings.max_extracted_chars} caracteres",
                ],
            }
        )
    else:
        document = document.model_copy(update={"text": text, "markdown": text})
    if not document.metadata.get("name"):
        document = document.model_copy(
            update={"metadata": {**document.metadata, "name": source.name}}
        )
    return document


async def orchestrate_sources(
    sources: list[SourceRef],
    settings: Settings,
    model: BaseChatModel | None,
    max_chars: int | None = None,
) -> OrchestrationResult:
    if len(sources) > settings.max_sources:
        raise AgentError(
            "TOO_MANY_SOURCES",
            f"Se permiten como máximo {settings.max_sources} fuentes por generación",
            422,
        )
    total_bytes = sum(max(source.size, 0) for source in sources)
    if total_bytes > settings.max_total_source_bytes:
        raise AgentError(
            "SOURCE_TOO_LARGE",
            "El conjunto de fuentes supera el límite de tamaño",
            422,
        )

    warnings: list[str] = []
    unique: list[SourceRef] = []
    seen: dict[str, str] = {}
    for source in sources:
        key = source.checksum or f"{source.name}:{source.size}"
        if key in seen:
            warnings.append(
                f"Se omitió {source.name}: duplicado de otra fuente"
            )
            continue
        seen[key] = source.resource_id
        unique.append(source)

    semaphore = asyncio.Semaphore(max(settings.extraction_concurrency, 1))

    async def guarded(source: SourceRef) -> ExtractedDocument:
        async with semaphore:
            return await extract_one(source, settings, model)

    results = await asyncio.gather(
        *(guarded(source) for source in unique),
        return_exceptions=True,
    )

    documents: list[ExtractedDocument] = []
    usage = Usage()
    for source, result in zip(unique, results, strict=True):
        if isinstance(result, AgentError):
            if len(sources) == 1:
                raise result
            warnings.append(f"Se omitió {source.name}: {result.message}")
            continue
        if isinstance(result, BaseException):
            if len(sources) == 1:
                raise AgentError(
                    "SOURCE_EXTRACTION_FAILED",
                    f"No se pudo extraer {source.name}",
                    422,
                ) from result
            warnings.append(f"Se omitió {source.name}: error de extracción")
            continue
        documents.append(result)
        usage = _merge_usage(usage, result.usage)
        warnings.extend(f"{source.name}: {warning}" for warning in result.warnings)

    if not documents:
        raise AgentError(
            "EMPTY_SOURCE",
            "No hay fuentes con contenido utilizable",
            422,
        )

    budget = max_chars or settings.max_input_chars
    per_document = max(1_000, budget // max(len(documents), 1))
    context_parts: list[str] = []
    used_source_ids: list[str] = []
    for document in documents:
        body = document.markdown or document.text
        if len(body) > per_document:
            body = _truncate(body, per_document)
            warnings.append(
                f"Se recortó {document.metadata.get('name', document.source_id)} "
                "para respetar el presupuesto de contexto"
            )
        name = str(document.metadata.get("name") or document.source_id)
        used_source_ids.append(document.source_id)
        context_parts.append(
            f'## Fuente: {name} ({document.kind})\n'
            f'<source id="{document.source_id}" name="{name}" kind="{document.kind}">\n'
            f"{body}\n"
            "</source>"
        )

    context_text = "\n\n---\n\n".join(context_parts)
    if len(context_text) > budget:
        context_text = _truncate(context_text, budget)
        warnings.append("Se recortó el contexto total por límite de entrada")

    return OrchestrationResult(
        context_text=context_text,
        used_source_ids=used_source_ids,
        warnings=list(dict.fromkeys(warnings)),
        usage=usage,
    )
