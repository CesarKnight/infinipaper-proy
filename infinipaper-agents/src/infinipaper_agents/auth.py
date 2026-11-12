import secrets

from fastapi import Depends, Header

from infinipaper_agents.config import Settings, get_settings
from infinipaper_agents.errors import AgentError


async def require_token(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise AgentError(
            "AGENT_UNAUTHORIZED",
            "Falta el token interno del servicio",
            401,
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not secrets.compare_digest(token, settings.service_token):
        raise AgentError(
            "AGENT_UNAUTHORIZED",
            "Token interno inválido",
            401,
        )
