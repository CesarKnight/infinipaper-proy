from botocore.exceptions import ClientError
from fastapi.testclient import TestClient

from infinipaper_agents.main import app
from infinipaper_agents.schemas import (
    OutlineSection,
    Usage,
    ValidationReport,
)


class ThrottledGraph:
    async def ainvoke(self, _state: dict) -> dict:
        raise ClientError(
            {
                "Error": {
                    "Code": "ThrottlingException",
                    "Message": "Too many tokens per day",
                }
            },
            "Converse",
        )


class FakeGraph:
    async def ainvoke(self, state: dict) -> dict:
        return {
            **state,
            "draft_markdown": "# Tema\n\n## Resumen\nContenido",
            "outline": [OutlineSection(heading="Resumen", level=2)],
            "warnings": [],
            "validation": ValidationReport(valid=True, coverage=0.9, issues=[]),
            "usage": Usage(model="fake", input_tokens=12, output_tokens=34),
        }


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_structure_requires_token() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/notes/structure",
            json={
                "jobId": "job-1",
                "sources": [],
                "context": {"projectId": "p", "folderId": "f"},
            },
        )
    assert response.status_code == 401
    assert response.json()["code"] == "AGENT_UNAUTHORIZED"


def test_structure_validates_body() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/notes/structure",
            headers={"Authorization": "Bearer dev-agent-token"},
            json={
                "jobId": "job-1",
                "sources": [],
                "context": {"projectId": "p", "folderId": "f"},
            },
        )
    assert response.status_code == 422


def test_structure_rejects_bad_token() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/notes/structure",
            headers={"Authorization": "Bearer wrong"},
            json={
                "jobId": "job-1",
                "sources": [
                    {
                        "resourceId": "r",
                        "kind": "markdown",
                        "name": "tema.md",
                        "mimeType": "text/markdown",
                        "url": "http://example.invalid",
                    }
                ],
                "context": {"projectId": "p", "folderId": "f"},
            },
        )
    assert response.status_code == 401
    assert response.json()["code"] == "AGENT_UNAUTHORIZED"


def test_structure_maps_provider_throttling_to_rate_limited() -> None:
    with TestClient(app) as client:
        app.state.graph = ThrottledGraph()
        response = client.post(
            "/v1/notes/structure",
            headers={"Authorization": "Bearer dev-agent-token"},
            json={
                "jobId": "job-1",
                "sources": [
                    {
                        "resourceId": "r",
                        "kind": "markdown",
                        "name": "tema.md",
                        "mimeType": "text/markdown",
                        "url": "http://example.invalid",
                    }
                ],
                "context": {"projectId": "p", "folderId": "f"},
            },
        )
    assert response.status_code == 429
    assert response.json()["code"] == "AGENT_RATE_LIMITED"


def test_structure_returns_camel_case_contract() -> None:
    with TestClient(app) as client:
        app.state.graph = FakeGraph()
        response = client.post(
            "/v1/notes/structure",
            headers={"Authorization": "Bearer dev-agent-token"},
            json={
                "jobId": "job-1",
                "sources": [
                    {
                        "resourceId": "r",
                        "kind": "markdown",
                        "name": "tema.md",
                        "mimeType": "text/markdown",
                        "url": "http://example.invalid",
                    }
                ],
                "context": {"projectId": "p", "folderId": "f"},
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["markdown"].startswith("# Tema")
    assert data["usage"]["inputTokens"] == 12
    assert data["promptVersion"] == "note-structurer/v1"
    assert data["outline"][0]["heading"] == "Resumen"
