# Secuencia 004 · Aviso en carpeta

> Spec: [004-aviso](../../specs/004-aviso/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor V as Viewer
  actor E as Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  V->>FE: Abre una carpeta
  FE->>API: GET /api/v1/folders/:id
  API->>DB: Consulta carpeta y noticeResourceId
  API-->>FE: Folder con noticeResourceId

  alt Existe aviso
    FE->>API: GET /api/v1/files/:id/text
    API->>S3: Lee aviso.md
    API-->>FE: { content }
    FE-->>V: Renderiza Markdown sanitizado al tope
  else No existe aviso
    FE-->>V: Muestra botón "Crear aviso"
  end

  opt Crear o editar aviso (Editor+)
    E->>FE: Escribe en el editor
    FE->>API: POST /folders/:id/notice o PUT /files/:id/content
    API->>S3: Guarda aviso.md
    API->>DB: Crea o actualiza Resource MARKDOWN
    API-->>FE: Recurso actualizado
    FE-->>E: Confirma guardado
  end
```

## Notas

- El aviso es un `Resource` MARKDOWN visible en el listado.
- La detección usa `AVISO_FILENAME` y `noticeResourceId`.
- El render usa `react-markdown` + `rehype-sanitize`.
