# Tasks 016 · Proyectos académicos y archivado

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Confirmar tipo de proyecto, rol Student y plazo de archivo. <D-01–D-05>

## Fase 1 · Datos

- [x] `T-010` Añadir enums y campos académicos a `Project`. <RF-01–RF-03>
- [x] `T-011` Añadir `STUDENT` a `ProjectRole`. <RF-05>
- [x] `T-012` Migración y Prisma Client. <RNF-04>

## Fase 2 · Backend

- [x] `T-020` Validar creación de curso por docente verificado. <RF-02, RF-03>
- [x] `T-021` Añadir campos académicos a creación/listado/detalle. <RF-01–RF-04>
- [x] `T-022` Implementar archivar, extender y restaurar. <RF-07–RF-09>
- [x] `T-023` Implementar purga vencida y cola pg-boss. <RF-10, RF-11>
- [x] `T-024` Implementar bloqueo de escritura en archivados. <RF-07>
- [x] `T-025` Ocultar archivados de listados públicos. <RF-12>
- [x] `T-026` Endpoint admin de purga manual. <RNF-01>

## Fase 3 · Frontend

- [x] `T-030` Crear proyectos personales/curso con campos. <CA-01, CA-02>
- [x] `T-031` Badges de tipo y estado. <RF-01, RF-07>
- [x] `T-032` Acciones de archivar/extender/restaurar. <CA-05–CA-07>
- [x] `T-033` Rol Estudiante en participantes. <CA-04>

## Fase 4 · Verificación

- [x] `T-040` E2E: curso, estudiantes, archivar, bloquear escritura, extender/restaurar. <CA-01–CA-07>
- [x] `T-041` E2E de purga manual con archivo vencido. <CA-08>
- [x] `T-042` Backend y frontend lint/build/tests. <RNF>

- [x] `T-044` Diagramas Mermaid, casos de uso y modelo EA actualizados. <RNF>

## Brechas

- [ ] `T-060` Edición de metadatos académicos después de crear. <G-01>
- [ ] `T-061` Selector de días para extender archivo. <G-02>
- [ ] `T-062` Tests automatizados de purga y guards. <G-03>
- [ ] `T-063` Matrícula SIS y múltiples docentes propietarios. <G-04>
