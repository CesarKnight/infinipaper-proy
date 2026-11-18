import re

from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.base import ExtractionContext, build_document

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)


class MarkdownExtractor:
    name = "markdown/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        text = data.decode("utf-8", errors="replace")
        blocks = [
            {
                "type": "heading",
                "locator": f"línea {text[: match.start()].count(chr(10)) + 1}",
                "text": match.group(2).strip(),
                "level": len(match.group(1)),
            }
            for match in HEADING_RE.finditer(text)
        ]
        if not blocks:
            blocks = [{"type": "paragraph", "locator": "documento", "text": text[:500]}]
        return build_document(
            source=source,
            extractor=self.name,
            text=text,
            blocks=blocks,
            metadata={"format": "markdown"},
        )
