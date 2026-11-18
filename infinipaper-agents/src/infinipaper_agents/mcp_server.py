import os
from typing import Any

import httpx
from fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_request

mcp = FastMCP(
    "Infinipaper",
    instructions="Consulta de solo lectura del desempeño de proyectos y cuestionarios.",
)


def _backend_url() -> str:
    return os.getenv("BACKEND_INTERNAL_URL", "http://localhost:3001/api/v1").rstrip("/")


def _authorization() -> str:
    request = get_http_request()
    authorization = request.headers.get("authorization")
    if not authorization:
        raise ValueError("Falta el token MCP")
    return authorization


async def _get(path: str) -> Any:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{_backend_url()}{path}",
            headers={"Authorization": _authorization()},
        )
    if response.status_code >= 400:
        try:
            detail = response.json()
        except ValueError:
            detail = {"code": "MCP_BACKEND_ERROR", "message": response.text}
        raise RuntimeError(str(detail))
    return response.json()


@mcp.tool
async def list_projects() -> Any:
    """Lista los proyectos dentro del scope del token MCP."""
    return await _get("/mcp-tools/projects")


@mcp.tool
async def get_project_summary(project_id: str) -> Any:
    """Devuelve estudiantes, tareas, intentos y promedio del proyecto."""
    return await _get(f"/mcp-tools/projects/{project_id}/summary")


@mcp.tool
async def list_quiz_tasks(project_id: str) -> Any:
    """Lista las tareas de cuestionario del proyecto."""
    return await _get(f"/mcp-tools/projects/{project_id}/tasks")


@mcp.tool
async def get_task_results(project_id: str, assignment_id: str) -> Any:
    """Devuelve resultados agregados y por estudiante de una tarea."""
    return await _get(
        f"/mcp-tools/projects/{project_id}/tasks/{assignment_id}/results"
    )


@mcp.tool
async def get_student_performance(project_id: str, student_id: str) -> Any:
    """Devuelve el desempeño de un estudiante dentro del proyecto."""
    return await _get(
        f"/mcp-tools/projects/{project_id}/students/{student_id}/performance"
    )
