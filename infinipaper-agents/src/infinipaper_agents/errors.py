from botocore.exceptions import ClientError
from openai import RateLimitError


class AgentError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


_RATE_LIMIT_CODES = {
    "ThrottlingException",
    "Throttling",
    "TooManyRequestsException",
    "RequestLimitExceeded",
    "ProvisionedThroughputExceededException",
    "ServiceQuotaExceededException",
}


def rate_limited_error(exc: BaseException) -> AgentError | None:
    """Traduce límites del proveedor a un error de dominio reutilizable."""
    if isinstance(exc, RateLimitError):
        return AgentError(
            "AGENT_RATE_LIMITED",
            "El proveedor del modelo alcanzó su límite de uso. "
            "Inténtalo de nuevo más tarde.",
            429,
        )

    if isinstance(exc, ClientError):
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code in _RATE_LIMIT_CODES:
            return AgentError(
                "AGENT_RATE_LIMITED",
                "El proveedor del modelo alcanzó su límite de uso. "
                "Inténtalo de nuevo más tarde.",
                429,
            )

    return None
