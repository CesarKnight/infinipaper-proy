import io

from pptx import Presentation

from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.base import (
    ExtractionContext,
    build_document,
    clean_text,
    table_to_markdown,
)


class SlidesExtractor:
    name = "slides/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        try:
            presentation = Presentation(io.BytesIO(data))
        except Exception as exc:  # noqa: BLE001
            raise AgentError(
                "SOURCE_EXTRACTION_FAILED",
                "No se pudo abrir la presentación",
                422,
            ) from exc

        parts: list[str] = []
        blocks: list[dict] = []
        for slide_index, slide in enumerate(presentation.slides, start=1):
            slide_parts: list[str] = []
            title = ""
            if slide.shapes.title is not None:
                title = clean_text(slide.shapes.title.text, 5_000)
                if title:
                    slide_parts.append(f"### {title}")
                    blocks.append(
                        {
                            "type": "heading",
                            "locator": f"diapositiva {slide_index}",
                            "text": title,
                            "level": 3,
                        }
                    )
            for shape in slide.shapes:
                shape_table = getattr(shape, "table", None)
                if shape_table is not None:
                    rows = [
                        [clean_text(cell.text, 5_000) for cell in row.cells]
                        for row in shape_table.rows
                    ]
                    table = table_to_markdown(rows)
                    if table:
                        slide_parts.append(table)
                        blocks.append(
                            {
                                "type": "table",
                                "locator": f"diapositiva {slide_index}",
                                "text": table,
                            }
                        )
                else:
                    text_frame = getattr(shape, "text_frame", None)
                    if text_frame is None:
                        continue
                    for paragraph in text_frame.paragraphs:
                        text = clean_text(paragraph.text, 10_000)
                        if not text or text == title:
                            continue
                        level = getattr(paragraph, "level", 0) or 0
                        prefix = "  " * min(level, 3)
                        slide_parts.append(f"{prefix}- {text}")
                        blocks.append(
                            {
                                "type": "paragraph",
                                "locator": f"diapositiva {slide_index}",
                                "text": text,
                            }
                        )
            if slide.has_notes_slide:
                notes_frame = slide.notes_slide.notes_text_frame
                notes = clean_text(notes_frame.text if notes_frame else "", 20_000)
                if notes:
                    slide_parts.append(f"**Notas:** {notes}")
                    blocks.append(
                        {
                            "type": "paragraph",
                            "locator": f"notas diapositiva {slide_index}",
                            "text": notes,
                        }
                    )
            if slide_parts:
                parts.append(f"## Diapositiva {slide_index}\n\n" + "\n\n".join(slide_parts))

        if not parts:
            raise AgentError("SOURCE_EMPTY", "La presentación no tiene texto", 422)

        return build_document(
            source=source,
            extractor=self.name,
            text="\n\n".join(parts),
            blocks=blocks,
            metadata={"format": "slides", "slides": len(presentation.slides)},
        )
