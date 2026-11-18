import csv
import io

from openpyxl import load_workbook

from infinipaper_agents.errors import AgentError
from infinipaper_agents.schemas import ExtractedDocument, SourceRef
from infinipaper_agents.sources.base import (
    ExtractionContext,
    build_document,
    clean_text,
    table_to_markdown,
)

MAX_ROWS = 200
MAX_COLS = 50


def _rows_from_csv(data: bytes) -> list[list[object]]:
    text = data.decode("utf-8-sig", errors="replace")
    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    rows: list[list[object]] = []
    for row in csv.reader(io.StringIO(text), dialect=dialect):
        values: list[object] = [clean_text(cell, 5_000) for cell in row[:MAX_COLS]]
        rows.append(values)
        if len(rows) >= MAX_ROWS:
            break
    return rows


def _build_sheet_markdown(name: str, rows: list[list[object]]) -> str:
    table = table_to_markdown(rows, max_cols=MAX_COLS)
    if not table:
        return ""
    non_empty = sum(1 for row in rows if any(str(cell).strip() for cell in row))
    return (
        f"## Hoja: {name}\n\n"
        f"Filas: {non_empty}, columnas: {max((len(row) for row in rows), default=0)}.\n\n"
        f"{table}"
    )


class SpreadsheetExtractor:
    name = "spreadsheet/v1"
    version = "v1"

    async def extract(
        self,
        source: SourceRef,
        data: bytes,
        context: ExtractionContext,
    ) -> ExtractedDocument:
        filename = source.name.lower()
        if filename.endswith(".csv"):
            rows = _rows_from_csv(data)
            markdown = _build_sheet_markdown("CSV", rows)
            blocks = (
                [{"type": "table", "locator": "csv", "text": markdown}]
                if markdown
                else []
            )
            return build_document(
                source=source,
                extractor=self.name,
                text=markdown,
                blocks=blocks,
                metadata={"format": "csv", "sheets": 1},
            )

        if filename.endswith(".xlsb"):
            raise AgentError(
                "UNSUPPORTED_SOURCE_TYPE",
                "Los libros .xlsb se habilitarán en la segunda fase",
                415,
            )

        try:
            workbook = load_workbook(
                io.BytesIO(data),
                read_only=True,
                data_only=True,
            )
        except Exception as exc:  # noqa: BLE001
            raise AgentError(
                "SOURCE_EXTRACTION_FAILED",
                "No se pudo abrir la hoja de cálculo",
                422,
            ) from exc

        parts: list[str] = []
        blocks: list[dict] = []
        warnings: list[str] = []
        for sheet in workbook.worksheets:
            rows: list[list[object]] = []
            truncated = False
            for index, row in enumerate(sheet.iter_rows(values_only=True)):
                if index >= MAX_ROWS:
                    truncated = True
                    break
                values: list[object] = list(row[:MAX_COLS])
                if any(value is not None and str(value).strip() for value in values):
                    rows.append(values)
            markdown = _build_sheet_markdown(sheet.title, rows)
            if markdown:
                parts.append(markdown)
                blocks.append(
                    {"type": "table", "locator": f"hoja {sheet.title}", "text": markdown}
                )
            if truncated:
                warnings.append(
                    f"Se recortó la hoja {sheet.title} a {MAX_ROWS} filas"
                )

        if not parts:
            raise AgentError("SOURCE_EMPTY", "La hoja de cálculo no tiene datos", 422)

        return build_document(
            source=source,
            extractor=self.name,
            text="\n\n".join(parts),
            blocks=blocks,
            metadata={
                "format": "spreadsheet",
                "sheets": len(workbook.worksheets),
            },
            warnings=warnings,
        )
