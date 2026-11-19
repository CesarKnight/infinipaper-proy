# Secuencia 027 · Fuentes multiformato

> Spec: [027-fuentes-multiformato](../../specs/027-fuentes-multiformato/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor / Owner
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss
  participant AG as Agents
  participant S3 as MinIO
  participant ASR as Whisper ASR
  participant LLM as LLM

  E->>FE: Genera desde un recurso, carpeta o proyecto
  FE->>API: POST /folders/:id/mindmaps o /quizzes/generate
  API->>DB: Valida permisos y busca extracción en caché
  API->>Q: Encola ContentGenerationJob
  API-->>FE: Job QUEUED
  Q->>API: Worker toma el job
  API->>DB: Marca PROCESSING · stage EXTRACTING
  API->>S3: URLs presignadas de las fuentes

  loop Por cada fuente sin caché
    API->>AG: POST /v1/sources/extract
    AG->>S3: Descarga el archivo
    opt Audio o video
      AG->>ASR: Transcribe
      ASR-->>AG: Texto y metadatos
    end
    opt PDF escaneado, imagen o diapositiva
      AG->>LLM: OCR o descripción visual
      LLM-->>AG: Texto o descripción
    end
    AG-->>API: Documento normalizado + warnings
    API->>DB: Guarda ResourceExtraction
  end

  API->>DB: stage GENERATING
  API->>AG: POST /v1/mindmaps/generate o /v1/quizzes/generate
  AG->>LLM: Genera contenido con el contexto normalizado
  LLM-->>AG: JSON validado
  AG-->>API: resultJson + usedSourceIds + warnings
  API->>S3: Guarda el JSON canónico
  API->>DB: Crea Resource + ResourceSource · job DONE
  API-->>FE: Estado, etapa, warnings y fuentes usadas
  FE-->>E: Muestra el resultado y los archivos omitidos
```

## Notas

- La caché se reutiliza por `resourceId + checksum + versión del extractor`.
- Si una fuente falla dentro de una carpeta o proyecto, se registra un warning y se continúa.
- Si ninguna fuente produce contenido, el job falla con `EMPTY_SOURCE`.
- La procedencia solo incluye las fuentes que realmente se usaron.
- `AGENT_MULTIFORMAT_ENABLED=false` vuelve al comportamiento Markdown-only.
