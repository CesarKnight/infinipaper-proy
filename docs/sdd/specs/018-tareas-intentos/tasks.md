# Tasks 018 · Tareas, intentos y revisión

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Confirmar modelo de tarea, autocorrección y privacidad. <D-01–D-06>

## Fase 1 · Datos

- [x] `T-010` Añadir assignment, estudiantes asignados, intentos y respuestas. <RF-01–RF-04>
- [x] `T-011` Migración y Prisma Client. <RNF>

## Fase 2 · Backend

- [x] `T-020` Crear/publicar/cerrar tareas. <RF-01–RF-03>
- [x] `T-021` Listar tareas del estudiante y detalle. <RF-04>
- [x] `T-022` Iniciar intento, guardar respuestas y enviar. <RF-05–RF-07>
- [x] `T-023` Autocorrección MC/VF. <RF-08>
- [x] `T-024` Calificación manual de respuesta corta y feedback. <RF-09>
- [x] `T-025` Resultados por estudiante y publicación. <RF-10–RF-13>
- [x] `T-026` Resolver assignment/attempt en `ProjectAccessGuard`. <RNF-04>

## Fase 3 · Frontend

- [x] `T-030` Página “Mis tareas”. <CA-01, CA-02>
- [x] `T-031` Pantalla de intento con autosave y envío. <CA-04–CA-07>
- [x] `T-032` Revisión docente por tarea. <CA-08>
- [x] `T-033` Calificación de respuestas cortas. <CA-08>
- [x] `T-034` Publicar resultados y vista del estudiante. <CA-09, CA-10>

## Fase 4 · Verificación

- [x] `T-040` E2E: asignar, responder, autocorregir 2/3, calificar 3/3 y publicar. <CA-01–CA-09>
- [x] `T-041` Verificar que el quiz del estudiante no incluye respuestas correctas. <CA-09>
- [x] `T-042` Backend y frontend lint/build/tests. <RNF>

- [x] `T-044` Diagramas Mermaid, casos de uso y modelo EA actualizados. <RNF>

## Brechas

- [ ] `T-060` Selector granular de estudiantes y fechas al asignar. <G-01>
- [ ] `T-061` Reabrir tarea y gestión de intentos. <G-02>
- [ ] `T-062` Tests automatizados de scoring y permisos. <G-03>
- [ ] `T-063` Grupos, secciones y entrega tardía. <G-04>
