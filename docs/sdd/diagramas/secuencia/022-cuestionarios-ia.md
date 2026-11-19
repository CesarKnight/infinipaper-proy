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

  D->>FE: Genera un cuestionario con IA desde recurso, carpeta o proyecto
  FE->>API: POST /folders/:id/quizzes/generate
  API->>DB: Valida permisos, caché de extracción y activeKey
  API->>Q: Encola ContentGenerationJob QUIZ
  API-->>FE: Job QUEUED

  Q->>API: Worker toma el job
  API->>DB: Marca PROCESSING · stage EXTRACTING
  API->>S3: URLs presignadas de las fuentes
  API->>AG: Extrae y normaliza las fuentes (spec 027)
  AG-->>API: Documentos normalizados + warnings
  API->>DB: Guarda ResourceExtraction y stage GENERATING
  API->>AG: POST /v1/quizzes/generate
  AG->>LLM: Prompt con cantidad, dificultad y tipos
  LLM-->>AG: JSON de preguntas con fuentes
  AG->>AG: Valida, deduplica y sanea
  AG-->>API: Cuestionario validado + usedSourceIds + warnings
  API->>DB: Crea Resource QUIZ + Quiz DRAFT + sourceRefs
  API->>DB: Job DONE + resultResourceId
  API-->>FE: Borrador generado + warnings
  FE-->>D: Muestra etapa, progreso y fuentes usadas

  D->>FE: Revisa y publica
  FE->>API: PUT /quizzes/:id/questions y POST /publish
  API->>DB: Guarda cambios y publica solo tras acción humana
```

## Notas

- El resultado siempre nace `DRAFT` y `UNVERIFIED`.
- Cada pregunta conserva sus `sourceRefs`.
- El estudiante no ve el borrador.
- La generación reutiliza la caché de extracción y la cola de la spec 028.
- PDFs, Word, hojas de cálculo, presentaciones, imágenes, audio y video se admiten mediante la spec 027; los formatos diferidos se omiten con warning.
- Un job duplicado exacto devuelve `GENERATION_JOB_IN_PROGRESS` y no crea otro cuestionario.
