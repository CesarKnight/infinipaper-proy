import pytest
from langchain_aws import ChatBedrockConverse
from langchain_openai import ChatOpenAI

from infinipaper_agents.config import Settings
from infinipaper_agents.model import create_model


def _bedrock_settings() -> Settings:
    return Settings.model_validate(
        {
            "MODEL_PROVIDER": "bedrock",
            "BEDROCK_MODEL_ID": "anthropic.claude-3-5-sonnet-20240620-v1:0",
            "AWS_REGION": "us-east-1",
            "AWS_ACCESS_KEY_ID": "test-key",
            "AWS_SECRET_ACCESS_KEY": "test-secret",
            "MODEL_TEMPERATURE": 0.2,
            "AGENT_MAX_OUTPUT_TOKENS": 4096,
        }
    )


def test_creates_bedrock_model() -> None:
    model = create_model(_bedrock_settings())
    assert isinstance(model, ChatBedrockConverse)
    assert model.model_id == "anthropic.claude-3-5-sonnet-20240620-v1:0"
    assert model.region_name == "us-east-1"
    assert model.max_tokens == 4096
    assert model.temperature == 0.2


def test_creates_openai_compatible_model() -> None:
    settings = Settings.model_validate(
        {
            "MODEL_PROVIDER": "openai-compatible",
            "MODEL_NAME": "gpt-4o-mini",
            "MODEL_API_KEY": "test-key",
            "MODEL_BASE_URL": "https://example.invalid/v1",
        }
    )
    model = create_model(settings)
    assert isinstance(model, ChatOpenAI)
    assert model.model_name == "gpt-4o-mini"


def test_creates_opencode_go_model() -> None:
    settings = Settings.model_validate(
        {
            "MODEL_PROVIDER": "opencode-go",
            "OPENCODE_API_KEY": "test-key",
            "OPENCODE_MODEL": "deepseek-v4.1-flash",
            "AGENT_OPENCODE_SESSION_ID": "test-session",
        }
    )
    model = create_model(settings)
    assert isinstance(model, ChatOpenAI)
    assert model.openai_api_base == "https://opencode.ai/inference/go/openai/v1"
    assert model.model_name == "deepseek-v4.1-flash"
    assert model.default_headers is not None
    assert model.default_headers["x-opencode-session"] == "test-session"


def test_rejects_opencode_without_key() -> None:
    with pytest.raises(ValueError, match="OPENCODE_API_KEY"):
        Settings.model_validate(
            {"MODEL_PROVIDER": "opencode-go", "OPENCODE_API_KEY": ""}
        )


def test_rejects_bedrock_without_model_id() -> None:
    with pytest.raises(ValueError, match="BEDROCK_MODEL_ID"):
        Settings.model_validate(
            {
                "MODEL_PROVIDER": "bedrock",
                "BEDROCK_MODEL_ID": "",
                "MODEL_STRUCTURER": "",
            }
        )


def test_rejects_unknown_provider() -> None:
    settings = Settings.model_validate({"MODEL_PROVIDER": "unknown"})
    with pytest.raises(ValueError, match="MODEL_PROVIDER no soportado"):
        create_model(settings)
