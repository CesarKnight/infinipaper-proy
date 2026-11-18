# Plan 025 · MCP de desempeño

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-18` |

## 1. Resumen

Se añaden tokens MCP por proyecto, hasheados y revocables, y una API interna de solo lectura. El servicio de agentes expone FastMCP en `/mcp` y cada herramienta valida el token contra el backend. Se auditan consultas y se aplica rate limit por token.

## 2. Decisiones

| ID | Decisión | Motivo |
|---|---|---|
| D-01 | FastMCP montado en FastAPI con lifespan compartido. | Un solo servicio de agentes. |
| D-02 | Token estático scoped por proyecto. | v1 sin OAuth. |
| D-03 | Solo lectura. | Seguridad y alcance. |
| D-04 | El MCP llama a la API interna. | No expone PostgreSQL. |

## 3. Cambios

- `McpToken` con hash, scopes, expiración y revocación.
- Endpoints de creación/listado/revocación y `/mcp-tools/*`.
- FastMCP con herramientas `list_projects`, `get_project_summary`, `list_quiz_tasks`, `get_task_results`, `get_student_performance`.
- Rate limit y `AuditEvent`.
- UI “Integraciones MCP” en ajustes.

## 4. Pruebas

- E2E: crear token, listar proyecto, resumen, revocar y recibir 401.
- Inicialización MCP por HTTP.
- Lint, tests y build.

## 5. Rollback

Revierte la migración; se invalidan todos los tokens MCP. El endpoint `/mcp` puede desmontarse sin afectar a la estructuración.
