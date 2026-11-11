# Secuencia 003 · Carpetas

> Spec: [003-carpetas](../../specs/003-carpetas/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor O as Owner
  actor E as Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  O->>FE: Crea carpeta
  FE->>API: POST /api/v1/projects/:id/folders
  API->>DB: Validar padre y crear Folder
  API-->>FE: Folder
  FE-->>O: Aparece en el árbol

  opt Mover carpeta
    E->>FE: Elige carpeta destino
    FE->>API: PATCH /api/v1/folders/:id/move
    alt El destino es un descendiente
      API-->>FE: 422 FOLDER_CYCLE
      FE-->>E: Muestra error
    else Destino válido
      API->>DB: Actualiza parentId
      API-->>FE: Folder movida
    end
  end

  opt Renombrar carpeta
    E->>FE: Cambia el nombre
    FE->>API: PATCH /api/v1/folders/:id
    API->>DB: Valida duplicado y actualiza
    API-->>FE: Folder renombrada
  end

  opt Eliminar carpeta
    E->>FE: Confirma borrado en cascada
    FE->>API: DELETE /api/v1/folders/:id
    API->>DB: Borra subárbol y recursos
    API->>S3: Borra objetos del subárbol
    API-->>FE: 204
  end
```

## Notas

- La raíz (`isRoot`) no se puede mover ni eliminar.
- Los nombres se comparan sin distinguir mayúsculas en el servicio.
- El borrado es destructivo y limpia S3.
