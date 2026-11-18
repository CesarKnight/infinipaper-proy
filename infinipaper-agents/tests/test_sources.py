import io

import pymupdf
import pytest
from docx import Document
from openpyxl import Workbook
from PIL import Image
from pptx import Presentation

from infinipaper_agents.config import Settings
from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import SourceRef
from infinipaper_agents.sources import audio as audio_module
from infinipaper_agents.sources import image as image_module
from infinipaper_agents.sources import video as video_module
from infinipaper_agents.sources.audio import AudioExtractor
from infinipaper_agents.sources.base import ExtractionContext
from infinipaper_agents.sources.image import ImageExtractor
from infinipaper_agents.sources.markdown import MarkdownExtractor
from infinipaper_agents.sources.orchestrator import orchestrate_sources
from infinipaper_agents.sources.pdf import PdfExtractor
from infinipaper_agents.sources.registry import get_extractor
from infinipaper_agents.sources.slides import SlidesExtractor
from infinipaper_agents.sources.spreadsheet import SpreadsheetExtractor
from infinipaper_agents.sources.video import VideoExtractor
from infinipaper_agents.sources.word import WordExtractor


def source(
    name: str, kind: str, mime_type: str, checksum: str | None = None
) -> SourceRef:
    return SourceRef.model_validate(
        {
            "resourceId": f"r-{name}",
            "kind": kind,
            "name": name,
            "mimeType": mime_type,
            "size": 100,
            "checksum": checksum,
            "url": "http://example.invalid/file",
        }
    )


def settings() -> Settings:
    return Settings.model_validate(
        {
            "MODEL_PROVIDER": "openai-compatible",
            "MODEL_NAME": "test",
            "MODEL_API_KEY": "test",
            "AGENT_MAX_INPUT_CHARS": 120_000,
        }
    )


@pytest.mark.asyncio
async def test_markdown_extractor() -> None:
    doc = await MarkdownExtractor().extract(
        source("tema.md", "markdown", "text/markdown"),
        b"# Tema\n\nContenido del apunte",
        ExtractionContext(settings=settings()),
    )
    assert doc.markdown.startswith("# Tema")
    assert doc.blocks[0].type == "heading"
    assert doc.blocks[0].level == 1


@pytest.mark.asyncio
async def test_pdf_extractor() -> None:
    pdf = pymupdf.open()
    page = pdf.new_page()
    page.insert_text((72, 72), "Contenido del PDF de prueba")
    data = pdf.tobytes()
    doc = await PdfExtractor().extract(
        source("tema.pdf", "pdf", "application/pdf"),
        data,
        ExtractionContext(settings=settings()),
    )
    assert "Contenido del PDF" in doc.markdown
    assert doc.metadata["pages"] == 1


