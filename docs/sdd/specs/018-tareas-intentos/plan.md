# Plan 018 · Tareas, intentos y revisión

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-15` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se modela una tarea como `QuizAssignment` sobre un quiz publicado, con estudiantes asignados, fechas e intentos. El estudiante inicia un `QuizAttempt`, guarda respuestas y envía. MC/VF se autocorrigen; respuesta corta se califica manualmente. El docente publica resultados. La privacidad limita a cada estudiante a sus propios intentos.

## 2. Contexto técnico actual

- `Quiz` es un recurso de la spec 017.
- `ProjectMember` incluye `STUDENT`.
- `ProjectAccessGuard` resuelve proyecto por assignment/attempt.
- `PermissionsService` aplica roles de proyecto.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | `QuizAssignment` separada del recurso quiz. | Incluir fechas en Quiz. | Reutilizar un quiz en varias tareas. |
| D-02 | Autocorrección MC/VF; manual short answer. | Todo manual. | Balance esfuerzo/calidad. |
| D-03 | Resultados publicados explícitamente. | Mostrar siempre. | Permite revisar antes de compartir. |
| D-04 | Notas privadas por estudiante. | Ranking público. | Privacidad académica. |
| D-05 | Editor puede asignar y calificar. | Solo Owner. | El editor gestiona contenido. |
| D-06 | Sin grupos en v1. | Secciones. | Alcance acotado. |

## 4. Cambios por capa

### Datos

- `QuizAssignment`, `QuizAssignmentStudent`, `QuizAttempt`, `QuizAnswer`.
- Enums de estado de tarea e intento.
- Rollback: eliminar tablas; se pierden intentos y calificaciones.

### Backend

- `QuizAssignmentsService` con creación, publicación, cierre, intentos, respuestas, envío, resultados y calificación.
- `QuizAssignmentsController`.
- Proyección saneada del quiz para estudiantes.
- Cálculo de puntaje y estado `SUBMITTED`/`GRADED`.

### Frontend

- `/assignments` con tareas del estudiante.
- `/assignments/[assignmentId]` para responder.
- `/projects/[projectId]/assignments` y detalle para revisión.
- Calificación manual de respuestas cortas.
- Publicación de resultados.

### Infraestructura

- Sin variables nuevas.

## 5. Contratos

Ver `spec.md` §7.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| E2E manual | Asignar, responder, autocorregir, calificar y publicar. | Script HTTP |
| Seguridad | Acceso a intento ajeno y tarea no asignada. | Revisión/HTTP |
| Regresión | Build/lint/tests. | npm |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Estudiante ve respuestas antes de tiempo | Media | Alto | Quiz saneado y publicación explícita. |
| Intento duplicado | Media | Medio | Límite por assignment y unique por número. |
| Cálculo incorrecto | Baja | Alto | Recálculo al calificar y tests pendientes. |
| Doble envío | Baja | Medio | Estado `IN_PROGRESS` obligatorio. |

## 8. Rollback

Revertir migración elimina tareas, intentos y respuestas. El contenido de quizzes queda intacto. La UI de tareas deja de estar disponible.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | Modelos de assignment/attempt/answer |
| `src/modules/quiz-assignments/*` | Servicio, controlador y DTOs |
| `src/common/guards/project-access.guard.ts` | Resolver assignment/attempt |
| `infinipaper-frontend/app/assignments/*` | Flujo estudiante |
| `infinipaper-frontend/app/projects/[projectId]/assignments/*` | Revisión docente |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01–RF-07 | T-010, T-020, T-021 |
| RF-08–RF-13 | T-022, T-030, T-031 |
| CA-01–CA-10 | T-040, T-041 |
