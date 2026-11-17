# Tasks 021 · Mapas mentales

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Datos y agentes

- [x] `T-010` Añadir `MINDMAP`, `ContentGenerationJob` y migración. <RF-03, RF-04>
- [x] `T-011` Endpoint de agentes y validación JSON. <RF-10, RNF-01>

## Backend

- [x] `T-020` Resolver fuentes y crear job asíncrono. <RF-01, RF-02>
- [x] `T-021` Persistir mapa como recurso y procedencia. <RF-03–RF-07>
- [x] `T-022` Consulta y reintento de jobs fallidos. <RF-09>
- [x] `T-023` Aplicar permisos y bloqueo de archivados. <RF-08, CA-05>

## Frontend

- [x] `T-030` Diálogo “Mapa mental IA” y polling. <RF-01, RF-02>
- [x] `T-031` Visor de mapa con nodos y aristas. <RF-05, CA-03>
- [x] `T-032` Badges de procedencia y validación. <RF-07>

## Verificación

- [x] `T-040` E2E de generación y visualización.
- [x] `T-041` Lint, tests, pyright y build.
- [x] `T-042` Actualizar spec y documentación.
- [x] `T-044` Diagramas Mermaid y modelo EA actualizados. <RNF>

## Brechas

- [ ] `T-060` Exportación PNG/SVG. <G-01>
- [ ] `T-061` Edición manual de nodos. <G-02>
- [ ] `T-062` Layout avanzado para mapas grandes. <G-03>
