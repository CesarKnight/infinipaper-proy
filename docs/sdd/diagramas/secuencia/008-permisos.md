# Secuencia 008 · Permisos y roles

> Spec: [008-permisos](../../specs/008-permisos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor AD as Administrador
  actor D as Docente verificado
  actor O as Owner
  actor E as Editor
  actor S as Student
  participant FE as Frontend
  participant API as API NestJS
  participant Guard as ProjectAccessGuard
  participant Perm as PermissionsService
  participant DB as PostgreSQL

  AD->>FE: Revisa solicitud docente
  FE->>API: POST /admin/teacher-verifications/:id/approve
  API->>DB: TeacherProfile VERIFIED + User.role TEACHER + AuditEvent
  API-->>FE: Docente verificado

  D->>FE: Crea proyecto de curso
  FE->>API: POST /projects (type=COURSE)
  API->>DB: Valida TeacherProfile VERIFIED
  API->>DB: Crea Project y deja al docente como Owner
  API-->>FE: Curso creado

  O->>FE: Asigna Editor, Viewer o Student
  FE->>API: POST/PATCH /projects/:id/members
  API->>DB: Actualiza ProjectMember.role
  API-->>FE: Rol actualizado

  E->>FE: Solicita una operación de escritura
  FE->>API: PATCH /api/v1/folders/:id
  API->>Guard: Validar acceso al proyecto
  Guard->>Perm: resolveRole(userId, project)
  Perm->>DB: Consulta owner, membresía, visibilidad y estado

  alt Rol suficiente
    Perm-->>Guard: editor
    Guard-->>API: Acceso permitido
    API->>DB: Ejecuta la operación
    API-->>FE: 200
  else Rol insuficiente
    Perm-->>Guard: viewer, student, public o null
    Guard-->>API: Acceso denegado
    API-->>FE: 403 PROJECT_FORBIDDEN
  end

  S->>FE: Intenta editar contenido
  FE->>API: PATCH /files/:id
  API->>Guard: Valida rol Student
  Guard-->>API: Solo lectura
  API-->>FE: 403 PROJECT_FORBIDDEN
```

## Notas

- La autorización se resuelve en cada petición; no se cachea el rol.
- El rol global no sustituye la membresía del proyecto.
- El `ADMIN` verifica docentes, pero no obtiene acceso implícito al contenido privado.
- Un `TEACHER` verificado puede crear cursos y queda como Owner; en cursos ajenos necesita membresía.
- La jerarquía de contenido es `owner > editor > viewer/student > público (lectura)`.
- La UI oculta acciones, pero el servidor es la fuente de verdad.
