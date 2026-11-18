import io

import pymupdf
import pytesseract
from PIL import Image

from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.base import (
    ExtractionContext,
    build_document,
    clean_text,
)

MIN_TEXT_CHARS = 40


def _ocr_page(page: pymupdf.Page, language: str) -> str:
    pixmap = page.get_pixmap(dpi=180, alpha=False)
    image = Image.open(io.BytesIO(pixmap.tobytes("png")))
    return clean_text(
        pytesseract.image_to_string(image, lang=language),
        100_000,
    )


class PdfExtractor:
    name = "pdf/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        try:
            document = pymupdf.open(stream=data, filetype="pdf")
        except Exception as exc:  # noqa: BLE001
            raise AgentError(
                "SOURCE_EXTRACTION_FAILED",
                "No se pudo abrir el PDF",
                422,
            ) from exc

        if document.needs_pass:
            raise AgentError(
                "SOURCE_EXTRACTION_FAILED",
                "El PDF está protegido con contraseña",
                422,
            )

        parts: list[str] = []
        blocks: list[dict] = []
        warnings: list[str] = []
        ocr_pages = 0
        for index in range(1, document.page_count + 1):
            page = document.load_page(index - 1)
            text = clean_text(page.get_text("text"), 100_000)
            if len(text) < MIN_TEXT_CHARS:
                if ocr_pages >= context.settings.max_ocr_pages:
                    warnings.append(
                        f"Se omitió OCR de la página {index}: límite de "
                        f"{context.settings.max_ocr_pages} páginas"
                    )
                else:
                    try:
                        ocr_text = _ocr_page(page, context.settings.ocr_language)
                        ocr_pages += 1
                        if ocr_text:
                            text = ocr_text
                            warnings.append(f"Página {index} procesada con OCR")
                    except Exception as exc:  # noqa: BLE001
                        warnings.append(f"No se pudo aplicar OCR a la página {index}: {exc}")
            if not text:
                continue
            parts.append(f"### Página {index}\n\n{text}")
            blocks.append(
                {"type": "page", "locator": f"p. {index}", "text": text[:2_000]}
            )

        if not parts:
            raise AgentError(
                "SOURCE_EMPTY",
                "El PDF no contiene texto reconocible",
                422,
            )

        return build_document(
            source=source,
            extractor=self.name,
            text="\n\n".join(parts),
            blocks=blocks,
            metadata={
                "format": "pdf",
                "pages": document.page_count,
                "ocrPages": ocr_pages,
            },
            warnings=warnings,
        )
