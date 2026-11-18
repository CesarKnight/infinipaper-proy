# Tasks 028 · Cola de generación y prevención de duplicados

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea tiene ID `T-NNN` y cita los requisitos o criterios que satisface.
- No se marca una tarea como hecha solo porque el código existe: debe estar verificado.
- Las tareas de brechas (`G-*`) se añaden al final y no bloquean el cierre si se aceptan explícitamente.

## Fase 0 · Preparación

- [x] `T-001` Leer spec, plan y constitución; confirmar decisiones. <RF-01–RF-18>
- [x] `T-002` Confirmar que historial, cancelación y móvil quedan fuera de v1. <G-01–G-06>

## Fase 1 · Datos

- [x] `T-010` Añadir `sourceType`, `sourceId` y `activeKey` único a `ContentGenerationJob`. <RF-06–RF-09>
- [x] `T-011` Añadir índice `[folderId, status]` y migración Prisma. <RNF-02>
- [x] `T-012` Verificar rollback de la migración. <RNF-06>

## Fase 2 · Backend

- [x] `T-020` Guardar `sourceType` y `sourceId` al crear el job. <RF-03, RF-07>
- [x] `T-021` Calcular `activeKey` canónico desde tipo, carpeta, fuente y configuración. <RF-07>
- [x] `T-022` Implementar creación idempotente con captura de violación única. <RF-06, RF-08, CA-03, CA-09>
- [x] `T-023` Implementar `listActiveByProject()` con permisos Editor+. <RF-01, RF-14>
- [x] `T-024` Crear `GET /projects/:projectId/generation-jobs` y DTO de query. <RF-01, RF-03>
- [x] `T-025` Incluir solicitante, carpeta, fuentes, etapa y progreso en la respuesta. <RF-03, RF-04>
- [x] `T-026` Limpiar `activeKey` al pasar a `DONE` o `FAILED`. <RF-09, CA-06, CA-07>
- [x] `T-027` Recalcular `activeKey` en `retry()` y rechazar duplicados. <RF-10, CA-07>
- [x] `T-028` Devolver `GENERATION_JOB_IN_PROGRESS` con `details.jobId`. <RF-06, RNF-05>
- [x] `T-029` Incluir `requestedBy` en `getJob()` para el diálogo. <RF-11>

## Fase 3 · Frontend

- [x] `T-030` Crear hook `useGenerationQueue(projectId)` con polling condicionado. <RF-02, RNF-01>
- [x] `T-031` Crear componente `GenerationQueue` con estados de carga, vacío y error. <RF-01–RF-05, RF-18>
- [x] `T-032` Integrar la cola en el layout del workspace. <RF-01, RF-17>
- [x] `T-033` Mostrar aviso de job activo en `GenerationDialog`. <RF-11>
- [x] `T-034` Deshabilitar creación de duplicado exacto y manejar 409. <RF-12, CA-03>
- [x] `T-035` Permitir configuración distinta con aviso. <RF-13, CA-04>
- [x] `T-036` Ocultar la cola para Viewer/Student. <RF-14, CA-08>
- [x] `T-037` Añadir tipos `GenerationQueueItem` y `GenerationQueueResponse`. <RF-03>
- [x] `T-038` Asegurar accesibilidad, tema y no bloqueo de scroll. <RNF-03, RNF-04, RF-17>

## Fase 4 · Pruebas y verificación

- [x] `T-040` Tests de cálculo y limpieza de `activeKey`. <CA-03, CA-06, CA-07>
- [x] `T-041` Tests de carrera de creación y restricción única. <CA-09>
- [x] `T-042` Tests de cola, permisos y 409. <CA-01, CA-03, CA-08>
- [x] `T-043` Tests de componente: cola, polling, estado vacío y aviso. <CA-01, CA-02, CA-10>
- [x] `T-044` Verificación manual con dos navegadores/editores. <CA-01–CA-07>
- [x] `T-045` Verificar que no se exponen contenidos ni prompts. <CA-12, RNF-08>
- [x] `T-046` Ejecutar lint/test/build de backend y lint/build de frontend. <RNF-01–RNF-08>

## Fase 5 · Documentación y cierre

- [x] `T-050` Actualizar spec con evidencia y estado. <RNF-01–RNF-08>
- [x] `T-051` Actualizar índice de specs y diagramas de secuencia. <RNF-01>
- [x] `T-052` Registrar brechas `G-*` y confirmar las diferidas. <G-01–G-06>

## Fase 6 · Brechas diferidas

- [ ] `T-090` Evaluar SSE/WebSocket para tiempo real. <G-01>
- [ ] `T-091` Añadir cancelación de jobs. <G-02>
- [ ] `T-092` Añadir notificaciones push/email. <G-03>
- [ ] `T-093` Mostrar historial reciente en el panel. <G-04>
- [ ] `T-094` Añadir cola a la app móvil. <G-05>
- [ ] `T-095` Añadir vista entre proyectos. <G-06>

## Verificación final

- [x] Todos los `CA-*` tienen evidencia.
- [x] No quedan tareas obligatorias pendientes.
- [x] La spec está en el estado correcto.
- [x] El plan de rollback está documentado.