@pytest.mark.asyncio
async def test_word_extractor() -> None:
    document = Document()
    document.add_heading("Título", level=1)
    document.add_paragraph("Párrafo de prueba")
    table = document.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "A"
    table.cell(0, 1).text = "B"
    table.cell(1, 0).text = "1"
    table.cell(1, 1).text = "2"
    buffer = io.BytesIO()
    document.save(buffer)
    doc = await WordExtractor().extract(
        source(
            "tema.docx",
            "word",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
        buffer.getvalue(),
        ExtractionContext(settings=settings()),
    )
    assert "# Título" in doc.markdown
    assert "| A | B |" in doc.markdown
    assert doc.metadata["tables"] == 1


@pytest.mark.asyncio
async def test_spreadsheet_extractor_xlsx() -> None:
    workbook = Workbook()
    sheet = workbook.active
    assert sheet is not None
    sheet.title = "Notas"
    sheet.append(["Nombre", "Nota"])
    sheet.append(["Ana", 9])
    buffer = io.BytesIO()
    workbook.save(buffer)
    doc = await SpreadsheetExtractor().extract(
        source(
            "notas.xlsx",
            "spreadsheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ),
        buffer.getvalue(),
        ExtractionContext(settings=settings()),
    )
    assert "Hoja: Notas" in doc.markdown
    assert "Ana" in doc.markdown
    assert doc.metadata["sheets"] == 1


@pytest.mark.asyncio
async def test_spreadsheet_extractor_csv() -> None:
    doc = await SpreadsheetExtractor().extract(
        source("notas.csv", "spreadsheet", "text/csv"),
        b"Nombre,Nota\nAna,9\nLuis,7\n",
        ExtractionContext(settings=settings()),
    )
    assert "| Nombre | Nota |" in doc.markdown
    assert "Luis" in doc.markdown


@pytest.mark.asyncio
async def test_slides_extractor() -> None:
    presentation = Presentation()
    slide = presentation.slides.add_slide(presentation.slide_layouts[1])
    title = slide.shapes.title
    assert title is not None
    title.text = "Diapositiva"
    body = slide.placeholders[1]
    body.text_frame.text = "Idea principal"  # type: ignore[reportAttributeAccessIssue]
    buffer = io.BytesIO()
    presentation.save(buffer)
    doc = await SlidesExtractor().extract(
        source(
            "clase.pptx",
            "slides",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ),
        buffer.getvalue(),
        ExtractionContext(settings=settings()),
    )
    assert "Diapositiva" in doc.markdown
    assert "Idea principal" in doc.markdown
    assert doc.metadata["slides"] == 1


def test_registry_rejects_deferred_formats() -> None:
    with pytest.raises(AgentError) as exc:
        get_extractor(source("viejo.doc", "word", "application/msword"))
    assert exc.value.code == "UNSUPPORTED_SOURCE_TYPE"


@pytest.mark.asyncio
async def test_orchestrator_deduplicates_and_truncates() -> None:
    extraction = {
        "sourceId": "r-a",
        "kind": "markdown",
        "text": "# Tema\n\n" + ("contenido " * 30),
        "markdown": "# Tema\n\n" + ("contenido " * 30),
        "blocks": [],
        "metadata": {"name": "a.md"},
        "warnings": [],
        "extractor": "markdown/v1",
    }
    first = source("a.md", "markdown", "text/markdown", checksum="same")
    second = source("b.md", "markdown", "text/markdown", checksum="same")
    first.extraction = extraction
    second.extraction = extraction
    result = await orchestrate_sources(
        [first, second],
        settings(),
        None,
        max_chars=80,
    )
    assert result.used_source_ids == ["r-a.md"]
    assert any("duplicado" in warning for warning in result.warnings)
    assert any("recort" in warning for warning in result.warnings)


@pytest.mark.asyncio
async def test_image_extractor_uses_ocr(monkeypatch) -> None:
    image = Image.new("RGB", (400, 200), "white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    def fake_ocr(*args, **kwargs) -> str:
        return "La normalización evita la redundancia de datos."

    monkeypatch.setattr(image_module.pytesseract, "image_to_string", fake_ocr)
    doc = await ImageExtractor().extract(
        source("apunte.png", "image", "image/png"),
        buffer.getvalue(),
        ExtractionContext(settings=settings()),
    )
    assert "normalización" in doc.markdown
    assert doc.metadata["ocr"] is True


@pytest.mark.asyncio
async def test_audio_extractor_uses_asr(monkeypatch) -> None:
    async def fake_transcribe(*args, **kwargs) -> str:
        return "La clave foránea relaciona dos tablas."

    monkeypatch.setattr(audio_module, "transcribe_audio", fake_transcribe)
    doc = await AudioExtractor().extract(
        source("clase.mp3", "audio", "audio/mpeg"),
        b"fake-audio",
        ExtractionContext(settings=settings()),
    )
    assert "clave foránea" in doc.markdown


@pytest.mark.asyncio
async def test_video_extractor_uses_audio_transcript(monkeypatch) -> None:
    async def fake_transcribe(*args, **kwargs) -> str:
        return "En esta clase explicamos los índices de una base de datos."

    monkeypatch.setattr(video_module, "transcribe_audio", fake_transcribe)
    monkeypatch.setattr(video_module, "_extract_audio", lambda *args, **kwargs: b"wav")
    doc = await VideoExtractor().extract(
        source("clase.mp4", "video", "video/mp4"),
        b"fake-video",
        ExtractionContext(settings=settings()),
    )
    assert "índices" in doc.markdown
    assert doc.metadata["transcript"] is True
