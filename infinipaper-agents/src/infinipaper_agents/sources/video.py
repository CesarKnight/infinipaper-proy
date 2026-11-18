import asyncio
import io
import shutil
import subprocess
import tempfile
from pathlib import Path

import pytesseract
from PIL import Image

from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.audio import transcribe_audio
from infinipaper_agents.sources.base import (
    ExtractionContext,
    build_document,
    clean_text,
)
from infinipaper_agents.sources.vision import describe_image


def _run(command: list[str], timeout: int = 300) -> subprocess.CompletedProcess[bytes]:
    if shutil.which(command[0]) is None:
        raise AgentError(
            "VIDEO_TOOL_UNAVAILABLE",
            f"No está disponible {command[0]} para procesar el video",
            502,
        )
    try:
        return subprocess.run(
            command,
            check=True,
            capture_output=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise AgentError(
            "SOURCE_EXTRACTION_TIMEOUT",
            "El procesamiento del video tardó demasiado",
            504,
        ) from exc
    except subprocess.CalledProcessError as exc:
        raise AgentError(
            "SOURCE_EXTRACTION_FAILED",
            "No se pudo procesar el video",
            422,
        ) from exc


def _extract_audio(data: bytes, suffix: str) -> bytes:
    with tempfile.TemporaryDirectory(prefix="infinipaper-video-") as tmp:
        input_path = Path(tmp) / f"input{suffix}"
        output_path = Path(tmp) / "audio.wav"
        input_path.write_bytes(data)
        _run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-vn",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-f",
                "wav",
                str(output_path),
            ]
        )
        return output_path.read_bytes()


def _extract_frames(data: bytes, suffix: str, interval: int, limit: int) -> list[bytes]:
    with tempfile.TemporaryDirectory(prefix="infinipaper-frames-") as tmp:
        input_path = Path(tmp) / f"input{suffix}"
        input_path.write_bytes(data)
        pattern = Path(tmp) / "frame-%03d.jpg"
        _run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-vf",
                f"fps=1/{max(interval, 1)}",
                "-frames:v",
                str(max(limit, 1)),
                str(pattern),
            ]
        )
        return [path.read_bytes() for path in sorted(Path(tmp).glob("frame-*.jpg"))]


class VideoExtractor:
    name = "video/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        suffix = Path(source.name).suffix or ".mp4"
        warnings: list[str] = []
        transcript = ""
        try:
            audio = await asyncio.to_thread(_extract_audio, data, suffix)
            transcript = await transcribe_audio(
                audio,
                f"{source.name}.wav",
                "audio/wav",
                context.settings,
            )
        except AgentError as exc:
            warnings.append(f"No se pudo transcribir el audio: {exc.message}")

        parts = [transcript] if transcript else []
        if not transcript and context.settings.video_frame_fallback:
            try:
                frames = await asyncio.to_thread(
                    _extract_frames,
                    data,
                    suffix,
                    context.settings.video_frame_interval_seconds,
                    context.settings.max_video_frames,
                )
            except AgentError as exc:
                warnings.append(f"No se pudieron extraer frames: {exc.message}")
                frames = []
            for index, frame in enumerate(frames, start=1):
                try:
                    image = Image.open(io.BytesIO(frame))
                    text = clean_text(
                        pytesseract.image_to_string(
                            image,
                            lang=context.settings.ocr_language,
                        ),
                        20_000,
                    )
                except Exception as exc:  # noqa: BLE001
                    warnings.append(f"OCR del frame {index} falló: {exc}")
                    continue
                if len(text) >= 20:
                    parts.append(f"### Frame {index}\n\n{text}")
                elif context.settings.vision_enabled:
                    description, _, vision_warning = await describe_image(
                        context.model,
                        context.settings,
                        frame,
                    )
                    if vision_warning:
                        warnings.append(vision_warning)
                    if description:
                        parts.append(f"### Frame {index}\n\n{description}")

        content = "\n\n".join(parts).strip()
        if not content:
            raise AgentError(
                "SOURCE_EMPTY",
                "El video no contiene audio ni texto reconocible",
                422,
            )
        return build_document(
            source=source,
            extractor=self.name,
            text=content,
            blocks=[
                {
                    "type": "transcript",
                    "locator": "video",
                    "text": content[:2_000],
                }
            ],
            metadata={
                "format": "video",
                "transcript": bool(transcript),
                "frames": "frames" in content.lower(),
            },
            warnings=warnings,
        )
