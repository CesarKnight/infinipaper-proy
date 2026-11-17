# Tasks 017 · Cuestionarios como recursos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Confirmar modelo Resource+Quiz y tipos de pregunta. <D-01–D-03>

## Fase 1 · Datos

- [x] `T-010` Añadir `ResourceKind.QUIZ` y modelos de quiz. <RF-01, RF-03>
- [x] `T-011` Migración y Prisma Client. <RNF-01>

## Fase 2 · Backend

- [x] `T-020` Crear quiz como recurso y snapshot JSON. <RF-01, RF-09>
- [x] `T-021` Implementar preguntas y opciones. <RF-03–RF-05>
- [x] `T-022` Implementar publicar, archivar y duplicar. <RF-07, RF-10>
- [x] `T-023` Filtrar quizzes no asignados para estudiantes. <RF-08>
- [x] `T-024` Bloquear descarga del snapshot a estudiantes. <RNF-03>
- [x] `T-025` Integrar listado de recursos y `quizId` en guard. <RF-02>

## Fase 3 · Frontend

- [x] `T-030` Icono y diálogo de nuevo cuestionario. <RF-02>
- [x] `T-031` Panel de quiz y enlace al editor. <CA-01–CA-05>
- [x] `T-032` Editor de preguntas y publicación. <CA-02, CA-04>
- [x] `T-033` Ocultar descarga del snapshot. <RNF-03>

## Fase 4 · Verificación

- [x] `T-040` E2E: crear quiz, preguntas, publicar y ver como estudiante asignado. <CA-01–CA-05>
- [x] `T-041` Verificar que el estudiante no ve `isCorrect` ni `correctText`. <CA-05>
- [x] `T-042` Backend y frontend lint/build/tests. <RNF>

- [x] `T-044` Diagramas Mermaid, casos de uso y modelo EA actualizados. <RNF>

## Brechas

- [ ] `T-060` UI para duplicar y archivar quizzes. <G-01>
- [ ] `T-061` Edición individual de preguntas existentes. <G-02>
- [ ] `T-062` Tests automatizados de quiz y snapshot. <G-03>
- [ ] `T-063` Banco de preguntas e importación QTI/Moodle. <G-04>
