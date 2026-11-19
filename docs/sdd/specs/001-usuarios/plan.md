# Plan 001 · Usuarios, autenticación y sesiones

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-18 |

## 1. Resumen de la solución

El módulo `auth` gestiona registro, login, logout y la sesión actual. La contraseña se hashea con argon2; el token de sesión se genera con 32 bytes aleatorios y solo se persiste su hash SHA-256 en `Session`. La sesión viaja en una cookie `httpOnly`, lo que evita exponerla a JavaScript y mantiene el flujo same-origin.

El módulo `users` gestiona perfil, avatar, cambio de contraseña, búsqueda, perfil público y archivado. El avatar se guarda en MinIO. El archivado elimina los proyectos privados, las membresías, las sesiones y el avatar, y marca al usuario como `ARCHIVED`.

La identidad incorpora el rol global (`ADMIN`, `TEACHER`, `STUDENT`) y la confirmación de email coordinados con la spec 015. El registro asigna `STUDENT`; el perfil público muestra el rol y el estado docente, nunca el email ni la evidencia.

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
| D-06 | Rol global coordinado con 015 y permisos de proyecto con 008. | Duplicar reglas de roles en 001. | Evita contradicciones entre identidad, verificación y autorización. |
| D-07 | El archivado de cuenta no sustituye la revocación docente. | Archivar cursos automáticamente al archivar la cuenta. | Mantiene flujos y auditoría separados. |

## 4. Cambios por capa

### Datos

- `User` con `status`, `role` y `emailVerifiedAt`.
- `Session` con `tokenHash` único y `expiresAt`.
- `EmailVerificationToken` y `TeacherProfile` coordinados con 015.
- Sin migración pendiente en esta spec.

### Backend

- `auth.controller.ts`: register, login, logout, me y confirmación de email.
- `users.controller.ts`: perfil, contraseña, avatar, búsqueda, perfil público, archivado.
- `SessionService` y `PasswordService`.
- Validación de DTOs y errores uniformes.
- Rate limiting en endpoints sensibles.

### Frontend

- Páginas `/login`, `/register`, `/verify-email`, `/profile`, `/users`, `/users/[username]`.
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
| RF-15, RF-16 | `T-001`, `T-025` |
| RF-17, RF-18 | `T-026`, `T-035` |
| RF-19 | `T-023` |

## 11. Iteración de diseño de login (2026-11-18)

| Campo | Valor |
|---|---|
| Estado | `Completado` |
| Requisitos | `RF-20`–`RF-26`, `RNF-06`–`RNF-11`, `CA-17`–`CA-23` |

### 11.1 Enfoque

Sustituir la tarjeta centrada por una composición de dos columnas:

- **Panel de marca:** fondo `night`/`surface` con degradado índigo-violeta, textura sutil, logo del ratón en blanco, titular en Fraunces, frase de valor, tres capacidades del producto y una ilustración SVG de un espacio de estudio.
- **Formulario:** tarjeta elevada sobre el fondo Paper/Midnight, con los formularios de React Hook Form, validación Zod y llamadas `apiFetch`. Se añaden atributos `autoComplete` y estados de foco, sin cambiar la lógica.
- **Registro:** reutiliza el mismo `AuthShell` y `AuthCard`, con cuatro campos y el mismo tratamiento de errores.
- **Responsive:** dos columnas desde `lg`; en móvil el panel se reduce a una cabecera de marca y la ilustración se oculta.
- **Tema:** el panel de marca se mantiene oscuro en ambos temas; la columna del formulario usa tokens semánticos y responde a claro/oscuro.

### 11.2 Ilustración

Crear `public/brand/login-study.svg` con:

- Tarjetas de apuntes Markdown apiladas y una tarjeta destacada con líneas de texto, una fórmula y una lista.
- Una carpeta de proyecto y chips de archivos.
- Un nodo de IA con destellos y una minitarjeta de resumen.
- La mascota del ratón integrada en la composición.
- Degradado de marca índigo → violeta → coral, sin fuentes externas.
- `role="img"` y texto alternativo descriptivo al consumirla.

