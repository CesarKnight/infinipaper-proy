# Secuencia 024 · Búsqueda semántica

> Spec: [024-busqueda-semantica](../../specs/024-busqueda-semantica/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Participante
  actor D as Owner / Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss
  participant S3 as MinIO
  participant EMB as Embeddings

  D->>FE: Reindexa el proyecto
  FE->>API: POST /projects/:id/search/reindex
  API->>DB: Crea ContentIndexJob
  API->>Q: Encola indexación
  Q->>API: Worker PROCESSING
  API->>S3: Lee Markdown/quiz/mapa
  API->>EMB: Calcula embeddings
  API->>DB: ResourceChunk + vector(1536)

  U->>FE: Busca “diferencia entre sprint y revisión”
  FE->>API: GET /projects/:id/search?q=...
  API->>EMB: Embedding de la consulta
  API->>DB: Similitud pgvector + texto completo
  alt Proveedor de embeddings falla
    API->>DB: Búsqueda léxica
    API-->>FE: Resultados + aviso degradado
  else Híbrido
    API-->>FE: Resultados con fragmento y score
  end
  API->>DB: Registra SEARCH_HIT
```

## Notas

- Solo se buscan proyectos/carpetas accesibles.
- Los filtros de tipo/origen/validación se aplican en servidor.
- La extensión `vector` y los índices HNSW/GIN viven en PostgreSQL.
