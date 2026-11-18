import base64
import io

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage
from PIL import Image

from infinipaper_agents.config import Settings
from infinipaper_agents.schemas import Usage
from infinipaper_agents.sources.base import clean_text


def _resize_image(data: bytes, max_px: int) -> tuple[bytes, str]:
    image = Image.open(io.BytesIO(data))
    image = image.convert("RGB")
    image.thumbnail((max_px, max_px))
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=85, optimize=True)
    return output.getvalue(), "image/jpeg"


async def describe_image(
    model: BaseChatModel | None,
    settings: Settings,
    data: bytes,
    *,
    language: str = "es",
) -> tuple[str, Usage, str | None]:
    """Devuelve una descripción académica de una imagen y su usage."""
    if not settings.vision_enabled:
        return "", Usage(), "La visión está desactivada"
    if model is None:
        return "", Usage(), "No hay modelo configurado para visión"

    try:
        image_data, mime_type = _resize_image(data, settings.vision_max_image_px)
        encoded = base64.b64encode(image_data).decode("ascii")
        response = await model.ainvoke(
            [
                HumanMessage(
                    content=[
                        {
                            "type": "text",
                            "text": (
                                "Describe esta imagen como material académico en "
                                f"{language}. Extrae títulos, conceptos, procesos, "
                                "fórmulas y relaciones visibles. No inventes datos. "
                                "Devuelve texto plano, sin HTML."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
                        },
                    ]
                )
            ]
        )
        content = response.content
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            text = "".join(
                str(item.get("text", "")) if isinstance(item, dict) else str(item)
                for item in content
            )
        else:
            text = str(content)
        metadata = getattr(response, "usage_metadata", None) or {}
        response_metadata = getattr(response, "response_metadata", None) or {}
        return (
            clean_text(text, 20_000),
            Usage(
                model=response_metadata.get("model_name")
                or settings.model_structurer
                or settings.model_name,
                input_tokens=int(metadata.get("input_tokens", 0) or 0),
                output_tokens=int(metadata.get("output_tokens", 0) or 0),
            ),
            None,
        )
    except Exception as exc:  # noqa: BLE001
        return "", Usage(), f"No se pudo describir la imagen: {exc}"
