# Secuencia 002 · Proyectos

> Spec: [002-proyectos](../../specs/002-proyectos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  actor V as Visitante
  actor O as Owner
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  U->>FE: Crea proyecto
  FE->>API: POST /api/v1/projects
  API->>DB: Crear Project + Folder raíz
  API-->>FE: Project
  FE-->>U: Redirige al workspace

  opt Ver proyectos públicos
    V->>FE: Abre /projects?scope=public
    FE->>API: GET /api/v1/projects/public
    API->>DB: Consulta proyectos públicos
    API-->>FE: Lista paginada
    FE-->>V: Muestra proyectos en solo lectura
  end

  opt Editar proyecto
    O->>FE: Cambia nombre, descripción o visibilidad
    FE->>API: PATCH /api/v1/projects/:id
    API->>DB: Actualiza Project
    API-->>FE: Project actualizado
  end

  opt Eliminar proyecto
    O->>FE: Confirma borrado
    FE->>API: DELETE /api/v1/projects/:id
    API->>DB: Borra en cascada
    API->>S3: Borra objetos de los recursos
    API-->>FE: 204
  end
```

## Notas

- La carpeta raíz se crea en la misma operación que el proyecto.
- Solo el Owner edita o elimina; los públicos permiten lectura anónima.
