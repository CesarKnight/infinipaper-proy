# Secuencia 016 · Proyectos académicos y archivado

> Spec: [016-proyectos-academicos](../../specs/016-proyectos-academicos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor D as Docente
  actor O as Owner
  actor E as Editor
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO
  participant Q as pg-boss

  D->>FE: Crea un proyecto de curso
  FE->>API: POST /projects (type=COURSE)
  API->>DB: Verifica TeacherProfile VERIFIED
  API->>DB: Crea Project + Folder raíz
  API-->>FE: Project académico

  O->>FE: Añade estudiantes
  FE->>API: POST /projects/:id/members (role=STUDENT)
  API->>DB: Crea ProjectMember con rol STUDENT

  O->>FE: Archiva el proyecto
  FE->>API: POST /projects/:id/archive
  API->>DB: status=ARCHIVED + archiveAccessUntil (+30 días)
  API-->>FE: Proyecto archivado

  E->>FE: Intenta crear contenido
  FE->>API: POST /folders/:id/notes
  API->>DB: PermissionsService resuelve rol y estado
  API-->>FE: 423 PROJECT_ARCHIVED

  O->>FE: Extiende o restaura
  FE->>API: POST /projects/:id/archive/extend o /restore
  API->>DB: Actualiza archiveAccessUntil o status=ACTIVE
  API-->>FE: Proyecto actualizado

  Q->>API: Job project-purge
  API->>DB: Busca proyectos ARCHIVED vencidos
  API->>S3: Borra objetos de las carpetas
  API->>DB: Borra Project y datos en cascada
```

## Notas

- El Owner conserva la gestión del proyecto archivado; el resto de participantes queda en solo lectura.
- La purga solo elimina proyectos cuyo `archiveAccessUntil` ya venció.
- Si falla el borrado de algún objeto de MinIO, el proyecto se conserva para reintentar.
- El endpoint `POST /admin/projects/purge-expired` permite una purga manual auditada.
