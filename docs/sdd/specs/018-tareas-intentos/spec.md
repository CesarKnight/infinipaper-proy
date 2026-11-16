# Spec 018 · Tareas, intentos y revisión

| Campo | Valor |
|---|---|
| ID | `018` |
| Estado | `Borrador` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `016`, `017` |

## 1. Contexto y problema

Un cuestionario publicado no es todavía una tarea. Falta asignarlo a estudiantes, definir fechas, permitir intentos, corregir respuestas y publicar resultados.

Sin este ciclo, el docente no puede evaluar y el estudiante no puede completar una entrega. Además, los perfiles son abiertos entre docentes y estudiantes, pero las notas deben seguir siendo privadas: cada estudiante ve solo sus resultados y el docente ve todo su proyecto.

## 2. Objetivo

> Como **docente o editor**, quiero **asignar un cuestionario como tarea y revisar el desempeño por estudiante** para **evaluar el aprendizaje y dar retroalimentación**.
>
> Como **estudiante**, quiero **responder mis tareas asignadas y consultar mis resultados** para **completar el curso y aprender de mis errores**.

## 3. Alcance

### Incluye

- `QuizAssignment` como tarea de un cuestionario.
- Asignación a estudiantes del proyecto.
- Fechas de inicio y cierre, intentos permitidos y estado.
- Intento de estudiante con autosave y envío.
- Calificación automática de opción múltiple y verdadero/falso.
- Calificación manual y feedback para respuesta corta.
- Publicación de resultados.
- Privacidad de notas.

### No incluye

- Grupos o subconjuntos de estudiantes.
- Entregas fuera de plazo con penalización automática.
- Evaluación entre pares.
- Rúbricas complejas.
- Exportación de resultados; vive en `019`.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El docente/editor puede asignar un cuestionario publicado como tarea. | Must |
| RF-02 | La tarea define inicio, cierre, intentos permitidos y estado `DRAFT`, `PUBLISHED`, `CLOSED`. | Must |
| RF-03 | Solo los estudiantes inscritos en el proyecto pueden ser asignados. | Must |
| RF-04 | El estudiante ve solo tareas publicadas y asignadas a él. | Must |
| RF-05 | El estudiante puede iniciar un intento si está dentro de fechas y le quedan intentos. | Must |
| RF-06 | Las respuestas se guardan con autosave y el intento se envía explícitamente. | Must |
| RF-07 | No se puede editar un intento enviado o una tarea cerrada. | Must |
| RF-08 | Opción múltiple y verdadero/falso se califican automáticamente. | Must |
| RF-09 | Respuesta corta requiere calificación manual y feedback. | Must |
| RF-10 | El docente/editor ve todos los intentos de su proyecto; el estudiante solo los propios. | Must |
| RF-11 | El docente decide cuándo publicar resultados y respuestas correctas. | Must |
| RF-12 | La tarea cerrada no acepta nuevos intentos, pero conserva resultados. | Must |
| RF-13 | Un estudiante no puede ver notas de otros estudiantes. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Autosave no pierde respuestas ante recarga. | Test de intento y recarga. |
| RNF-02 | El envío es idempotente. | Test de doble submit. |
| RNF-03 | La corrección automática es determinista. | Tests de scoring. |
| RNF-04 | Los permisos se aplican en servidor. | Tests de acceso cruzado. |
| RNF-05 | La UI muestra tiempo restante, intentos y estado. | Revisión visual y build. |

## 6. Criterios de aceptación

### CA-01 · Crear tarea

- **Dado** un cuestionario publicado,
- **cuando** el docente lo asigna a estudiantes con fechas,
- **entonces** se crea una tarea en `DRAFT` con los asignados.

### CA-02 · Publicar tarea

- **Dado** una tarea en `DRAFT`,
- **cuando** el docente la publica,
- **entonces** los estudiantes asignados la ven en “Mis tareas”.

### CA-03 · Estudiante no asignado

- **Dado** un estudiante no asignado,
- **cuando** intenta abrir la tarea,
- **entonces** recibe `TASK_NOT_ASSIGNED` · 403.

### CA-04 · Intento válido

- **Dado** un estudiante dentro de fechas y con intentos disponibles,
- **cuando** inicia el intento,
- **entonces** se crea un `QuizAttempt` y puede responder.

### CA-05 · Autosave

- **Dado** un intento en curso,
- **cuando** el estudiante guarda una respuesta y recarga,
- **entonces** la respuesta sigue presente.

### CA-06 · Bloqueo tras envío

- **Dado** un intento enviado,
- **cuando** el estudiante intenta editar,
- **entonces** recibe `ATTEMPT_SUBMITTED` · 409.

