# Secuencia 018 · Tareas, intentos y revisión

> Spec: [018-tareas-intentos](../../specs/018-tareas-intentos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor D as Docente / Editor
  actor S as Estudiante
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL

  D->>FE: Asigna el cuestionario
  FE->>API: POST /quizzes/:quizId/assignments
  API->>DB: Crea QuizAssignment + estudiantes asignados
  D->>FE: Publica la tarea
  FE->>API: POST /assignments/:id/publish
  API->>DB: status=PUBLISHED
  API-->>FE: Tarea publicada

  S->>FE: Abre "Mis tareas"
  FE->>API: GET /assignments/mine
  API->>DB: Consulta tareas publicadas del estudiante
  API-->>FE: Lista de tareas

  S->>FE: Inicia un intento
  FE->>API: POST /assignments/:id/attempts
  API->>DB: Valida fechas, cupo y crea QuizAttempt IN_PROGRESS
  API-->>FE: Intento + quiz saneado

  S->>FE: Responde
  FE->>API: PATCH /attempts/:id/answers
  API->>DB: Upsert QuizAnswer

  S->>FE: Envía la tarea
  FE->>API: POST /attempts/:id/submit
  API->>DB: Autocorrige MC/VF; short answer queda pendiente
  API-->>FE: Intento SUBMITTED o GRADED

  D->>FE: Revisa resultados
  FE->>API: GET /assignments/:id/results
  API-->>FE: Intentos y respuestas
  D->>FE: Califica respuesta corta
  FE->>API: PATCH /attempts/:id/answers/:answerId/grade
  API->>DB: pointsAwarded + feedback + recálculo de score
  D->>FE: Publica resultados
  FE->>API: POST /assignments/:id/publish-results
  API->>DB: resultsPublishedAt
  S->>FE: Consulta su intento
  FE->>API: GET /attempts/:id
  API-->>FE: Resultado visible
```

## Notas

- Opción múltiple y verdadero/falso se autocorrigen al enviar.
- La respuesta corta requiere calificación manual y feedback.
- Cada estudiante solo ve sus propios intentos; el docente/editor ve los del proyecto.
- Los resultados no se muestran al estudiante hasta que el docente los publica.
- El límite de intentos se valida en el servidor.
