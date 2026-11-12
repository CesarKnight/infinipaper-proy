from typing import TypedDict

from infinipaper_agents.schemas import (
    Context,
    ExtractedDocument,
    OutlineSection,
    SourceRef,
    Usage,
    ValidationReport,
)


class GraphState(TypedDict, total=False):
    job_id: str
    sources: list[SourceRef]
    context: Context
    extracted: list[ExtractedDocument]
    context_text: str
    outline: list[OutlineSection]
    draft_markdown: str
    validation: ValidationReport
    warnings: list[str]
    usage: Usage
    retry_count: int
    route: str
    error: str
    error_message: str