### CA-07 · Calificación automática

- **Dado** un intento con opción múltiple y verdadero/falso,
- **cuando** se envía,
- **entonces** el sistema calcula el puntaje automático.

### CA-08 · Calificación manual

- **Dado** un intento con respuesta corta,
- **cuando** el docente califica,
- **entonces** se guarda puntaje y feedback.

### CA-09 · Privacidad de notas

- **Dado** un estudiante autenticado,
- **cuando** consulta resultados,
- **entonces** solo ve sus intentos y notas, nunca los de otros.

### CA-10 · Cierre

- **Dado** una tarea con fecha de cierre vencida,
- **cuando** el estudiante intenta iniciar otro intento,
- **entonces** recibe `TASK_CLOSED` · 409.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/quizzes/:quizId/assignments` | Editor+ | `{ studentIds, startsAt, dueAt, attemptsAllowed }` | `QuizAssignment` |
| `POST` | `/api/v1/assignments/:id/publish` | Editor+ | — | `QuizAssignment` |
| `POST` | `/api/v1/assignments/:id/close` | Editor+ | — | `QuizAssignment` |
| `GET` | `/api/v1/assignments/mine` | Estudiante | — | Tareas asignadas |
| `POST` | `/api/v1/assignments/:id/attempts` | Estudiante asignado | — | `QuizAttempt` |
| `PATCH` | `/api/v1/attempts/:id/answers` | Estudiante dueño | `{ questionId, optionId?, text? }` | `QuizAnswer` |
| `POST` | `/api/v1/attempts/:id/submit` | Estudiante dueño | — | `QuizAttempt` |
| `GET` | `/api/v1/assignments/:id/results` | Editor+ | — | Resultados por estudiante |
| `GET` | `/api/v1/attempts/:id` | Dueño / Editor+ | — | Intento con respuestas |
| `PATCH` | `/api/v1/answers/:id/grade` | Editor+ | `{ points, feedback }` | `QuizAnswer` |
| `POST` | `/api/v1/assignments/:id/publish-results` | Editor+ | — | `QuizAssignment` |

### Datos

- `QuizAssignment`: `quizId`, `projectId`, `startsAt`, `dueAt`, `attemptsAllowed`, `status`, `resultsPublishedAt`.
- `QuizAssignmentStudent`: asignación many-to-many.
- `QuizAttempt`: `assignmentId`, `studentId`, `attemptNumber`, `status`, `score`, `maxScore`, `startedAt`, `submittedAt`.
- `QuizAnswer`: `attemptId`, `questionId`, `optionId?`, `text?`, `isCorrect?`, `pointsAwarded?`, `feedback?`.

### UI

- “Mis tareas” para estudiantes con estado, fecha e intentos.
- Pantalla de intento con temporizador, autosave y confirmación de envío.
- Vista de revisión por estudiante para docentes.
- Resultado propio con feedback y respuestas correctas cuando se publiquen.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Tarea fuera de fecha | Rechazar intento | `TASK_CLOSED` · 409 |
| Sin intentos restantes | Rechazar intento | `ATTEMPT_LIMIT_REACHED` · 409 |
| Intento de otro estudiante | No revelar | `ATTEMPT_FORBIDDEN` · 403 |
| Respuesta a pregunta inexistente | Rechazar | `QUESTION_NOT_FOUND` · 404 |
| Envío duplicado | Devolver el intento ya enviado | `ATTEMPT_SUBMITTED` · 409 |
| Calificar sin respuesta corta | Rechazar | `INVALID_GRADING` · 422 |
| Publicar resultados antes de calificar | Advertir y permitir solo si no hay pendientes | `GRADING_PENDING` · 409 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | La tarea se modela como `QuizAssignment`, separada del recurso cuestionario. | Cerrada |
| D-02 | Opción múltiple y verdadero/falso se autocorrigen; respuesta corta es manual. | Cerrada |
| D-03 | Cada estudiante ve solo sus notas; docentes/editores ven todo su proyecto. | Cerrada |
| D-04 | Los resultados se publican explícitamente. | Cerrada |
| D-05 | El editor puede crear, asignar y calificar; el Owner controla el curso. | Cerrada |
| Q-01 | ¿Se permite puntaje parcial? | Abierta (v1: no) |
| Q-02 | ¿Se permite reabrir una tarea cerrada? | Abierta (v1: solo Owner) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin grupos ni secciones. | La asignación es individual. | `T-060` |
| G-02 | Sin entrega tardía con penalización. | El cierre bloquea nuevos intentos. | `T-061` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| — | Pendiente de implementación. | — |

> Plan y tareas: se crearán cuando esta spec pase a `Aprobada`.
