# Plan 012 · Estructuración de apuntes con agentes IA

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-12 |

## 1. Resumen de la solución

Se añade un servicio FastAPI stateless (`infinipaper-agents`) con un grafo LangGraph. NestJS sigue siendo el dueño del job y de los permisos: crea `NoteStructureJob`, lo encola en pg-boss y, desde el worker, genera una URL presignada de MinIO y llama al servicio de agentes. El grafo descarga el Markdown, lo analiza, propone un outline, genera una versión estructurada, la valida y devuelve el resultado. La UI muestra preview/diff y permite crear un nuevo apunte; el original no se toca.

## 2. Contexto técnico actual

- `ResourcesService` y `ResourcesController` gestionan archivos, avisos y apuntes.
- `StorageService` usa el SDK S3; se añadirá `getPresignedGetUrl`.
- `TranscriptionsService` y `QueueService` muestran el patrón de job asíncrono con pg-boss.
- `ProjectAccessGuard` resuelve permisos por `:fileId`.
- El frontend tiene el visor `files/[fileId]/page.tsx` y `MarkdownView`.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | LangGraph para orquestar agentes | PydanticAI, cadena manual | Grafo explícito, fan-out y futuro multiagente |
| D-02 | Router determinista por tipo de fuente | Supervisor LLM | Más barato, predecible y testeable |
| D-03 | FastAPI stateless | FastAPI con DB/checkpointer | Menos acoplamiento; el job vive en NestJS |
| D-04 | pg-boss como cola | Redis/Celery/Procrastinate | Reutiliza PostgreSQL y el patrón existente |
| D-05 | URL presignada de MinIO | Credenciales S3 en Python | Menos superficie de seguridad |
| D-06 | Resultado como nuevo `Resource` | Reemplazar el original | Evita pérdida de datos y versionado |
| D-07 | Logs + OTel opcional | LangSmith obligatorio | Sin dependencia SaaS |
| D-08 | Modelo configurable por nodo | Modelo único | Permite optimizar coste/calidad |
| D-09 | Factory de proveedor: OpenAI-compatible, AWS Bedrock u OpenCode Go | Acoplar a un proveedor | Permite usar Bedrock, OpenCode Go o modelos locales/gateway |

## 4. Cambios por capa

### Datos

- Enum `AgentJobStatus`.
- Modelo `NoteStructureJob` con relaciones a `Resource` y `User`.
- Migración Prisma.
- Rollback: eliminar tabla y enum; los recursos estructurados permanecen como archivos normales.

### Backend NestJS

- `StorageService.getPresignedGetUrl`.
- Nuevo módulo `note-structure`: controlador, servicio, DTOs, cliente del agente, cola y worker.
- Endpoints:
  - `POST /files/:fileId/structure`
  - `GET /structure-jobs/:jobId`
  - `POST /structure-jobs/:jobId/apply`
- `GET /config` expone `agentStructuringEnabled`.
- Variables de entorno nuevas.
- Feature flag.

### Frontend

- Tipos `NoteStructureJob`, `StructureResult`.
- Botón "Estructurar con IA" en el visor Markdown.
- Diálogo con instrucciones, polling, preview, diff y aplicar.
- Invalidación de la lista de archivos tras aplicar.

### Servicio de agentes

- FastAPI + LangGraph.
- Grafo v1 con router determinista.
- Nodos de extracción Markdown, agregación, planificación, estructuración, validación y reparación.
- Herramientas `fetch_source`, `inspect_markdown`, `validate_markdown`.
- Autenticación Bearer.
- Healthcheck y Dockerfile.

### Infraestructura

- Servicio `agents` en `docker-compose.yml`, puerto host 8100.
- Variables `AGENT_SERVICE_URL`, `AGENT_SERVICE_TOKEN`, `AGENT_TIMEOUT_MS`, `AGENT_STRUCTURING_ENABLED`, `AGENT_MAX_INPUT_CHARS`.
- `S3_PRESIGN_TTL_SECONDS`.
- Healthcheck del servicio.

## 5. Contratos

Los contratos detallados están en [`spec.md`](./spec.md#7-contratos-e-interfaces).

Resumen:

- NestJS recibe cookie de sesión y valida Editor+.
- NestJS envía al agente un `sources: []` con URL presignada y checksum.
- El agente responde Markdown, outline, warnings, coverage y usage.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| FastAPI unitario | Validadores, router, extracción y schema | pytest |
| FastAPI grafo | Recorrido con modelo falso | pytest + FakeListChatModel |
| NestJS unitario | Servicio de jobs, worker, permisos | Vitest |
| Contrato | Request/response NestJS ↔ FastAPI | Vitest + mock |
| Frontend | Diálogo, polling y apply | Playwright |
| Seguridad | Token, prompt injection, timeout, checksum | pytest/Vitest |
| Calidad | ruff, pytest, pyright, lint, build | CI/local |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Pérdida o invención de contenido | Alto | Validación de cobertura, diff, original intacto |
| Prompt injection | Alto | Contenido delimitado, herramientas allowlist, sin ejecución |
| Notas grandes | Medio | Límite v1 y chunking futuro |
| Timeout del LLM | Medio | Timeout configurable, job FAILED y reintento |
| Coste por tokens | Medio | Límites, modelo por nodo, caché futura |
| Servicio caído | Medio | Feature flag y error controlado |
| Grafo difícil de depurar | Medio | Nodos pequeños, logs por nodo y OTel |

## 8. Rollback

- Revertir código del backend, frontend y servicio de agentes.
- Eliminar migración `NoteStructureJob` si se revierte antes de producción.
- Los apuntes estructurados ya creados son archivos normales y no se eliminan automáticamente.
- Desactivar `AGENT_STRUCTURING_ENABLED` es el rollback inmediato.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/prisma/schema.prisma` | `AgentJobStatus`, `NoteStructureJob` |
| `infinipaper-backend/prisma/migrations/*` | Migración |
| `infinipaper-backend/src/common/storage/storage.service.ts` | Presigned URL |
| `infinipaper-backend/src/modules/note-structure/*` | Nuevo módulo |
| `infinipaper-backend/src/modules/config/config.controller.ts` | Feature flag |
| `infinipaper-backend/src/app.module.ts` | Registro del módulo |
| `infinipaper-backend/.env.example` | Variables nuevas |
| `infinipaper-backend/docker-compose.yml` | Servicio `agents` |
| `infinipaper-agents/*` | Nuevo servicio FastAPI/LangGraph |
| `infinipaper-frontend/components/markdown/structure-note-dialog.tsx` | Nuevo diálogo |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx` | Botón e integración |
| `infinipaper-frontend/lib/types.ts` | Tipos |
| `docs/sdd/specs/012-*` | Spec/plan/tasks |
| `docs/sdd/diagramas/*`, `docs/sdd/ea/*` | Diagramas y modelo EA |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02, RF-03 | `T-020`, `T-021` |
| RF-04, RF-05 | `T-022`, `T-010` |
| RF-06, RF-07, RF-08, RF-09 | `T-011`, `T-012`, `T-013` |
| RF-10 | `T-023`, `T-013` |
| RF-11, RF-12, RF-13 | `T-030`, `T-031`, `T-024` |
| RF-14 | `T-025` |
| RF-15 | `T-014` |
| RF-16 | `T-026` |
| RF-17, RF-18 | `T-015` |
