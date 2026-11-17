# Secuencia 021 · Mapas mentales con IA

> Spec: [021-mapas-mentales](../../specs/021-mapas-mentales/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss
  participant AG as Agents
  participant LLM as LLM
  participant S3 as MinIO

  E->>FE: Genera mapa mental desde la carpeta
  FE->>API: POST /folders/:id/mindmaps
  API->>DB: Valida permisos y crea ContentGenerationJob
  API->>Q: Encola job MINDMAP
  API-->>FE: Job QUEUED

  Q->>API: Worker toma el job
  API->>DB: Marca PROCESSING
  API->>S3: URLs presignadas de las fuentes
  API->>AG: POST /v1/mindmaps/generate
  AG->>S3: Descarga apuntes
  AG->>LLM: Prompt de mapa mental
  LLM-->>AG: JSON de nodos y aristas
  AG->>AG: Valida y sanea JSON
  AG-->>API: Mapa validado + usage
  API->>S3: Guarda JSON canónico
  API->>DB: Crea Resource MINDMAP + ResourceSource
  API->>DB: Job DONE + resultResourceId
  API-->>FE: Estado DONE
  FE->>API: GET /files/:id/content
  FE-->>E: Render del mapa
```

## Notas

- El original nunca se modifica.
- El mapa nace `UNVERIFIED` y conserva la cadena de fuentes.
- Un job fallido guarda el código de error y admite reintento.
- El visor actual usa un layout radial SVG; la exportación queda para una fase posterior.
