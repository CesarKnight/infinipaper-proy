# Tasks 013 · Creación de cuestionarios tarea (HU12)

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Aprobado` |

## Fase 0 · Preparación

- [x] `T-001` Definir estructura relacional de cuestionarios, preguntas y opciones. <D-01>
- [x] `T-002` Definir contrato de error `TEACHER_ROLE_REQUIRED` y validación de respuestas. <CA-02, CA-03>

## Fase 1 · Datos

- [ ] `T-010` Crear modelos `Quiz`, `QuizQuestion`, `QuizOption` y enum `QuizStatus` en `schema.prisma` y ejecutar migración. <RF-02, RF-03, RF-04>

## Fase 2 · Backend

- [ ] `T-011` Crear `QuizzesModule`, `QuizzesController` y `QuizzesService` registrados en `AppModule`. <RF-01>
- [ ] `T-012` Crear `CreateQuizDto` con validación anidada y verificar `isTeacher = true` + rol de proyecto. <RF-01, RF-02, RF-03, CA-01, CA-02, CA-03>
- [ ] `T-013` Implementar `GET /projects/:projectId/quizzes` y `GET .../quizzes/:quizId` ocultando `isCorrect` a estudiantes. <RF-04, RF-05, RNF-02>

## Fase 3 · Frontend

- [ ] `T-020` Añadir tipos de cuestionarios en `lib/types.ts` y llamadas HTTP en `lib/api.ts`. <RF-05>
- [ ] `T-021` Mostrar listado de cuestionarios en el workspace del proyecto. <RF-04>
- [ ] `T-022` Crear formulario dinámico en `/projects/[projectId]/(workspace)/quizzes/new` (visible solo si `isTeacher = true`). <RF-01, RF-02, RF-03>

## Fase 4 · Verificación

- [ ] `T-030` Verificar creación por docente, bloqueo a no docentes y ocultamiento de `isCorrect`. <CA-01, CA-02, CA-03, RNF-02>
- [ ] `T-031` Backend: `npm run lint && npm run build`. <RNF>
- [ ] `T-032` Frontend: `npm run lint && npm run build`. <RNF>

## Verificación final

- [ ] Criterios funcionales cubiertos.
- [ ] Sin migraciones pendientes.
- [ ] Documentación de referencia actualizada.
