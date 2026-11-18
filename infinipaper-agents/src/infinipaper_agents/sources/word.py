import io

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.base import (
    ExtractionContext,
    build_document,
    clean_text,
    table_to_markdown,
)


def _heading_level(paragraph: Paragraph) -> int | None:
    style_name = paragraph.style.name if paragraph.style else ""
    style = (style_name or "").lower()
    if style.startswith("heading"):
        digits = "".join(char for char in style if char.isdigit())
        if digits:
            return max(1, min(6, int(digits)))
        return 2
    if style == "title":
        return 1
    return None


class WordExtractor:
    name = "word/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        document = Document(io.BytesIO(data))
        parts: list[str] = []
        blocks: list[dict] = []
        paragraphs = 0
        tables = 0

        for child in document.element.body.iterchildren():
            tag = child.tag.rsplit("}", 1)[-1]
            if tag == "p":
                paragraph = Paragraph(child, document)
                text = clean_text(paragraph.text, 20_000)
                if not text:
                    continue
                paragraphs += 1
                level = _heading_level(paragraph)
                locator = f"párrafo {paragraphs}"
                if level:
                    parts.append(f"{'#' * level} {text}")
                    blocks.append(
                        {
                            "type": "heading",
                            "locator": locator,
                            "text": text,
                            "level": level,
                        }
                    )
                else:
                    parts.append(text)
                    blocks.append(
                        {"type": "paragraph", "locator": locator, "text": text}
                    )
            elif tag == "tbl":
                table = Table(child, document)
                rows = [
                    [clean_text(cell.text, 5_000) for cell in row.cells]
                    for row in table.rows
                ]
                markdown = table_to_markdown(rows)
                if not markdown:
                    continue
                tables += 1
                locator = f"tabla {tables}"
                parts.append(f"### Tabla {tables}\n\n{markdown}")
                blocks.append({"type": "table", "locator": locator, "text": markdown})

        return build_document(
            source=source,
            extractor=self.name,
            text="\n\n".join(parts),
            blocks=blocks,
            metadata={
                "format": "word",
                "paragraphs": paragraphs,
                "tables": tables,
            },
        )
