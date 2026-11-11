# Secuencia 010 · Transcripción de audio

> Spec: [010-transcripcion](../../specs/010-transcripcion/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss
  participant S3 as MinIO
  participant ASR as Whisper ASR

  E->>FE: Pulsa "Transcribir"
  FE->>API: POST /api/v1/files/:id/transcriptions
  API->>API: Valida que el recurso sea AUDIO
  API->>DB: Crea TranscriptionJob en QUEUED
  API->>Q: Encola el job
  API-->>FE: Job creado

  Q->>API: Worker toma el job
  API->>DB: Marca PROCESSING
  API->>S3: Descarga el audio
  API->>ASR: POST /v1/audio/transcriptions
  ASR-->>API: Texto transcrito

  alt Transcripción válida
    API->>DB: Guarda text y marca DONE
  else Sin voz o fallo de ASR
    API->>DB: Marca FAILED con error
  end

  loop Polling del estado
    FE->>API: GET /api/v1/transcriptions/:id
    API->>DB: Consulta el job
    API-->>FE: Estado y resultado
  end

  opt Guardar como apunte
    E->>FE: Revisa, edita y guarda
    FE->>API: POST /api/v1/transcriptions/:id/note
    API->>S3: Guarda el .md
    API->>DB: Crea Resource MARKDOWN
    API-->>FE: Apunte creado
  end
```

## Notas

- El trabajo es asíncrono y no bloquea la petición HTTP.
- El frontend consulta el estado por polling.
- El apunte se guarda en la misma carpeta del audio.
