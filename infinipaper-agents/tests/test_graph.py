import json

import pytest
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from infinipaper_agents.config import Settings
from infinipaper_agents.graph.builder import build_graph
from infinipaper_agents.schemas import (
    Context,
    ExtractedDocument,
    SourceKind,
    SourceRef,
)

ORIGINAL = (
    "# Tema\n\n"
    "La fotosíntesis convierte la luz solar en energía química.\n"
    "https://example.com/fuente\n\n"
    "```python\nprint('hola')\n```\n\n"
    "Conceptos: clorofila, glucosa, oxígeno."
)

CANDIDATE = (
    "# Tema\n\n"
    "## Resumen\n"
    "La fotosíntesis convierte la luz solar en energía química.\n\n"
    "## Conceptos clave\n"
    "- clorofila\n- glucosa\n- oxígeno\n\n"
    "## Referencias\n"
    "https://example.com/fuente\n\n"
    "```python\nprint('hola')\n```\n"
)

OUTLINE = {
    "sections": [
        {"heading": "Resumen", "level": 2},
        {"heading": "Conceptos clave", "level": 2},
        {"heading": "Desarrollo", "level": 2},
        {"heading": "Preguntas de repaso", "level": 2},
    ]
}

STRUCTURED = {"markdown": CANDIDATE, "warnings": []}


def _settings() -> Settings:
    return Settings.model_validate(
        {
            "AGENT_SERVICE_TOKEN": "test-token",
            "MODEL_NAME": "fake",
            "AGENT_MAX_INPUT_CHARS": 120_000,
            "AGENT_MAX_RETRIES": 1,
        }
    )


def _source(kind: SourceKind = "markdown") -> SourceRef:
    return SourceRef(
        resource_id="res-1",
        kind=kind,
        name="tema.md",
        mime_type="text/markdown",
        size=len(ORIGINAL),
        checksum=None,
        url="http://example.invalid/tema.md",
    )


async def _fake_fetcher(source: SourceRef) -> ExtractedDocument:
    return ExtractedDocument(
        source_id=source.resource_id,
        kind=source.kind,
        text=ORIGINAL,
    )


@pytest.mark.asyncio
async def test_graph_structures_markdown() -> None:
    model = FakeListChatModel(
        responses=[json.dumps(OUTLINE), json.dumps(STRUCTURED)]
    )
    graph = build_graph(_settings(), model, fetcher=_fake_fetcher)
    final = await graph.ainvoke(
        {
            "job_id": "job-1",
            "sources": [_source()],
            "context": Context(
                project_id="proj-1",
                folder_id="folder-1",
                language="es",
            ),
            "retry_count": 0,
            "warnings": [],
        }
    )

    assert final.get("draft_markdown") == CANDIDATE
    validation = final.get("validation")
    assert validation is not None
    assert validation.valid is True
    assert len(final.get("outline", [])) == 4
    usage = final.get("usage")
    assert usage is not None
    assert usage.input_tokens >= 0


@pytest.mark.asyncio
async def test_graph_rejects_unsupported_source() -> None:
    model = FakeListChatModel(responses=[])
    graph = build_graph(_settings(), model, fetcher=_fake_fetcher)
    final = await graph.ainvoke(
        {
            "job_id": "job-2",
            "sources": [_source("pdf")],
            "context": Context(project_id="p", folder_id="f"),
            "retry_count": 0,
            "warnings": [],
        }
    )
    assert final.get("error") == "UNSUPPORTED_SOURCE_TYPE"
