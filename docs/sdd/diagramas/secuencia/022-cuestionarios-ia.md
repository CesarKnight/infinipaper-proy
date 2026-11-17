# Secuencia 022 · Cuestionarios con IA

> Spec: [022-cuestionarios-ia](../../specs/022-cuestionarios-ia/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor D as Docente / Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss
  participant AG as Agents
  participant LLM as LLM
  participant S3 as MinIO

  D->>FE: Genera cuestionario con IA
  FE->>API: POST /folders/:id/quizzes/generate
  API->>DB: Valida fuente y crea ContentGenerationJob QUIZ
  API->>Q: Encola job
  API-->>FE: Job QUEUED

  Q->>API: Worker toma el job
  API->>S3: URLs presignadas de fuentes
  API->>AG: POST /v1/quizzes/generate
  AG->>LLM: Prompt con cantidad, dificultad y tipos
  LLM-->>AG: JSON de preguntas con fuentes
  AG->>AG: Valida, deduplica y sanea
  AG-->>API: Cuestionario validado + usage
  API->>DB: Crea Resource QUIZ + Quiz DRAFT + sourceRefs
  API->>DB: Job DONE + resultResourceId
  API-->>FE: Borrador generado

  D->>FE: Revisa y publica
  FE->>API: PUT /quizzes/:id/questions y POST /publish
  API->>DB: Guarda cambios y publica solo tras acción humana
```

## Notas

- El resultado siempre nace `DRAFT` y `UNVERIFIED`.
- Cada pregunta conserva sus `sourceRefs`.
- El estudiante no ve el borrador.
- La generación desde PDFs queda fuera de v1.
