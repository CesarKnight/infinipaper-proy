from __future__ import annotations

import re
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol

from langchain_core.language_models import BaseChatModel

from infinipaper_agents.config import Settings
from infinipaper_agents.schemas import ExtractedDocument, SourceBlock, SourceRef, Usage


@dataclass
class ExtractionContext:
    settings: Settings
    model: BaseChatModel | None = None


class Extractor(Protocol):
    name: str
    version: str

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument: ...


def clean_text(value: object, limit: int = 2_000_000) -> str:
    if not isinstance(value, str):
        return ""
    value = value.replace("\x00", " ").replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"\n{4,}", "\n\n\n", value)
    return value.strip()[:limit]


def build_document(
    *,
    source: SourceRef,
    extractor: str,
    text: str,
    blocks: list[dict] | None = None,
    metadata: dict | None = None,
    warnings: list[str] | None = None,
    usage: Usage | None = None,
) -> ExtractedDocument:
    content = clean_text(text)
    return ExtractedDocument(
        source_id=source.resource_id,
        kind=source.kind,
        text=content,
        markdown=content,
        blocks=[SourceBlock.model_validate(block) for block in (blocks or [])],
        metadata={
            "name": source.name,
            "mimeType": source.mime_type,
            "size": source.size,
            "checksum": source.checksum,
            **(metadata or {}),
        },
        provenance=[
            {
                "resourceId": source.resource_id,
                "name": source.name,
                "kind": source.kind,
            }
        ],
        warnings=warnings or [],
        extractor=extractor,
        usage=usage or Usage(),
    )


def table_to_markdown(rows: Sequence[Sequence[object]], max_cols: int = 50) -> str:
    clean_rows: list[list[str]] = []
    for row in rows:
        cells = [str(cell).replace("\n", " ").replace("|", "\\|").strip() for cell in row]
        if any(cells):
            clean_rows.append(cells[:max_cols])
    if not clean_rows:
        return ""
    width = max(len(row) for row in clean_rows)
    padded = [row + [""] * (width - len(row)) for row in clean_rows]
    header = padded[0]
    separator = ["---"] * width
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(separator) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in padded[1:])
    return "\n".join(lines)
