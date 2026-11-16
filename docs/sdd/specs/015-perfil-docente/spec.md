# Spec 015 · Perfil docente, verificación y confirmación de email

| Campo | Valor |
|---|---|
| ID | `015` |
| Estado | `Borrador` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `001` (usuarios y sesiones), `008` (permisos) |

## 1. Contexto y problema

La aplicación actual trata a todos los usuarios como iguales: no existen roles globales, no hay confirmación de email y no existe un perfil docente verificable. Tampoco hay una forma de distinguir entre un proyecto personal y un proyecto académico de curso.

Para habilitar cuestionarios, tareas, paneles docentes y MCP se necesita una base de confianza:

- Saber quién es docente y si está verificado.
- Evitar que cualquiera se declare docente usando un correo institucional sin demostrar que lo controla.
- Tener administradores que revisen solicitudes manuales y auditen las decisiones.
- Mantener la privacidad de la evidencia y del correo.

## 2. Objetivo

> Como **usuario**, quiero **confirmar mi email y solicitar la verificación docente** para **poder crear proyectos académicos y operar como docente dentro de la plataforma**.
>
> Como **administrador**, quiero **revisar las solicitudes docentes y aprobarlas o rechazarlas con un motivo** para **mantener la confianza en los proyectos académicos**.

## 3. Alcance

### Incluye

- Roles globales `ADMIN`, `TEACHER` y `STUDENT`; los usuarios nuevos nacen como `STUDENT`.
- Confirmación de email con token de un solo uso.
- Envío de correos en desarrollo mediante Mailpit y configuración SMTP para producción.
- Perfil docente con verificación híbrida:
  - automática si el email está verificado y el dominio pertenece a una lista institucional aprobada;
  - manual, revisada por un administrador, en el resto de casos.
- Cola de solicitudes y auditoría de decisiones para administradores.
- Revocación de la verificación docente.
- Insignia y estado visible en el perfil público.
- Bootstrap del primer administrador.

### No incluye

- SSO institucional (SAML, OIDC o Google Workspace).
- Validación de títulos, documentos de identidad o KYC.
- Proveedor de correo transaccional de producción; solo se deja la configuración.
- Verificación automática contra bases de datos de instituciones.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | `User.role` admite `ADMIN`, `TEACHER` y `STUDENT`; el valor por defecto es `STUDENT`. | Must |
| RF-02 | Al registrarse se envía un correo de confirmación con un token de un solo uso y 24 horas de validez. | Must |
| RF-03 | El usuario puede solicitar el reenvío del correo; se aplica rate limit y no se revela si el email existe. | Must |
| RF-04 | Un usuario con email no confirmado puede iniciar sesión, pero no puede solicitar verificación docente. | Must |
| RF-05 | La solicitud docente incluye institución, área, cargo y evidencia (URL o archivo adjunto). | Must |
| RF-06 | Si el email está confirmado y el dominio está en `TEACHER_INSTITUTION_DOMAINS`, la solicitud se aprueba automáticamente y el rol pasa a `TEACHER`. | Must |
| RF-07 | Si no hay coincidencia automática, la solicitud queda `PENDING` y aparece en la cola del administrador. | Must |
| RF-08 | El administrador puede aprobar o rechazar con un motivo; toda decisión queda auditada. | Must |
| RF-09 | Al aprobar, `User.role = TEACHER` y `TeacherProfile.status = VERIFIED`. | Must |
| RF-10 | Al rechazar, el usuario sigue como `STUDENT` y puede corregir y reenviar la solicitud. | Must |
| RF-11 | Al revocar, `User.role = STUDENT`, `TeacherProfile.status = REVOKED` y sus proyectos tipo curso se archivan. | Must |
| RF-12 | El perfil público muestra nombre, rol, institución y estado de verificación; nunca muestra el email ni la evidencia. | Must |
| RF-13 | El administrador se crea mediante un comando de bootstrap, nunca mediante registro público. | Must |
| RF-14 | En desarrollo, los correos se envían a Mailpit; en producción se usa SMTP configurable. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Los tokens de confirmación se almacenan hasheados y son de un solo uso. | Test unitario y revisión de esquema. |
| RNF-02 | El endpoint de reenvío no revela si un email está registrado. | Test de respuesta uniforme. |
| RNF-03 | El envío de correo no bloquea la respuesta HTTP; los fallos se registran y se reintentan. | Test con SMTP simulado y revisión de logs. |
| RNF-04 | Las plantillas de correo están en español y son accesibles en texto plano. | Revisión manual. |
| RNF-05 | Las decisiones administrativas son auditables y no se pueden borrar desde la UI. | Revisión de auditoría. |
| RNF-06 | El flujo funciona con Mailpit sin credenciales externas. | `docker compose up` y revisión en `http://localhost:8025`. |

## 6. Criterios de aceptación

### CA-01 · Registro y confirmación de email

- **Dado** un visitante que se registra con un email válido,
- **cuando** completa el registro,
- **entonces** recibe un correo en Mailpit con un enlace de confirmación y su `emailVerifiedAt` sigue vacío hasta confirmar.

### CA-02 · Token válido

- **Dado** un token de confirmación vigente,
- **cuando** el usuario lo usa,
- **entonces** el email queda confirmado, el token se marca como usado y no puede reutilizarse.

### CA-03 · Token expirado o inválido

- **Dado** un token expirado o inexistente,
- **cuando** el usuario intenta confirmar,
- **entonces** recibe `EMAIL_TOKEN_INVALID` o `EMAIL_TOKEN_EXPIRED` sin confirmar el email.

### CA-04 · Solicitud docente manual

