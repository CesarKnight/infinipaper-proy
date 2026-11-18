from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

SourceKind = Literal[
    "markdown",
    "pdf",
    "word",
    "spreadsheet",
    "slides",
    "image",
    "audio",
    "video",
    "web",
]


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="ignore",
    )


class Usage(ApiModel):
    model: str = ""
    input_tokens: int = 0
    output_tokens: int = 0


class SourceBlock(ApiModel):
    type: str
    locator: str = ""
    text: str = ""
    level: int | None = None


class ExtractedDocument(ApiModel):
    source_id: str
    kind: SourceKind
    text: str
    markdown: str = ""
    blocks: list[SourceBlock] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
    provenance: list[dict] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    extractor: str = ""
    usage: Usage = Field(default_factory=Usage)


class SourceRef(ApiModel):
    resource_id: str
    kind: SourceKind
    name: str
    mime_type: str
    size: int = 0
    checksum: str | None = None
    url: str
    extraction: dict | None = None


class Context(ApiModel):
    project_id: str
    folder_id: str
    language: str = "es"
    instructions: str | None = None


class StructureRequest(ApiModel):
    job_id: str
    sources: list[SourceRef] = Field(min_length=1)
    context: Context


class ExtractRequest(ApiModel):
    job_id: str | None = None
    source: SourceRef
    context: Context


class ExtractResponse(ApiModel):
    document: ExtractedDocument
    warnings: list[str] = Field(default_factory=list)
    usage: Usage
    prompt_version: str


class OutlineSection(ApiModel):
    heading: str
    level: int = 2


class Outline(ApiModel):
    sections: list[OutlineSection] = Field(default_factory=list)


class ValidationIssue(ApiModel):
    code: str
    message: str
    severity: Literal["error", "warning"] = "error"


class ValidationReport(ApiModel):
    valid: bool
    coverage: float
    issues: list[ValidationIssue] = Field(default_factory=list)


class StructuredNote(ApiModel):
    markdown: str
    warnings: list[str] = Field(default_factory=list)


class StructureResponse(ApiModel):
    markdown: str
    outline: list[OutlineSection] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    coverage: float = 0.0
    usage: Usage
    prompt_version: str


class MindmapRequest(ApiModel):
    job_id: str
    sources: list[SourceRef] = Field(min_length=1)
    context: Context
    config: dict = Field(default_factory=dict)


class MindmapResponse(ApiModel):
    mindmap: dict
    used_source_ids: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    usage: Usage
    prompt_version: str


class QuizGenerationConfig(ApiModel):
    count: int = 10
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    types: list[Literal["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]] = Field(
        default_factory=lambda: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]
    )
    instructions: str | None = None


class QuizGenerationRequest(ApiModel):
    job_id: str
    sources: list[SourceRef] = Field(min_length=1)
    context: Context
    config: QuizGenerationConfig = Field(default_factory=lambda: QuizGenerationConfig())


class QuizGenerationResponse(ApiModel):
    quiz: dict
    used_source_ids: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    usage: Usage
    prompt_version: str
