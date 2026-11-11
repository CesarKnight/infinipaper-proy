# Plan 001 · Usuarios, autenticación y sesiones

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

El módulo `auth` gestiona registro, login, logout y la sesión actual. La contraseña se hashea con argon2; el token de sesión se genera con 32 bytes aleatorios y solo se persiste su hash SHA-256 en `Session`. La sesión viaja en una cookie `httpOnly`, lo que evita exponerla a JavaScript y mantiene el flujo same-origin.

El módulo `users` gestiona perfil, avatar, cambio de contraseña, búsqueda, perfil público y archivado. El avatar se guarda en MinIO. El archivado elimina los proyectos privados, las membresías, las sesiones y el avatar, y marca al usuario como `ARCHIVED`.

## 2. Contexto técnico actual

- `AuthGuard` global y decorador `@Public()` para rutas abiertas.
- `SessionService` para crear, validar y revocar sesiones.
- `PasswordService` para argon2.
- `UsersService` para perfil, avatar, búsqueda y archivado.
- `StorageService` para el avatar.
- `proxy.ts` en el frontend protege `/`, `/projects`, `/profile` y redirige según la cookie.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Cookie `httpOnly` + sesión server-side | JWT en localStorage | Evita XSS sobre el token y permite revocar sesiones |
| D-02 | Token opaco hasheado en base de datos | Guardar el token en claro | Limita el impacto de una fuga de base de datos |
| D-03 | Archivado lógico con cascada sobre proyectos privados | Borrado físico del usuario | Conserva proyectos públicos y contenido compartido |
| D-04 | Avatar en MinIO servido por backend | Exponer MinIO o guardar el binario en la base | Coherencia con el resto de archivos |
| D-05 | Login por email o username | Solo email | Mejora la experiencia sin coste adicional |

## 4. Cambios por capa

### Datos

- `User` con `status` y perfil.
- `Session` con `tokenHash` único y `expiresAt`.
- Sin migración pendiente en esta spec.

### Backend

- `auth.controller.ts`: register, login, logout, me.
- `users.controller.ts`: perfil, contraseña, avatar, búsqueda, perfil público, archivado.
- `SessionService` y `PasswordService`.
- Validación de DTOs y errores uniformes.
- Rate limiting en endpoints sensibles.

### Frontend

- Páginas `/login`, `/register`, `/profile`, `/users`, `/users/[username]`.
- Cliente API same-origin y React Query.
- Header con sesión y logout.
- Redirección a login para rutas protegidas.

### Infraestructura

- Variables `SESSION_TTL_DAYS`, `SESSION_COOKIE_NAME`, `COOKIE_SECURE`.
- Bucket de MinIO para avatares.

## 5. Contratos

```http
POST /api/v1/auth/register
{ "username": "ana", "email": "ana@example.com", "displayName": "Ana", "password": "..." }
```

```http
POST /api/v1/auth/login
{ "identifier": "ana@example.com", "password": "..." }
```

La respuesta de login/registro establece `Set-Cookie: session=...; HttpOnly; SameSite=Lax; Path=/`.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Registro, login, logout, perfil y archivado | Playwright |
| Unitario | `SessionService`, `PasswordService`, validaciones | Vitest (pendiente) |
| Seguridad | Cookie, rate limiting y respuestas sin token | Revisión y tests |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Fuga de token de sesión | Alto | Solo se persiste el hash; cookie `httpOnly` |
| Duplicados por mayúsculas | Medio | Normalización y unicidad en base de datos |
| Archivado deja proyectos privados accesibles | Alto | Transacción de borrado en cascada antes de marcar `ARCHIVED` |
| Fuerza bruta en login | Medio | Rate limiting |

## 8. Rollback

- Revertir código y, si se elimina la funcionalidad, conservar las tablas `User` y `Session`.
- Las cuentas archivadas no se restauran automáticamente; requiere intervención manual.
- No hay cambios de esquema pendientes en esta spec.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/auth/*` | Controlador, servicio, sesión y contraseña |
| `infinipaper-backend/src/modules/users/*` | Perfil, avatar, búsqueda y archivado |
| `infinipaper-backend/src/common/guards/auth.guard.ts` | Guard global |
| `infinipaper-frontend/app/login/page.tsx` | Login |
| `infinipaper-frontend/app/register/page.tsx` | Registro |
| `infinipaper-frontend/app/profile/page.tsx` | Perfil |
| `infinipaper-frontend/app/users/*` | Búsqueda y perfil público |
| `infinipaper-frontend/proxy.ts` | Rutas protegidas |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02, RF-03 | `T-010`, `T-011` |
| RF-04, RF-05 | `T-012`, `T-013` |
| RF-06, RF-07, RF-08 | `T-020`, `T-021` |
| RF-09, RF-10, RF-11 | `T-022`, `T-023` |
| RF-12, RF-14 | `T-024` |
| RF-13 | `T-014` |
| RF-15 | `T-001` |
