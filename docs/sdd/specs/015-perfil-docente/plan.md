# Plan 015 · Perfil docente, verificación y confirmación de email

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-15` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se añaden roles globales y un perfil docente con verificación híbrida. El registro envía un correo de confirmación mediante SMTP; en desarrollo se usa Mailpit. Un administrador revisa las solicitudes manuales, aprueba o rechaza y puede revocar. La verificación automática se activa cuando el email confirmado pertenece a un dominio configurado.

## 2. Contexto técnico actual

- `AuthService` crea usuarios y sesiones; no tenía confirmación de email.
- `AuthGuard` resuelve el usuario desde `Session`.
- No existían roles globales ni guards de rol.
- `UsersService` exponía un perfil público sin rol ni verificación.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | Mailpit + `nodemailer` con SMTP configurable. | Enviar solo por API externa. | Permite desarrollo local sin credenciales y producción con SES/Postmark. |
| D-02 | Token de email hasheado, un solo uso, 24 h. | Guardar token en claro. | Evita filtración y reutilización. |
| D-03 | Roles globales `ADMIN`, `TEACHER`, `STUDENT`. | Rol docente por proyecto. | La verificación es de identidad, no de contenido. |
| D-04 | `TeacherProfile` con estados y auditoría. | Booleano `isTeacher`. | Permite rechazo, revocación e historial. |
| D-05 | Bootstrap de admin por `ADMIN_EMAILS`. | Registro público de admin. | Evita escalada de privilegios. |

## 4. Cambios por capa

### Datos

- `User.role`, `User.emailVerifiedAt`.
- `EmailVerificationToken`, `TeacherProfile`, `AuditEvent`.
- Migración `20261116031011_academic_core`.
- Rollback: eliminar tablas y columnas nuevas; los usuarios existentes quedarían como `STUDENT`.

### Backend

- `EmailModule`/`EmailService` con `nodemailer`.
- `AuthService`: emisión y confirmación de tokens, bootstrap de admin.
- `TeacherService` y controladores de docente/admin.
- `RolesGuard` y decorador `@Roles`.
- `UsersService` incluye rol y estado docente en el perfil público.

### Frontend

- `/verify-email`.
- Tarjetas de correo y verificación docente en `/profile`.
- `/admin/teacher-verifications` con aprobar/rechazar.
- Insignia de docente en perfiles públicos.

### Infraestructura

- Servicio `mailpit` en Docker Compose (SMTP 1025, UI 8025).
- Variables `SMTP_*`, `APP_PUBLIC_URL`, `ADMIN_EMAILS`, `TEACHER_INSTITUTION_DOMAINS`.

## 5. Contratos

Ver `spec.md` §7. Todos los errores usan el formato uniforme y los códigos documentados.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Registro, Mailpit, confirmación, solicitud, aprobación y cambio de rol. | Script HTTP + Mailpit API |
| Unitario | Pendiente para Auth/Teacher. | Vitest |
| Regresión | Build, lint y tests existentes. | npm |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| SMTP caído | Media | Medio | Registro continúa y el fallo se registra; reenvío disponible. |
| Correo institucional sin confirmar | Media | Alto | La auto-verificación exige `emailVerifiedAt`. |
| Escalada de rol | Baja | Alto | Roles solo por admin/DB y auditoría. |
| Token reutilizado | Baja | Medio | Hash, un solo uso y expiración. |

## 8. Rollback

Revertir la migración elimina tokens, perfiles y auditoría. Los usuarios conservan sus cuentas pero pierden roles docentes y verificación. Detener Mailpit no afecta a la app.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | Nuevos enums y modelos |
| `src/common/email/*` | Servicio y módulo de correo |
| `src/modules/auth/*` | Verificación y bootstrap admin |
| `src/modules/teacher/*` | Verificación docente y admin |
| `src/common/guards/roles.guard.ts` | Guard de rol global |
| `infinipaper-frontend/app/profile/page.tsx` | Tarjetas de verificación |
| `infinipaper-frontend/app/admin/teacher-verifications/page.tsx` | Cola admin |
| `docker-compose.yml` | Mailpit y variables SMTP |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01–RF-04 | T-010, T-020, T-021 |
| RF-05–RF-11 | T-030, T-031, T-032 |
| RF-12–RF-14 | T-031, T-040 |
| CA-01–CA-09 | T-050 |