- **Dado** un usuario con email confirmado y dominio no institucional,
- **cuando** envía la solicitud docente,
- **entonces** la solicitud queda `PENDING` y aparece en la cola del administrador.

### CA-05 · Verificación automática institucional

- **Dado** un usuario con email confirmado en un dominio de `TEACHER_INSTITUTION_DOMAINS`,
- **cuando** solicita la verificación docente,
- **entonces** el sistema la aprueba automáticamente y el rol pasa a `TEACHER`.

### CA-06 · Aprobación administrativa

- **Dado** un administrador autenticado y una solicitud `PENDING`,
- **cuando** la aprueba con un motivo,
- **entonces** el usuario pasa a `TEACHER`, la solicitud queda `VERIFIED` y se registra la auditoría.

### CA-07 · Rechazo administrativo

- **Dado** un administrador autenticado y una solicitud `PENDING`,
- **cuando** la rechaza con un motivo,
- **entonces** el usuario sigue como `STUDENT`, ve el motivo y puede reenviar.

### CA-08 · Permisos de administración

- **Dado** un usuario que no es `ADMIN`,
- **cuando** intenta listar o resolver solicitudes,
- **entonces** recibe `403 ADMIN_REQUIRED`.

### CA-09 · Revocación

- **Dado** un docente verificado con proyectos tipo curso,
- **cuando** un administrador revoca su verificación,
- **entonces** el rol vuelve a `STUDENT` y sus proyectos de curso se archivan.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/email/verify/request` | Autenticado | — | `202 { status: "sent" }` |
| `POST` | `/api/v1/auth/email/verify/confirm` | Público | `{ token }` | `200 { emailVerifiedAt }` |
| `GET` | `/api/v1/teacher/verification` | Autenticado | — | `TeacherProfile` o `null` |
| `POST` | `/api/v1/teacher/verification` | Autenticado | institución, área, cargo, evidencia | `201 TeacherProfile` |
| `GET` | `/api/v1/admin/teacher-verifications` | Admin | `?status=` | Lista paginada |
| `POST` | `/api/v1/admin/teacher-verifications/:id/approve` | Admin | `{ reason? }` | `TeacherProfile` |
| `POST` | `/api/v1/admin/teacher-verifications/:id/reject` | Admin | `{ reason }` | `TeacherProfile` |
| `POST` | `/api/v1/admin/users/:id/revoke-teacher` | Admin | `{ reason }` | `User` |
| `GET` | `/api/v1/users/:username` | Público/autenticado | — | Perfil público con rol y verificación |

### Datos

- `User.role: GlobalRole` y `User.emailVerifiedAt: DateTime?`.
- `EmailVerificationToken`: `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`.
- `TeacherProfile`: `userId @unique`, `status`, `method`, `institution`, `area`, `position`, `evidenceUrl`, `reviewerId`, `reviewedAt`, `rejectionReason`.
- `AuditEvent`: actor, acción, entidad, motivo, metadata y fecha.

### UI

- Banner persistente “Confirma tu email” con reenvío.
- Formulario de solicitud docente con estado y motivo de rechazo.
- Página de administración con cola, detalle y acciones.
- Insignia de docente verificado en perfil y participantes.

### Infraestructura de correo

- Servicio `mailpit` en Docker Compose:
  - imagen `axllent/mailpit`;
  - SMTP en `mailpit:1025`;
  - UI en `http://localhost:8025`.
- Variables del backend: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_PUBLIC_URL`.
- En desarrollo no hay autenticación SMTP; en producción se sustituye por SES, Postmark u otro proveedor compatible sin cambiar el código.
- Los correos deben incluir enlace absoluto construido con `APP_PUBLIC_URL`.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| SMTP no disponible | La solicitud se acepta y el correo se reintenta; se registra el fallo | `EMAIL_DELIVERY_FAILED` · 503 |
| Token expirado | No confirma el email y permite solicitar uno nuevo | `EMAIL_TOKEN_EXPIRED` · 410 |
| Token ya usado | No confirma dos veces | `EMAIL_TOKEN_USED` · 409 |
| Solicitud duplicada | Se devuelve la solicitud existente si sigue `PENDING` | `TEACHER_REQUEST_EXISTS` · 409 |
| Usuario no confirmado | No puede solicitar verificación docente | `EMAIL_NOT_VERIFIED` · 403 |
| No administrador | No puede resolver solicitudes | `ADMIN_REQUIRED` · 403 |
| Docente revocado | Proyectos de curso archivados; no se borran | `TEACHER_REVOKED` · 200 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Verificación híbrida: dominio institucional confirmado + revisión manual para el resto. | Cerrada |
| D-02 | Roles globales `ADMIN`, `TEACHER`, `STUDENT`; los usuarios nuevos son `STUDENT`. | Cerrada |
| D-03 | El administrador revisa solicitudes y audita decisiones; no accede automáticamente a proyectos privados. | Cerrada |
| D-04 | Mailpit en desarrollo y SMTP configurable en producción. | Cerrada |
| D-05 | El token de email dura 24 horas y es de un solo uso. | Cerrada |
| Q-01 | ¿Qué proveedor SMTP se usará en producción? | Abierta |
| Q-02 | ¿La lista de dominios institucionales se administra por env o por base de datos? | Abierta (v1: env) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin SSO institucional. | La verificación depende de email y revisión manual. | `T-060` |
| G-02 | Sin validación documental de títulos. | La confianza es declarativa más revisión administrativa. | `T-061` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| — | Pendiente de implementación. | — |

> Plan y tareas: se crearán cuando esta spec pase a `Aprobada`.
