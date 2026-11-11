# Secuencia 005 · Gestión de archivos

> Spec: [005-archivos](../../specs/005-archivos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor
  actor V as Viewer
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  E->>FE: Selecciona un archivo
  FE->>API: POST /api/v1/folders/:id/files (multipart)
  API->>API: Valida tamaño, extensión y nombre

  alt Archivo válido
    API->>S3: Guarda el objeto
    API->>DB: Crea Resource con metadatos y checksum
    API-->>FE: Resource creado
    FE-->>E: Aparece en el listado
  else Formato o tamaño inválido
    API-->>FE: 415 FILE_UNSUPPORTED_TYPE o 413 FILE_TOO_LARGE
    FE-->>E: Muestra el error
  else Nombre duplicado
    API-->>FE: 409 FILE_NAME_TAKEN + suggestedName
    FE-->>E: Sugiere un nombre alternativo
  end

  opt Descargar o visualizar
    V->>FE: Abre el archivo
    FE->>API: GET /api/v1/files/:id/content (Range)
    API->>S3: Lee el objeto
    API-->>FE: 206 Partial Content o 200
    FE-->>V: Descarga o visor
  end

  opt Eliminar archivo
    E->>FE: Confirma eliminación
    FE->>API: DELETE /api/v1/files/:id
    API->>DB: Borra Resource
    API->>S3: Borra objeto
    API-->>FE: 204
  end
```

## Notas

- El límite se aplica en el backend con `MAX_UPLOAD_SIZE_MB`.
- El `kind` se deriva de la extensión.
- MinIO nunca se expone al navegador.
