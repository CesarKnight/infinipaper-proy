from pathlib import Path

from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import SourceRef
from infinipaper_agents.sources.audio import AudioExtractor
from infinipaper_agents.sources.base import Extractor
from infinipaper_agents.sources.image import ImageExtractor
from infinipaper_agents.sources.markdown import MarkdownExtractor
from infinipaper_agents.sources.pdf import PdfExtractor
from infinipaper_agents.sources.slides import SlidesExtractor
from infinipaper_agents.sources.spreadsheet import SpreadsheetExtractor
from infinipaper_agents.sources.video import VideoExtractor
from infinipaper_agents.sources.word import WordExtractor

DEFERRED_EXTENSIONS = {
    ".doc",
    ".odt",
    ".xls",
    ".xlsb",
    ".ods",
    ".ppt",
    ".odp",
}

EXTRACTORS: dict[str, Extractor] = {
    "markdown": MarkdownExtractor(),
    "pdf": PdfExtractor(),
    "word": WordExtractor(),
    "spreadsheet": SpreadsheetExtractor(),
    "slides": SlidesExtractor(),
    "image": ImageExtractor(),
    "audio": AudioExtractor(),
    "video": VideoExtractor(),
}


def get_extractor(source: SourceRef) -> Extractor:
    extension = Path(source.name).suffix.lower()
    if extension in DEFERRED_EXTENSIONS:
        raise AgentError(
            "UNSUPPORTED_SOURCE_TYPE",
            f"El formato {extension} se habilitará en la segunda fase",
            415,
        )
    extractor = EXTRACTORS.get(source.kind)
    if extractor is None:
        raise AgentError(
            "UNSUPPORTED_SOURCE_TYPE",
            f"Tipo de fuente no soportado: {source.kind}",
            415,
        )
    return extractor
