# Tasks 012 · Estructuración de apuntes con agentes IA

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Crear spec, plan y tareas. <P-01>
- [x] `T-002` Confirmar LangGraph, router determinista, sin checkpointer y nuevo apunte. <D-01, D-02, D-03, D-04>
- [x] `T-003` Registrar UC-12 y secuencia 012 en diagramas y EA. <P-09>

## Fase 1 · Servicio de agentes

- [x] `T-010` Crear `infinipaper-agents` con FastAPI, configuración, health y Dockerfile. <RF-04, RNF-01>
- [x] `T-011` Definir schemas Pydantic y `GraphState`. <RF-17>
- [x] `T-012` Implementar grafo LangGraph con router determinista y nodo `unsupported`. <RF-06, RF-18>
- [x] `T-013` Implementar nodos de extracción Markdown, agregación, outline, estructuración, validación y reparación. <RF-07, RF-08, RF-09, RF-10>
- [x] `T-014` Implementar autenticación Bearer y endpoint `/v1/notes/structure`. <RF-15>
- [x] `T-015` Implementar contrato `sources: []` preparado para futuros tipos. <RF-17, RF-18>
- [x] `T-016` Añadir tests de router, validación y grafo con modelo falso. <RNF-08>
- [x] `T-017` Implementar factory de proveedor OpenAI-compatible/AWS Bedrock y tests. <RF-15, D-06>
- [x] `T-018` Añadir proveedor OpenCode Go (`x-opencode-session`) y tests. <RF-15, D-06>

## Fase 2 · Backend NestJS

- [x] `T-020` Añadir `AgentJobStatus`, `NoteStructureJob` y relaciones en Prisma. <RF-02, RF-10>
- [x] `T-021` Crear migración Prisma. <RF-02>
- [x] `T-022` Añadir `StorageService.getPresignedGetUrl`. <RF-04, RF-05>
- [x] `T-023` Implementar `NoteStructureService`, cola pg-boss y worker. <RF-02, RF-03, RF-04, RF-10>
- [x] `T-024` Implementar endpoints de creación, consulta y apply. <RF-11, RF-12, RF-13>
- [x] `T-025` Aplicar permisos Editor+ y validaciones de estado. <RF-14>
- [x] `T-026` Implementar feature flag y exponerla en `/config`. <RF-16>
- [x] `T-027` Añadir variables de entorno y configuración. <RNF-04>
- [x] `T-028` Añadir tests unitarios del servicio/worker. <RNF-08>

## Fase 3 · Frontend

- [x] `T-030` Crear `structure-note-dialog.tsx` con polling, preview y diff. <RF-11>
- [x] `T-031` Integrar el botón "Estructurar con IA" en el visor Markdown. <RF-01, RF-12>
- [x] `T-032` Implementar apply y navegación al nuevo apunte. <RF-12, RF-13>
- [x] `T-033` Añadir estados de error y feature flag. <RF-16, RNF-07>

## Fase 4 · Infraestructura y documentación

- [x] `T-040` Añadir servicio `agents` a Docker Compose y healthcheck. <RNF-01>
- [x] `T-041` Actualizar `.env.example`, guías y referencias. <P-09>
- [x] `T-042` Actualizar diagramas de casos de uso, secuencia, clases, paquetes y C4. <P-09>
- [x] `T-043` Actualizar `modelo.json` y regenerar script EA. <P-09>
- [x] `T-044` Actualizar índice de specs y `docs/README.md`. <P-09>

## Fase 5 · Verificación

- [x] `T-050` FastAPI: `ruff` y `pytest`. <RNF-08>
- [x] `T-051` Backend: `npm run lint && npm test && npm run build`. <RNF>
- [x] `T-052` Frontend: `npm run lint && npm run build`. <RNF>
- [x] `T-053` Verificar flujo con servicio de agentes mockeado. <CA-02, CA-07, CA-08>
- [x] `T-054` Verificar permisos, token y tipo no soportado. <CA-09, CA-10, CA-11>
- [x] `T-055` Probar timeout del agente y feature flag desactivada. <CA-12, CA-13>
- [x] `T-056` Mapear throttling de Bedrock/OpenAI a `AGENT_RATE_LIMITED` y verificar E2E. <CA-13, RNF-05>

## Futuro

- [ ] `T-070` Extractores PDF, imagen, audio, video y web. <G-01>
- [ ] `T-071` Checkpointer Postgres y `interrupt()`. <G-02>
- [ ] `T-072` Búsqueda de imágenes relacionadas. <G-03>
- [ ] `T-057` Aprovisionar cuota de Bedrock o una API key válida de OpenCode Go para ejecución real. <G-04>
