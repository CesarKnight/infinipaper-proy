import io

import pytesseract
from PIL import Image, ImageOps

from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.base import (
    ExtractionContext,
    build_document,
    clean_text,
)
from infinipaper_agents.sources.vision import describe_image


class ImageExtractor:
    name = "image/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        try:
            image = Image.open(io.BytesIO(data))
            image = ImageOps.exif_transpose(image)
        except Exception as exc:  # noqa: BLE001
            raise AgentError(
                "SOURCE_EXTRACTION_FAILED",
                "No se pudo abrir la imagen",
                422,
            ) from exc

        warnings: list[str] = []
        try:
            text = clean_text(
                pytesseract.image_to_string(
                    image,
                    lang=context.settings.ocr_language,
                ),
                40_000,
            )
        except Exception as exc:  # noqa: BLE001
            text = ""
            warnings.append(f"No se pudo aplicar OCR: {exc}")

        description = ""
        usage = None
        if len(text) < 40:
            description, usage, vision_warning = await describe_image(
                context.model,
                context.settings,
                data,
                language="es",
            )
            if vision_warning:
                warnings.append(vision_warning)

        content = "\n\n".join(part for part in [text, description] if part).strip()
        if not content:
            raise AgentError(
                "SOURCE_EMPTY",
                "La imagen no contiene texto reconocible",
                422,
            )
        if len(text) < 40 and description:
            warnings.append("Se usó visión porque el OCR produjo poco texto")

        return build_document(
            source=source,
            extractor=self.name,
            text=content,
            blocks=[
                {
                    "type": "image_text",
                    "locator": "imagen",
                    "text": content[:2_000],
                }
            ],
            metadata={
                "format": "image",
                "width": image.width,
                "height": image.height,
                "ocr": bool(text),
                "vision": bool(description),
            },
            warnings=warnings,
            usage=usage,
        )
