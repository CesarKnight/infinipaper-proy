# Secuencia 019 · Panel docente y progreso

> Spec: [019-panel-docente](../../specs/019-panel-docente/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor D as Docente / Owner
  actor S as Estudiante
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL

  D->>FE: Abre el panel del proyecto
  FE->>API: GET /projects/:id/analytics?assignmentId=&studentId=
  API->>DB: Consulta assignments, intentos y respuestas
  API->>API: Agrega notas, completitud, riesgo y preguntas
  API-->>FE: Resumen, tareas, estudiantes y dificultad

  D->>FE: Exporta CSV
  FE->>API: GET /projects/:id/analytics/export
  API-->>FE: text/csv con los filtros activos

  S->>FE: Abre "Mi progreso"
  FE->>API: GET /projects/:id/my-progress
  API->>DB: Consulta solo los intentos del estudiante
  API-->>FE: Tareas y notas propias
```

## Notas

- El panel general exige Owner/Editor; el estudiante usa su propia vista.
- Se usa el último intento enviado o calificado por tarea y estudiante.
- Las tareas sin intentos se muestran como pendientes sin dividir por cero.
- El umbral de riesgo se configura con `PROJECT_RISK_THRESHOLD`.
