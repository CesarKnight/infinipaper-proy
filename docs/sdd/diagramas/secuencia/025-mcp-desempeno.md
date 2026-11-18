# Secuencia 025 · MCP de desempeño

> Spec: [025-mcp-desempeno](../../specs/025-mcp-desempeno/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor D as Docente / Owner
  actor C as Cliente MCP
  participant FE as Frontend
  participant API as API NestJS
  participant MCP as FastMCP
  participant DB as PostgreSQL

  D->>FE: Crea token MCP
  FE->>API: POST /projects/:id/mcp-tokens
  API->>DB: Guarda McpToken hasheado + scopes
  API-->>FE: Token en claro (una vez)

  C->>MCP: initialize + tools/call
  MCP->>API: GET /mcp-tools/projects (Bearer token)
  API->>DB: Valida hash, scopes, expiración y revocación
  API->>DB: Actualiza lastUsedAt + AuditEvent
  API-->>MCP: Proyecto dentro del scope
  MCP-->>C: Resultado JSON-RPC

  D->>FE: Revoca token
  FE->>API: DELETE /mcp-tokens/:id
  API->>DB: revokedAt = now()
  C->>MCP: tools/call con token revocado
  MCP->>API: Valida token
  API-->>MCP: 401 MCP_TOKEN_REVOKED
```

## Notas

- El MCP es solo lectura y no accede directamente a PostgreSQL.
- Cada token está scoped a un proyecto.
- Rate limit, expiración y auditoría se aplican en el backend.
- Las herramientas disponibles son `list_projects`, `get_project_summary`, `list_quiz_tasks`, `get_task_results` y `get_student_performance`.
