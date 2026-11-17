# Tasks 022 · Cuestionarios con IA

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Backend

- [x] `T-010` Endpoint de generación con fuente, cantidad, dificultad y tipos. <RF-01, RF-02>
- [x] `T-020` Job asíncrono y agente de cuestionarios. <RF-03, RF-08>
- [x] `T-021` Crear recurso QUIZ y Quiz DRAFT. <RF-04, RF-06>
- [x] `T-022` Guardar fuentes por pregunta y deduplicar. <RF-05, RF-11>
- [x] `T-023` Validar esquema y errores del agente. <RF-09, RNF-01>
- [x] `T-024` No publicar automáticamente. <RF-06, CA-06>

## Frontend

- [x] `T-030` Acción “Quiz IA” y configuración. <RF-01, RF-02>
- [x] `T-031` Polling y apertura del borrador. <RF-03>
- [x] `T-032` Revisión y edición con el editor existente. <RF-07>
- [x] `T-033` Mostrar fuentes por pregunta y aviso de borrador. <RNF-04>

## Verificación

- [x] `T-040` E2E de generación, asignación, intento y panel.
- [x] `T-041` Lint, tests, pyright y build.
- [x] `T-042` Actualizar spec y documentación.
- [x] `T-044` Diagramas Mermaid y modelo EA actualizados. <RNF>

## Brechas

- [ ] `T-060` Evaluación pedagógica automática. <G-01>
- [ ] `T-061` Generación desde PDFs. <G-02>
- [ ] `T-062` Edición avanzada de fuentes por pregunta. <G-03>
