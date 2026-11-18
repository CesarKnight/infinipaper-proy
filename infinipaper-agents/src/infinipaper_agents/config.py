from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        populate_by_name=True,
    )

    service_token: str = Field("dev-agent-token", alias="AGENT_SERVICE_TOKEN")

    model_name: str = Field("gpt-4o-mini", alias="MODEL_NAME")
    model_provider: str = Field("openai-compatible", alias="MODEL_PROVIDER")
    model_base_url: str | None = Field(None, alias="MODEL_BASE_URL")
    model_api_key: str | None = Field(None, alias="MODEL_API_KEY")
    model_extractor: str | None = Field(None, alias="MODEL_EXTRACTOR")
    model_structurer: str | None = Field(None, alias="MODEL_STRUCTURER")
    model_vision: str | None = Field(None, alias="MODEL_VISION")
    model_temperature: float = Field(0.1, alias="MODEL_TEMPERATURE")

    bedrock_model_id: str | None = Field(None, alias="BEDROCK_MODEL_ID")
    aws_region: str = Field("us-east-1", alias="AWS_REGION")
    aws_profile: str | None = Field(None, alias="AWS_PROFILE")
    aws_access_key_id: str | None = Field(None, alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str | None = Field(None, alias="AWS_SECRET_ACCESS_KEY")
    aws_session_token: str | None = Field(None, alias="AWS_SESSION_TOKEN")

    opencode_api_key: str | None = Field(None, alias="OPENCODE_API_KEY")
    opencode_base_url: str = Field(
        "https://opencode.ai/inference/go/openai/v1",
        alias="OPENCODE_BASE_URL",
    )
    opencode_model: str = Field(
        "deepseek-v4.1-flash",
        alias="OPENCODE_MODEL",
    )
    opencode_session_id: str = Field(
        "infinipaper-agents",
        alias="AGENT_OPENCODE_SESSION_ID",
    )

    max_input_chars: int = Field(120_000, alias="AGENT_MAX_INPUT_CHARS")
    max_output_tokens: int = Field(24_000, alias="AGENT_MAX_OUTPUT_TOKENS")
    request_timeout_seconds: int = Field(300, alias="AGENT_TIMEOUT_SECONDS")
    max_retries: int = Field(1, alias="AGENT_MAX_RETRIES")
    prompt_version: str = Field("note-structurer/v1", alias="AGENT_PROMPT_VERSION")

    extraction_version: str = Field("v1", alias="AGENT_EXTRACTION_VERSION")
    extraction_concurrency: int = Field(3, alias="AGENT_EXTRACTION_CONCURRENCY")
    extraction_timeout_seconds: int = Field(
        120, alias="AGENT_EXTRACTION_TIMEOUT_SECONDS"
    )
    max_sources: int = Field(30, alias="AGENT_MAX_SOURCES")
    max_source_bytes: int = Field(
        55 * 1024 * 1024, alias="AGENT_MAX_SOURCE_BYTES"
    )
    max_total_source_bytes: int = Field(
        250 * 1024 * 1024, alias="AGENT_MAX_TOTAL_SOURCE_BYTES"
    )
    max_extracted_chars: int = Field(2_000_000, alias="AGENT_MAX_EXTRACTED_CHARS")
    max_ocr_pages: int = Field(100, alias="AGENT_MAX_OCR_PAGES")
    ocr_language: str = Field("spa+eng", alias="AGENT_OCR_LANGUAGE")
    max_audio_minutes: int = Field(60, alias="AGENT_MAX_AUDIO_MINUTES")
    vision_enabled: bool = Field(False, alias="AGENT_VISION_ENABLED")
    vision_max_image_px: int = Field(1600, alias="AGENT_VISION_MAX_IMAGE_PX")
    video_frame_fallback: bool = Field(True, alias="AGENT_VIDEO_FRAME_FALLBACK")
    video_frame_interval_seconds: int = Field(
        60, alias="AGENT_VIDEO_FRAME_INTERVAL_SECONDS"
    )
    max_video_frames: int = Field(8, alias="AGENT_MAX_VIDEO_FRAMES")

    asr_url: str = Field("http://localhost:8000", alias="ASR_URL")
    asr_api_key: str | None = Field(None, alias="ASR_API_KEY")
    asr_default_language: str = Field("es", alias="ASR_DEFAULT_LANGUAGE")
    asr_timeout_seconds: int = Field(600, alias="ASR_TIMEOUT_SECONDS")


    otel_enabled: bool = Field(False, alias="OTEL_ENABLED")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    @field_validator(
        "model_base_url",
        "model_api_key",
        "model_extractor",
        "model_structurer",
        "model_vision",
        "bedrock_model_id",
        "aws_profile",
        "aws_access_key_id",
        "aws_secret_access_key",
        "aws_session_token",
        "opencode_api_key",
        "asr_api_key",
        mode="before",
    )
    @classmethod
    def empty_string_to_none(cls, value: object) -> object:
        return value or None

    @model_validator(mode="after")
    def validate_bedrock_model(self) -> "Settings":
        provider = self.model_provider.strip().lower()
        if provider in {"bedrock", "aws-bedrock", "aws_bedrock"} and not (
            self.model_structurer or self.bedrock_model_id
        ):
            raise ValueError(
                "BEDROCK_MODEL_ID o MODEL_STRUCTURER es obligatorio "
                "cuando MODEL_PROVIDER=bedrock"
            )
        if provider in {"opencode-go", "opencode", "opencode_go"} and not (
            self.opencode_api_key
        ):
            raise ValueError(
                "OPENCODE_API_KEY es obligatorio cuando "
                "MODEL_PROVIDER=opencode-go"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()  # pyright: ignore[reportCallIssue]
