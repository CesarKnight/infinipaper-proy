# Secuencia 001 · Usuarios, autenticación y sesiones

> Spec: [001-usuarios](../../specs/001-usuarios/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant MAIL as Mailpit / SMTP
  participant S3 as MinIO

  alt Registro
    U->>FE: Completa registro
    FE->>API: POST /api/v1/auth/register
    API->>DB: Crea User STUDENT + Session + token de email
    API->>MAIL: Envía confirmación
    API-->>FE: Set-Cookie httpOnly + User
    FE-->>U: Redirige a /
  else Login
    U->>FE: Email o username + contraseña
    FE->>API: POST /api/v1/auth/login
    API->>DB: Verifica User + crea Session
    alt Credenciales válidas
      API-->>FE: Set-Cookie + User
      FE-->>U: Redirige a /
    else Credenciales inválidas
      API-->>FE: 401 AUTH_INVALID_CREDENTIALS
      FE-->>U: Muestra error
    end
  end

  opt Confirmar email
    U->>FE: Abre enlace /verify-email?token=...
    FE->>API: POST /api/v1/auth/email/verify/confirm
    API->>DB: Marca emailVerifiedAt y usa el token
    API-->>FE: Usuario confirmado
  end

  opt Editar perfil o avatar
    U->>FE: Cambia datos o sube avatar
    FE->>API: PATCH /users/me o POST /users/me/avatar
    API->>S3: Guarda avatar
    API->>DB: Actualiza perfil
    API-->>FE: Perfil actualizado
  end

  opt Archivar cuenta
    U->>FE: Confirma archivado
    FE->>API: DELETE /users/me
    API->>DB: Borra proyectos privados y sesiones, marca ARCHIVED
    API->>S3: Borra avatar y objetos privados
    API-->>FE: 204
  end
```

## Notas

- La sesión viaja en cookie `httpOnly`; el frontend nunca lee el token.
- El registro asigna el rol global `STUDENT`; nunca crea un administrador.
- La confirmación de email y el perfil docente se detallan en la spec 015.
- El archivado es lógico: elimina proyectos privados, conserva públicos y no sustituye la revocación docente de 015.
- El avatar se guarda en MinIO y se sirve por el backend.
