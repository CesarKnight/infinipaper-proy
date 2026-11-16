# Spec 025 · MCP para consulta de desempeño

| Campo | Valor |
|---|---|
| ID | `025` |
| Estado | `Borrador` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `016`, `018`, `019`, `023` |

## 1. Contexto y problema

Docentes y asistentes externos necesitan consultar el desempeño de un curso desde herramientas compatibles con MCP. Exponer la base directamente sería inseguro y rompería permisos y privacidad.

El requisito pide un MCP para consultar desempeño en cuestionarios. La decisión aprobada es implementarlo en el servicio de agentes usando FastMCP, en modo solo lectura.

## 2. Objetivo

> Como **docente o Owner**, quiero **autorizar a un cliente MCP a consultar el desempeño de mis cuestionarios** para **integrar datos del curso en asistentes y flujos externos sin exponer la base de datos**.

## 3. Alcance

### Incluye

- Servidor FastMCP dentro de `infinipaper-agents`.
- Herramientas de solo lectura para proyectos, tareas, resultados y desempeño por estudiante.
- Tokens MCP con scopes por proyecto.
- Validación de permisos en el backend.
- Rate limit, expiración, revocación y auditoría.
- UI para crear y revocar tokens.
- Modo local para desarrollo.

### No incluye

- Escritura de notas, tareas o contenido desde MCP.
- OAuth 2.1 completo en v1; se usan tokens estáticos con hash.
- Acceso a proyectos privados fuera del scope.
- Exposición de emails, contraseñas o datos sensibles.
- Herramientas de administración global.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El servicio de agentes expone un servidor MCP FastMCP en modo solo lectura. | Must |
| RF-02 | Las herramientas permiten listar proyectos y tareas dentro del scope. | Must |
| RF-03 | Permiten consultar resultados de una tarea y desempeño por estudiante. | Must |
| RF-04 | Cada token tiene owner, scopes, expiración y estado. | Must |
| RF-05 | Solo Owner/Editor/Admin pueden crear tokens. | Must |
| RF-06 | El backend valida token, scope y permisos en cada llamada. | Must |
| RF-07 | Un token no puede acceder a proyectos fuera de su scope. | Must |
| RF-08 | Las respuestas no incluyen email ni datos sensibles. | Must |
| RF-09 | Se registra auditoría de cada consulta. | Must |
| RF-10 | Se aplica rate limit por token. | Must |
| RF-11 | El token se puede revocar de inmediato. | Must |
| RF-12 | El MCP no permite operaciones de escritura. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Los tokens se almacenan hasheados. | Revisión de esquema y tests. |
| RNF-02 | El servidor MCP usa el mismo modelo de permisos que la API. | Tests de acceso cruzado. |
| RNF-03 | Las herramientas responden en menos de 3 segundos con datos agregados. | Prueba de carga. |
| RNF-04 | Los errores no filtran información de proyectos no autorizados. | Tests de contrato. |
| RNF-05 | La UI de tokens es accesible y muestra el token una sola vez. | Revisión visual. |

## 6. Criterios de aceptación

### CA-01 · Crear token

- **Dado** un docente Owner,
- **cuando** crea un token para un proyecto,
- **entonces** ve el token una sola vez y se guarda su hash con scopes.

### CA-02 · Listar proyectos

- **Dado** un cliente MCP con token válido,
- **cuando** llama a `list_projects`,
- **entonces** solo recibe los proyectos del scope.

### CA-03 · Consultar desempeño

- **Dado** un token con scope de un proyecto,
- **cuando** consulta una tarea,
- **entonces** recibe resultados agregados y por estudiante permitidos.

### CA-04 · Token revocado

- **Dado** un token revocado,
- **cuando** el cliente intenta usarlo,
- **entonces** recibe `MCP_TOKEN_REVOKED` · 401.

### CA-05 · Scope insuficiente

- **Dado** un token de un proyecto,
- **cuando** intenta consultar otro,
- **entonces** recibe `MCP_SCOPE_FORBIDDEN` · 403.

### CA-06 · Escritura

- **Dado** un cliente MCP,
- **cuando** intenta modificar una nota o tarea,
- **entonces** la operación no existe o se rechaza.

### CA-07 · Auditoría

- **Dado** una consulta MCP,
- **cuando** se ejecuta,
- **entonces** se registra token, herramienta, proyecto y fecha sin datos sensibles.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/projects/:id/mcp-tokens` | Owner/Editor | `{ name, scopes, expiresAt }` | Token en claro una vez |
| `GET` | `/api/v1/projects/:id/mcp-tokens` | Owner/Editor | — | Tokens sin secreto |
| `DELETE` | `/api/v1/mcp-tokens/:id` | Owner/Editor | — | `204` |
| `POST` | `/mcp` | Token MCP | JSON-RPC MCP | Respuesta MCP |

### Herramientas MCP

| Herramienta | Descripción |
|---|---|
| `list_projects` | Proyectos dentro del scope. |
| `get_project_summary` | Participantes, tareas y métricas generales. |
| `list_quiz_tasks` | Tareas de cuestionario del proyecto. |
| `get_task_results` | Resultados agregados y por estudiante. |
| `get_student_performance` | Desempeño de un estudiante en el proyecto. |

### Datos

- `McpToken`: `ownerId`, `projectId`, `name`, `tokenHash`, `scopes`, `expiresAt`, `revokedAt`, `lastUsedAt`.
- `AuditEvent`: consultas MCP y administración de tokens.
- El servicio MCP no accede a PostgreSQL directamente; llama a la API interna del backend.

### UI

- Sección “Integraciones MCP” en ajustes del proyecto.
- Crear token con nombre, scopes y expiración.
- Copiar token una sola vez.
- Listar y revocar tokens.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Token inválido | No revelar detalles | `MCP_TOKEN_INVALID` · 401 |
| Token expirado | Rechazar | `MCP_TOKEN_EXPIRED` · 401 |
| Token revocado | Rechazar | `MCP_TOKEN_REVOKED` · 401 |
| Proyecto privado fuera de scope | No revelar | `MCP_SCOPE_FORBIDDEN` · 403 |
| Rate limit | Rechazar temporalmente | `MCP_RATE_LIMITED` · 429 |
| Backend caído | Error de herramienta | `MCP_BACKEND_UNAVAILABLE` · 503 |
| Herramienta inexistente | Error MCP estándar | `MCP_TOOL_NOT_FOUND` · 404 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | FastMCP dentro del servicio de agentes. | Cerrada |
| D-02 | Solo lectura; sin escritura en v1. | Cerrada |
| D-03 | Tokens scoped por proyecto, hasheados y revocables. | Cerrada |
| D-04 | El MCP llama a la API interna del backend. | Cerrada |
| Q-01 | ¿Se migrará a OAuth 2.1 en el futuro? | Abierta (futuro) |
| Q-02 | ¿Se expondrán métricas de uso de recursos? | Abierta (v1: solo desempeño) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin OAuth 2.1. | Los tokens son estáticos y deben rotarse. | `T-060` |
| G-02 | Sin herramientas de escritura. | El MCP es solo consulta. | `T-061` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| — | Pendiente de implementación. | — |

> Plan y tareas: se crearán cuando esta spec pase a `Aprobada`.
