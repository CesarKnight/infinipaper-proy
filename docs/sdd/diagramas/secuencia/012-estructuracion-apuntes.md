# Secuencia 012 · Estructuración de apuntes con IA

> Spec: [012-estructuracion-apuntes-ia](../../specs/012-estructuracion-apuntes-ia/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss
  participant AG as Agents (LangGraph)
  participant S3 as MinIO
  participant LLM as LLM

  E->>FE: Pulsa "Estructurar con IA"
  FE->>API: POST /files/:fileId/structure
  API->>DB: Crea NoteStructureJob QUEUED
  API->>Q: Encola el job
  API-->>FE: 202 { id, status: QUEUED }

  Q->>API: Worker toma el job
  API->>DB: Marca PROCESSING
  API->>S3: Genera URL presignada
  API->>AG: POST /v1/notes/structure
  AG->>S3: GET del .md presignado
  AG->>AG: route_sources y extract_markdown
  AG->>LLM: plan_outline
  LLM-->>AG: Outline
  AG->>LLM: structure_note
  LLM-->>AG: Markdown estructurado
  AG->>AG: validate
  alt Válido
    AG-->>API: Markdown, outline y warnings
    API->>DB: Job DONE
  else Inválido
    AG->>LLM: repair
    LLM-->>AG: Markdown corregido
    AG-->>API: Markdown con warnings
    API->>DB: Job DONE o FAILED
  end

  loop Polling del estado
    FE->>API: GET /structure-jobs/:jobId
    API->>DB: Consulta el job
    API-->>FE: Estado, resultado y usage
  end

  E->>FE: Revisa preview y diff
  FE->>API: POST /structure-jobs/:jobId/apply
  API->>DB: Crea Resource MARKDOWN nuevo
  API-->>FE: Apunte estructurado
  FE-->>E: Navega a nombre-estructurado.md
```

## Notas

- El servicio de agentes es stateless: no accede a la base de datos ni recibe credenciales S3.
- NestJS conserva el estado del job y aplica los permisos.
- El original nunca se modifica; se crea un nuevo `Resource` MARKDOWN.
- En v1 solo se enrutan fuentes `markdown`; el grafo está preparado para PDF, imagen, audio, video y web.
