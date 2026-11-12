from typing import Any

from langchain_aws import ChatBedrockConverse
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from infinipaper_agents.config import Settings


def _bedrock_model_id(settings: Settings) -> str:
    return settings.model_structurer or settings.bedrock_model_id or ""


def _openai_model_id(settings: Settings) -> str:
    return settings.model_structurer or settings.model_name


def _create_bedrock_model(settings: Settings) -> ChatBedrockConverse:
    kwargs: dict[str, Any] = {
        "model": _bedrock_model_id(settings),
        "region_name": settings.aws_region,
        "temperature": settings.model_temperature,
        "max_tokens": settings.max_output_tokens,
    }
    if settings.aws_profile:
        kwargs["credentials_profile_name"] = settings.aws_profile
    if settings.aws_access_key_id:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
    if settings.aws_secret_access_key:
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    if settings.aws_session_token:
        kwargs["aws_session_token"] = settings.aws_session_token
    return ChatBedrockConverse(**kwargs)


def _create_openai_model(settings: Settings) -> ChatOpenAI:
    return ChatOpenAI(
        model=_openai_model_id(settings),
        base_url=settings.model_base_url,
        api_key=SecretStr(settings.model_api_key or "not-configured"),
        temperature=settings.model_temperature,
        timeout=settings.request_timeout_seconds,
        max_completion_tokens=settings.max_output_tokens,
    )


def _create_opencode_go_model(settings: Settings) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.model_structurer or settings.opencode_model,
        base_url=settings.opencode_base_url,
        api_key=SecretStr(settings.opencode_api_key or "not-configured"),
        default_headers={
            "User-Agent": "infinipaper-agents/0.1.0",
            "x-opencode-session": settings.opencode_session_id,
        },
        temperature=settings.model_temperature,
        timeout=settings.request_timeout_seconds,
        max_completion_tokens=settings.max_output_tokens,
    )


def create_model(settings: Settings) -> BaseChatModel:
    """Crea el modelo configurado: Bedrock, OpenCode Go u OpenAI-compatible."""
    provider = settings.model_provider.strip().lower()

    if provider in {"bedrock", "aws-bedrock", "aws_bedrock"}:
        return _create_bedrock_model(settings)

    if provider in {"opencode-go", "opencode", "opencode_go"}:
        return _create_opencode_go_model(settings)

    if provider in {
        "openai",
        "openai-compatible",
        "openai_compatible",
        "deepseek",
        "local",
    }:
        return _create_openai_model(settings)

    raise ValueError(
        f"MODEL_PROVIDER no soportado: {settings.model_provider!r}. "
        "Usa 'bedrock', 'opencode-go' u 'openai-compatible'."
    )
