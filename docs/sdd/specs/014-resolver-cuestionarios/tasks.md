# Tasks 014 · Resolver cuestionarios (HU13)

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Aprobado` |

## Fase 0 · Preparación

- [x] `T-001` Definir unicidad de un intento por usuario y cuestionario. <D-01, RNF-02>
- [x] `T-002` Definir errores `QUIZ_ALREADY_SUBMITTED`, `QUIZ_EXPIRED` y `QUIZ_NOT_PUBLISHED`. <CA-02, CA-03>

## Fase 1 · Datos

- [ ] `T-010` Crear modelos `QuizSubmission` y `QuizAnswer` con `@@unique([quizId, userId])` en `schema.prisma` y ejecutar migración. <RF-02, RNF-02>

## Fase 2 · Backend

- [ ] `T-011` Crear `SubmitQuizDto` validando arreglo de respuestas (`questionId`, `selectedOptionId`). <RF-01>
- [ ] `T-012` Implementar `POST /projects/:projectId/quizzes/:quizId/submit` con calificación automática en transacción. <RF-01, RF-02, RF-04, RNF-01, CA-01, CA-02>
- [ ] `T-013` Validar estado `PUBLISHED` y fecha límite `dueDate` antes de aceptar envíos. <RF-03, CA-03>
- [ ] `T-014` Implementar `GET /projects/:projectId/quizzes/:quizId/my-submission` para consultar nota y aciertos. <RF-05>

## Fase 3 · Frontend

- [ ] `T-020` Añadir tipos `QuizSubmission` y `QuizAnswer` en `lib/types.ts` y métodos en `lib/api.ts`. <RF-05>
- [ ] `T-021` Crear pantalla interactiva `/projects/[projectId]/(workspace)/quizzes/[quizId]` para resolver y ver calificación. <RF-01, RF-05, CA-01>

## Fase 4 · Verificación

- [ ] `T-030` Verificar resolución, cálculo de nota, rechazo de segundo intento y fecha vencida. <CA-01, CA-02, CA-03>
- [ ] `T-031` Backend: `npm run lint && npm run build`. <RNF>
- [ ] `T-032` Frontend: `npm run lint && npm run build`. <RNF>

## Verificación final

- [ ] Criterios funcionales cubiertos.
- [ ] Sin migraciones pendientes.
- [ ] Documentación de referencia actualizada.
