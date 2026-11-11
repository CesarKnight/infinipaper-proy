# Secuencia 006 · Visualización multimedia

> Spec: [006-visualizacion](../../specs/006-visualizacion/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor V as Viewer
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  V->>FE: Abre un recurso
  FE->>API: GET /api/v1/files/:id
  API->>DB: Consulta metadatos
  API-->>FE: Resource (kind, mimeType)

  alt Imagen, PDF, audio o video
    FE->>API: GET /api/v1/files/:id/content (Range)
    API->>S3: Lee el objeto
    API-->>FE: Binario o 206 Partial Content
    FE-->>V: Visor nativo o reproductor
  else Documento ofimático
    FE-->>V: Ofrece descarga
  else Formato sin visor
    FE-->>V: Ofrece descarga
  end

  opt Markdown
    FE->>API: GET /api/v1/files/:id/text
    API->>S3: Lee el contenido
    API-->>FE: { content }
    FE-->>V: Render sanitizado
  end

  opt Volver
    V->>FE: Pulsa volver
    FE-->>V: Navega a la carpeta de origen
  end
```

## Notas

- PDF se muestra con el visor nativo del navegador en un `<iframe>`.
- Audio y video usan `Range` para evitar descargar todo el archivo.
- Los permisos se validan antes de servir el contenido.
