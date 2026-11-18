# Secuencia 006 · Visualización multimedia

> Spec: [006-visualizacion](../../specs/006-visualizacion/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor V as Participante
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO
  participant LIB as Render ofimático

  V->>FE: Abre un recurso
  FE->>API: GET /api/v1/files/:id
  API->>DB: Consulta metadatos y permisos
  API-->>FE: Resource (kind, mimeType, name)

  alt Imagen
    FE->>API: GET /files/:id/content
    API->>S3: Lee objeto
    API-->>FE: Imagen
    FE-->>V: ImageViewer con zoom/paneo
  else PDF
    FE->>API: GET /files/:id/content
    API->>S3: Lee objeto
    API-->>FE: PDF
    FE-->>V: PdfViewer con iframe y acciones
  else Audio o video
    FE->>API: GET /files/:id/content (Range)
    API->>S3: Lee el rango
    API-->>FE: 206 Partial Content
    FE-->>V: Reproductor con streaming
  else DOCX / XLSX / PPTX
    FE->>API: GET /files/:id/content
    API-->>FE: Binario
    FE->>LIB: dynamic import del visor
    LIB-->>FE: Preview HTML/tabla/diapositivas
    FE-->>V: OfficeViewer de solo lectura
  else Legacy .doc/.xls/.ppt o formato sin visor
    FE-->>V: Fallback de descarga
  end

  opt Markdown
    FE->>API: GET /files/:id/text
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

- Todos los visores comparten `ViewerShell` y los tokens Paper & Ink / Midnight Study.
- Las librerías ofimáticas se cargan con `dynamic import` solo cuando hacen falta.
- La fuente binaria en MinIO sigue siendo la fuente de verdad; el render es de solo lectura y desacoplado para una futura capa colaborativa.
- DOCX se renderiza con `docx-preview`, XLSX/CSV/ODS con `xlsx` y PPTX con `pptx-preview`.
- Los formatos legacy y los códecs no soportados tienen fallback de descarga.
- Audio y video usan `Range` para evitar descargar todo el archivo.