La ilustración se usará como imagen decorativa en el panel; el mensaje importante irá en texto HTML para no depender de la imagen.

### 11.3 Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-frontend/components/auth/auth-shell.tsx` | `AuthShell` y `AuthCard` compartidos por login y registro |
| `infinipaper-frontend/app/login/page.tsx` | Formulario de acceso con el shell compartido |
| `infinipaper-frontend/app/register/page.tsx` | Registro con el shell compartido, `autoComplete` y errores accesibles |
| `infinipaper-frontend/public/brand/login-study.svg` | Ilustración original del espacio de estudio |
| `infinipaper-frontend/app/globals.css` | Animación `login-float` con `prefers-reduced-motion` |

### 11.4 Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La ilustración SVG aumenta el peso de la página | Medio | SVG optimizado y sin imágenes embebidas; límite de 150 KB |
| El panel oscuro falla en tema claro | Medio | Texto blanco sobre `night`/`surface`, contraste verificado |
| El formulario pierde comportamiento | Alto | Mantener el mismo componente y flujo; probar login real |
| Scroll horizontal en móvil | Medio | Layout de una columna, `min-w-0` y medición a 320 px |
| Animación molesta | Bajo | Respetar `prefers-reduced-motion` |

### 11.5 Verificación

- `npm run lint` y `npm run build` en `infinipaper-frontend/`.
- Login real con un usuario de prueba y redirección a `next`.
- Registro real con un usuario de prueba y redirección a `/profile`.
- Revisión visual en 320, 375, 768, 1024 y 1440 px.
- Revisión en tema claro y oscuro, teclado y contraste.
- Registrar evidencia de `CA-17`–`CA-23`.

### 11.6 Rollback

Revertir `app/login/page.tsx`, `app/register/page.tsx`, `components/auth/` y eliminar `public/brand/login-study.svg`. No hay cambios de API, datos ni variables de entorno.

### 11.7 Resultado y trazabilidad

| Requisito | Evidencia / tarea |
|---|---|
| `RF-20`, `RF-21`, `CA-17` | Layout de dos columnas y panel de marca con ilustración; `T-060`, `T-061`. |
| `RF-22`, `CA-19` | Formulario conservado; login real con `?next=/projects`; `T-061`, `T-063`. |
| `RF-23`, `RNF-09`, `CA-18` | Apilado responsive sin overflow en 320/375/768 px; `T-062`, `T-063`. |
| `RF-24`, `RNF-06`, `RNF-10`, `CA-20` | Enlace a registro, `ThemeToggle`, foco visible y animación reducible; `T-062`. |
| `RF-25`, `RNF-11`, `CA-21`, `CA-22` | `/register` usa `AuthShell`/`AuthCard` y mantiene el layout responsive; `T-065`, `T-066`. |
| `RF-26`, `CA-23` | Registro real, validación y redirección a `/profile`; `T-065`, `T-067`. |
| `RNF-07`, `RNF-08` | SVG de 9 KB, sin recursos externos; lint/build correctos; `T-060`, `T-067`. |
| `G-03` | Resuelta: `/register` comparte el layout con `/login`; `T-065`. |

### 11.8 Extensión a `/register`

`AuthShell` centraliza el panel de marca, la ilustración, el tema y la columna desplazable; `AuthCard` centraliza la tarjeta, el acento degradado y la cabecera. Login y registro solo aportan su formulario y el enlace cruzado.

El registro conserva el esquema Zod, la llamada `apiFetch("/auth/register")` y la redirección a `/profile`. Se añadieron `autoComplete` (`name`, `username`, `email`, `new-password`), `FieldGroup`/`Field` y errores con `role="alert"`.

**Rollback:** revertir `app/register/page.tsx` y volver a la tarjeta anterior; `AuthShell`/`AuthCard` pueden conservarse para login. Sin cambios de API ni datos.
