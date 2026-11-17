# Secuencia 015 · Perfil docente y confirmación de email

> Spec: [015-perfil-docente](../../specs/015-perfil-docente/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  actor AD as Administrador
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant MAIL as Mailpit / SMTP

  U->>FE: Completa el registro
  FE->>API: POST /auth/register
  API->>DB: Crea User con rol STUDENT
  API->>DB: Crea EmailVerificationToken (hash, 24 h)
  API->>MAIL: Envía enlace de confirmación
  API-->>FE: 201 User
  U->>MAIL: Abre el correo
  U->>FE: /verify-email?token=...
  FE->>API: POST /auth/email/verify/confirm
  API->>DB: Valida token y marca emailVerifiedAt
  API-->>FE: User confirmado

  U->>FE: Solicita verificación docente
  FE->>API: POST /teacher/verification
  API->>DB: Comprueba emailVerifiedAt y crea TeacherProfile
  alt Dominio institucional permitido
    API->>DB: TeacherProfile VERIFIED + User.role TEACHER
  else Revisión manual
    API->>DB: TeacherProfile PENDING
    AD->>FE: Abre la cola de verificaciones
    FE->>API: GET /admin/teacher-verifications?status=PENDING
    API-->>FE: Solicitudes pendientes
    AD->>FE: Aprueba o rechaza
    FE->>API: POST /admin/teacher-verifications/:id/approve
    API->>DB: TeacherProfile VERIFIED + User.role TEACHER + AuditEvent
    API->>MAIL: Notifica la decisión
    API-->>FE: Perfil actualizado
  end
```

## Notas

- El registro no falla si el SMTP no responde; el fallo se registra y el usuario puede reenviar el correo.
- La verificación automática exige que el correo esté confirmado.
- La revocación vuelve el rol global a `STUDENT` y archiva los cursos activos del docente.
- Todas las decisiones administrativas generan un `AuditEvent`.
