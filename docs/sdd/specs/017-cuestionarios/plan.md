# Plan 017 · Cuestionarios como recursos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-15` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se añade `ResourceKind.QUIZ` y un modelo `Quiz` 1:1 con el recurso. Las preguntas y opciones viven en tablas relacionales; se guarda un snapshot JSON en MinIO para exportación/versionado. El cuestionario aparece en la carpeta como un recurso, puede publicarse, archivarse y duplicarse. Los estudiantes solo lo ven si están asignados a una tarea publicada.

## 2. Contexto técnico actual

- `Resource` ya representa archivos y apuntes.
- `ResourcesService` lista recursos por carpeta y sirve contenido.
- `ProjectAccessGuard` resuelve el proyecto por carpeta/recurso.
- `StorageService` permite guardar snapshots.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | `Resource(kind=QUIZ)` + `Quiz` relacional. | Quiz fuera de la jerarquía. | Requisito de “archivo más”. |
| D-02 | Snapshot JSON en S3, preguntas en tablas. | Solo JSON. | Facilita intentos, calificación y métricas. |
| D-03 | Tipos MC, V/F y respuesta corta. | Solo MC. | Cubre evaluación básica. |
| D-04 | Borradores solo para docentes/editores. | Visible para todos. | Evita filtrar evaluaciones. |
| D-05 | Estudiantes solo ven quizzes asignados y publicados. | Todos los publicados. | Decisión de producto. |
| D-06 | Bloquear descarga del snapshot a estudiantes. | Servir JSON como archivo. | Evita filtrar respuestas correctas. |

## 4. Cambios por capa

### Datos

- `ResourceKind.QUIZ`.
- `Quiz`, `QuizQuestion`, `QuizOption`.
- Snapshot en `Resource.s3Key`.
- Rollback: eliminar tablas y valor de enum; los recursos quiz no existirían.

### Backend

- `QuizzesService` con CRUD, publicación, archivo, duplicado y snapshot.
- `QuizzesController` con permisos de editor.
- `ProjectAccessGuard` resuelve `quizId`.
- `ResourcesService` filtra quizzes por asignación para estudiantes y bloquea contenido JSON.
- `ResourcesService.remove` impide borrar quizzes con intentos.

### Frontend

- Icono y badge de cuestionario en recursos.
- Diálogo “Nuevo cuestionario”.
- Panel de quiz en el visor.
- Página de edición con preguntas y publicación.

### Infraestructura

- Sin variables nuevas; usa MinIO existente.

## 5. Contratos

Ver `spec.md` §7.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| E2E manual | Crear, publicar, ver como estudiante asignado y asignar tarea. | Script HTTP |
| Seguridad | Estudiante no asignado; snapshot bloqueado. | Revisión/HTTP |
| Regresión | Build/lint/tests. | npm |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Snapshot filtra respuestas | Media | Alto | Bloqueo de descarga y sanitización en API. |
| Divergencia JSON/tablas | Baja | Medio | Snapshot se regenera en cada cambio. |
| Borrado con intentos | Baja | Alto | Se impide el borrado físico. |

## 8. Rollback

Revertir migración y eliminar recursos quiz. Los snapshots en MinIO deben borrarse con el recurso. Los intentos se pierden si se revierte la tabla.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | Enums y modelos de quiz |
| `src/modules/quizzes/*` | Servicio, controlador y DTOs |
| `src/modules/resources/*` | Filtro, include y bloqueo |
| `src/common/guards/project-access.guard.ts` | Resolver quizId |
| `infinipaper-frontend/components/project/resource-list.tsx` | Crear/icono quiz |
| `infinipaper-frontend/components/quiz/quiz-panel.tsx` | Visor |
| `infinipaper-frontend/app/projects/[projectId]/quizzes/[quizId]/page.tsx` | Editor |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01–RF-05 | T-010, T-020, T-021 |
| RF-06–RF-12 | T-022, T-030, T-031 |
| CA-01–CA-08 | T-040, T-041 |
