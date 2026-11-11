# Secuencia 007 · Participantes

> Spec: [007-participantes](../../specs/007-participantes/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor O as Owner
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL

  O->>FE: Busca un usuario
  FE->>API: GET /api/v1/users?query=
  API->>DB: Busca usuarios activos
  API-->>FE: Lista de usuarios
  FE-->>O: Muestra coincidencias

  O->>FE: Añade participante
  FE->>API: POST /api/v1/projects/:id/members
  API->>DB: Crea ProjectMember con rol VIEWER
  API-->>FE: Miembro creado
  FE-->>O: Aparece en el listado

  opt Cambiar rol
    O->>FE: Selecciona Editor o Viewer
    FE->>API: PATCH /api/v1/projects/:id/members/:userId
    API->>DB: Actualiza ProjectMember.role
    API-->>FE: Miembro actualizado
  end

  opt Retirar participante
    O->>FE: Confirma retirada
    FE->>API: DELETE /api/v1/projects/:id/members/:userId
    API->>DB: Borra membresía
    API-->>FE: 204
    FE-->>O: Participante retirado
  end
```

## Notas

- Solo el Owner gestiona participantes.
- El alta es directa, sin invitación ni aceptación.
- El Owner no se representa como `ProjectMember` y no puede retirarse por esta vía.
