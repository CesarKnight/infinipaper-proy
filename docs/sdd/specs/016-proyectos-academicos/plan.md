# Plan 016 · Proyectos académicos y archivado

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-15` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se extiende `Project` con tipo, estado y metadatos académicos. Los cursos solo pueden crearlos docentes verificados. `ProjectMember` admite `STUDENT`. El Owner puede archivar, extender y restaurar; un job de pg-boss purga los archivos vencidos. Los guards bloquean escrituras en proyectos archivados para participantes que no son Owner.

## 2. Contexto técnico actual

- `Project` era genérico y no tenía ciclo de archivado.
- `PermissionsService` resolvía Owner/Editor/Viewer.
- `pg-boss` ya se usa para la cola de estructuración.
- `StorageService` elimina objetos de MinIO.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | Extender `Project` en v1. | Crear `Course`. | Menos migración y reutiliza carpetas/recursos. |
| D-02 | `ProjectRole.STUDENT` en `ProjectMember`. | Entidad `Enrollment` separada. | El usuario pidió explícitamente Student en miembros. |
| D-03 | Archivado 30 días ampliable. | Borrado inmediato. | Permite consulta temporal. |
| D-04 | Purga hard delete de proyecto y archivos. | Conservar proyecto vacío. | El requisito pide eliminar completamente los archivos. |
| D-05 | Owner conserva escritura; demás participantes solo lectura. | Bloquear también al Owner. | El Owner necesita restaurar y gestionar. |
| D-06 | Cola pg-boss horaria + endpoint admin manual. | Cron del sistema. | Reutiliza infraestructura existente. |

## 4. Cambios por capa

### Datos

- `Project.type`, `status`, `institution`, `period`, `subject`, `code`, `archivedAt`, `archiveAccessUntil`.
- `ProjectRole.STUDENT`.
- Rollback: volver a `PERSONAL/ACTIVE`, eliminar columnas y el valor `STUDENT`.

### Backend

- `ProjectsService`: validación de curso, archivado, extensión, restauración y purga.
- `ProjectPurgeQueueService` con `pg-boss.schedule`.
- `AdminProjectsController` para purga manual.
- `PermissionsService` bloquea escrituras archivadas.
- `MembersService` acepta estudiantes.

### Frontend

- Selector Personal/Curso y campos académicos al crear.
- Badges de tipo/estado en tarjetas.
- Acciones de archivar/extender/restaurar en configuración.
- Rol Estudiante en participantes.

### Infraestructura

- `PROJECT_ARCHIVE_ACCESS_DAYS`, `PROJECT_PURGE_CRON`.
- No se añaden dependencias.

## 5. Contratos

Ver `spec.md` §7. Los endpoints de archivo usan `423 PROJECT_ARCHIVED`.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| E2E manual | Curso, estudiantes, archivar, bloqueo, extender, restaurar, purgar. | Script HTTP + psql |
| Unitario | Pendiente para purga/guard. | Vitest |
| Regresión | Build/lint/tests. | npm |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Purga borra datos por error | Baja | Alto | Solo proyectos `ARCHIVED` vencidos; auditoría y endpoint admin. |
| S3 falla a medias | Media | Alto | Se conserva el proyecto si algún borrado falla. |
| Owner escribe en archivado | Baja | Bajo | Decisión D-05 explícita. |

## 8. Rollback

Revertir la migración y desactivar la cola. Los proyectos archivados vuelven a `ACTIVE` si se restaura el valor por defecto. Los archivos ya purgados no son recuperables.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | Enums y campos de proyecto |
| `src/modules/projects/*` | Archivado, purga y admin |
| `src/common/permissions/permissions.service.ts` | Bloqueo de escritura |
| `src/common/guards/project-access.guard.ts` | Resolución de quiz/assignment/attempt |
| `infinipaper-frontend/app/projects/page.tsx` | Crear curso |
| `infinipaper-frontend/app/projects/[projectId]/settings/page.tsx` | Archivar/restaurar |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01–RF-06 | T-010, T-020, T-021 |
| RF-07–RF-11 | T-022, T-023, T-030 |
| RF-12–RF-14 | T-024, T-040 |
| CA-01–CA-10 | T-040, T-041 |
