# Secuencia 021 · Mapas mentales con IA

> Spec: [021-mapas-mentales](../../specs/021-mapas-mentales/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor / Owner
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss
  participant AG as Agents
  participant LLM as LLM
  participant S3 as MinIO

  E->>FE: Genera un mapa mental desde recurso, carpeta o proyecto
  FE->>API: POST /folders/:id/mindmaps
  API->>DB: Valida permisos, caché de extracción y activeKey
  API->>Q: Encola ContentGenerationJob MINDMAP
  API-->>FE: Job QUEUED

  Q->>API: Worker toma el job
  API->>DB: Marca PROCESSING · stage EXTRACTING
  API->>S3: URLs presignadas de las fuentes
  API->>AG: Extrae y normaliza las fuentes (spec 027)
  AG-->>API: Documentos normalizados + warnings
  API->>DB: Guarda ResourceExtraction y stage GENERATING
  API->>AG: POST /v1/mindmaps/generate
  AG->>LLM: Prompt de mapa mental con contexto normalizado
  LLM-->>AG: JSON de nodos y aristas
  AG->>AG: Valida y sanea el JSON
  AG-->>API: Mapa validado + usedSourceIds + warnings
  API->>S3: Guarda el JSON canónico
  API->>DB: Crea Resource MINDMAP + ResourceSource · job DONE
  API-->>FE: Estado, etapa, warnings y fuentes usadas
  FE->>API: GET /files/:id/content
  FE->>FE: Monta MindmapViewer (React Flow)
  FE-->>E: Pan, zoom, reordenar y exportar PNG
```

## Notas

- El original nunca se modifica.
- El mapa nace `UNVERIFIED` y conserva la cadena de fuentes.
- Un job fallido guarda el código de error y admite reintento.
- La generación reutiliza la caché de extracción y la cola de la spec 028.
- El visor interactivo y la exportación PNG se detallan en la spec 029.
- Las posiciones manuales del visor se guardan en `localStorage`, no en el servidor.
