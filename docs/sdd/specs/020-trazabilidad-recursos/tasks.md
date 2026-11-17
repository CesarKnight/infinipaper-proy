# Tasks 020 · Trazabilidad

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Datos

- [x] `T-010` Añadir origen, validación y `ResourceSource`. <RF-01–RF-05>
- [x] `T-011` Migración y Prisma Client. <RNF-01>

## Backend

- [x] `T-020` Implementar `ProvenanceService` y endpoints. <RF-01–RF-05, RF-11>
- [x] `T-021` Asignar origen a creaciones existentes. <RF-01, RF-09>
- [x] `T-022` Filtros de listado y auditoría. <RF-07, RF-11>
- [x] `T-023` Validar permisos de Owner/Editor. <RF-04, RNF-03>

## Frontend

- [x] `T-030` Badges de origen y validación. <RF-06>
- [x] `T-031` Filtros de carpeta. <RF-07>
- [x] `T-032` Panel de procedencia y advertencia de fuentes. <RF-08>

## Verificación

- [x] `T-040` E2E de procedencia y validación.
- [x] `T-041` Lint, tests y build.
- [x] `T-042` Actualizar spec y documentación.
- [x] `T-044` Diagramas Mermaid y modelo EA actualizados. <RNF>

## Brechas

- [ ] `T-060` Historial de versiones del contenido. <G-01>
- [ ] `T-061` Verificación externa automática. <G-02>
- [ ] `T-062` Notificación al autor rechazado. <G-03>
