# Secuencia 008 · Permisos y roles

> Spec: [008-permisos](../../specs/008-permisos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor
  actor O as Owner
  participant FE as Frontend
  participant API as API NestJS
  participant Guard as ProjectAccessGuard
  participant Perm as PermissionsService
  participant DB as PostgreSQL

  E->>FE: Solicita una operación de escritura
  FE->>API: PATCH /api/v1/folders/:id
  API->>Guard: Validar acceso al proyecto
  Guard->>Perm: resolveRole(userId, projectId)
  Perm->>DB: Consulta owner, membresía y visibilidad

  alt Rol suficiente
    Perm-->>Guard: editor
    Guard-->>API: Acceso permitido
    API->>DB: Ejecuta la operación
    API-->>FE: 200
  else Rol insuficiente
    Perm-->>Guard: viewer o null
    Guard-->>API: Acceso denegado
    API-->>FE: 403 PROJECT_FORBIDDEN
  end

  opt El Owner cambia un rol
    O->>FE: Selecciona nuevo rol
    FE->>API: PATCH /api/v1/projects/:id/members/:userId
    API->>DB: Actualiza ProjectMember.role
    API-->>FE: Rol actualizado
  end
```

## Notas

- La autorización se resuelve en cada petición; no se cachea el rol.
- La jerarquía es `owner > editor > viewer > público (lectura)`.
- La UI oculta acciones, pero el servidor es la fuente de verdad.
