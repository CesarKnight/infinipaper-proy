# Secuencia 009 · Apuntes Markdown

> Spec: [009-apuntes](../../specs/009-apuntes/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  E->>FE: Abre un apunte .md
  FE->>API: GET /api/v1/files/:id/text
  API->>S3: Lee el contenido
  API-->>FE: { content }
  FE-->>E: Vista de solo lectura sanitizada

  E->>FE: Pulsa "Editar" y escribe
  Note over FE: Autoguardado con debounce de 1200 ms
  FE->>API: PUT /api/v1/files/:id/content
  API->>S3: Guarda el Markdown
  API->>DB: Actualiza size y checksum

  alt Guardado correcto
    API-->>FE: Resource actualizado
    FE-->>E: "Guardado"
  else Error de red o servidor
    API-->>FE: Error
    FE-->>E: "Error al guardar"
  end

  opt Crear apunte
    E->>FE: Nuevo apunte + nombre + contenido
    FE->>API: POST /api/v1/folders/:id/notes
    API->>S3: Guarda el .md
    API->>DB: Crea Resource MARKDOWN
    API-->>FE: Resource creado
  end

  opt Eliminar apunte
    E->>FE: Confirma eliminación
    FE->>API: DELETE /api/v1/files/:id
    API->>DB: Borra Resource
    API->>S3: Borra objeto
    API-->>FE: 204
  end
```

## Notas

- El editor es MDXEditor y se carga de forma diferida.
- La vista de lectura usa `rehype-sanitize`.
- Los conflictos son *last-write-wins*; no hay colaboración en tiempo real.
