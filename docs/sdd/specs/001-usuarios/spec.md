# Spec 001 · Usuarios, autenticación y sesiones

| Campo | Valor |
|---|---|
| ID | `001` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | — (fundacional) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/001-usuarios.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Todas las capacidades de Infinipaper dependen de una identidad de usuario y de una sesión válida. Se necesita un registro sin fricción, login por email o username, edición de perfil con avatar, cambio de contraseña y una baja de cuenta que no deje proyectos privados huérfanos ni accesibles.

La autenticación debe funcionar con el frontend y el backend en orígenes distintos durante el desarrollo, sin exponer el token de sesión a JavaScript.

## 2. Objetivo

> Como **usuario**, quiero **crear mi cuenta, iniciar y cerrar sesión, editar mi información y archivar mi cuenta** para **acceder al sistema de estudio de forma segura**.

## 3. Alcance

### Incluye

- Registro, login y logout.
- Sesión server-side con cookie `httpOnly`.
- Perfil: `displayName`, `bio` y avatar.
- Cambio de contraseña con verificación de la actual.
- Búsqueda de usuarios y perfil público.
- Archivado de cuenta con cascada sobre proyectos privados.
- Configuración pública de límites.

### No incluye

- Verificación de email.
- Recuperación de contraseña.
- Segundo factor de autenticación.
- Roles de plataforma.
- Seguir/dejar de seguir usuarios.
- Cambio de propietario de proyectos.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Registrar una cuenta con `username`, `email`, `displayName` y contraseña; la cuenta nace `ACTIVE` y emite sesión. | Must |
| RF-02 | `username` y `email` son únicos e insensibles a mayúsculas; se normalizan a minúsculas. | Must |
| RF-03 | El login acepta email **o** username. | Must |
| RF-04 | La contraseña se almacena con argon2 y nunca en texto plano. | Must |
| RF-05 | La sesión usa una cookie `httpOnly` y un registro `Session` con token hasheado y expiración configurable. | Must |
| RF-06 | El usuario puede editar `displayName` y `bio`. | Must |
| RF-07 | El usuario puede subir un avatar jpg/png/webp de hasta 5 MB. | Must |
| RF-08 | Cambiar contraseña exige la contraseña actual. | Must |
| RF-09 | "Eliminar cuenta" archiva la cuenta (`ARCHIVED`) e invalida sus sesiones. | Must |
| RF-10 | Al archivar, se eliminan en cascada los proyectos privados del usuario; los públicos permanecen. | Must |
| RF-11 | Un usuario archivado no puede iniciar sesión y su perfil responde 404. | Must |
| RF-12 | La búsqueda de usuarios requiere sesión y devuelve perfiles públicos. | Must |
| RF-13 | El logout elimina la sesión y limpia la cookie. | Must |
| RF-14 | El perfil público muestra información pública y proyectos públicos. | Must |
| RF-15 | No existen roles de plataforma: todos los usuarios son iguales. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Las contraseñas y tokens nunca se registran en logs ni se devuelven en respuestas. | Revisión de servicios y respuestas. |
| RNF-02 | El login y el registro están protegidos por rate limiting. | Configuración de `@nestjs/throttler`. |
| RNF-03 | La cookie es `httpOnly`, `SameSite=Lax` y `Secure` en producción. | Revisión de `SessionService` y despliegue HTTPS. |
| RNF-04 | Los DTOs validan formato y longitud antes de tocar la base de datos. | Tests de validación y Swagger. |
| RNF-05 | La UI cubre estados de carga, error y éxito. | Revisión de páginas de login, registro y perfil. |

## 6. Criterios de aceptación

### CA-01 · Registro

- **Dado** un email y username no registrados,
- **cuando** el usuario se registra con datos válidos,
- **entonces** se crea la cuenta y queda autenticado.

### CA-02 · Username duplicado

- **Dado** un username ya existente,
- **cuando** se intenta registrar,
- **entonces** responde `409 USER_USERNAME_TAKEN`.

### CA-03 · Email duplicado

- **Dado** un email ya existente,
- **cuando** se intenta registrar,
- **entonces** responde `409 USER_EMAIL_TAKEN`.

### CA-04 · Login por email o username

- **Dado** un usuario activo,
- **cuando** inicia sesión con su email **o** username y la contraseña correcta,
- **entonces** recibe una cookie válida.

### CA-05 · Credenciales incorrectas

- **Dado** credenciales incorrectas,
- **cuando** intenta iniciar sesión,
- **entonces** recibe `401 AUTH_INVALID_CREDENTIALS` sin revelar qué campo falló.

### CA-06 · Cuenta archivada

- **Dado** un usuario archivado,
- **cuando** intenta iniciar sesión,
- **entonces** recibe `403 AUTH_ACCOUNT_ARCHIVED`.

### CA-07 · Cambio de contraseña

- **Dado** un usuario autenticado,
- **cuando** cambia la contraseña con la actual correcta,
- **entonces** la nueva queda activa y la anterior falla.

### CA-08 · Contraseña actual incorrecta

- **Dado** un cambio de contraseña con la actual incorrecta,
- **entonces** recibe `403 AUTH_INVALID_PASSWORD`.

### CA-09 · Archivado de cuenta

- **Dado** un usuario autenticado,
- **cuando** archiva su cuenta,
- **entonces** sus proyectos privados desaparecen, los públicos siguen accesibles y no puede volver a iniciar sesión.

### CA-10 · Perfil archivado

- **Dado** un usuario archivado,
- **cuando** alguien visita su perfil,
- **entonces** recibe 404.

### CA-11 · Búsqueda

- **Dado** un usuario autenticado,
- **cuando** busca por coincidencia,
- **entonces** ve perfiles activos con su información pública.

### CA-12 · Logout

- **Dado** un usuario autenticado,
- **cuando** cierra sesión,
- **entonces** la cookie se invalida y `GET /auth/me` responde 401.

## 7. Contratos e interfaces

### API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Crear cuenta |
| `POST` | `/api/v1/auth/login` | No | Iniciar sesión |
| `POST` | `/api/v1/auth/logout` | Sí | Cerrar sesión |
| `GET` | `/api/v1/auth/me` | Sí | Usuario actual |
| `PATCH` | `/api/v1/users/me` | Sí | Editar perfil |
| `PUT` | `/api/v1/users/me/password` | Sí | Cambiar contraseña |
| `POST` | `/api/v1/users/me/avatar` | Sí | Subir avatar (multipart) |
| `DELETE` | `/api/v1/users/me` | Sí | Archivar cuenta |
| `GET` | `/api/v1/users?query=&cursor=&limit=` | Sí | Buscar usuarios |
| `GET` | `/api/v1/users/:username` | Sí | Perfil público |
| `GET` | `/api/v1/users/:username/avatar` | Sí | Avatar |
| `GET` | `/api/v1/config` | No | Límites públicos |

### Datos

- `User`: `username`, `email`, `passwordHash`, `displayName`, `avatarUrl`, `bio`, `status`.
- `Session`: `userId`, `tokenHash`, `expiresAt`.
- El avatar se guarda en MinIO con clave `avatars/{userId}`.

### UI

- `/login`, `/register`, `/profile`, `/users`, `/users/[username]`.
- Formularios con validación, estados de carga y errores legibles.
- El header muestra el usuario y permite cerrar sesión.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Username duplicado | Rechazar | `USER_USERNAME_TAKEN` · 409 |
| Email duplicado | Rechazar | `USER_EMAIL_TAKEN` · 409 |
| Login fallido | Rechazar sin filtrar campo | `AUTH_INVALID_CREDENTIALS` · 401 |
| Cuenta archivada | Rechazar login | `AUTH_ACCOUNT_ARCHIVED` · 403 |
| Contraseña actual incorrecta | Rechazar | `AUTH_INVALID_PASSWORD` · 403 |
| Perfil inexistente/archivado | Rechazar | `USER_NOT_FOUND` · 404 |
| DTO inválido | Rechazar | `VALIDATION_ERROR` · 400 |
| Avatar con formato no admitido | Rechazar | `FILE_UNSUPPORTED_TYPE` · 415 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Guardar solo el hash SHA-256 del token de sesión, nunca el token en claro. | Cerrada |
| D-02 | "Eliminar cuenta" es un archivado lógico, no un borrado físico. | Cerrada |
| D-03 | El avatar se almacena en S3 y se sirve por el backend para no exponer MinIO. | Cerrada |
| D-04 | Normalizar username/email a minúsculas en lugar de aceptar variantes duplicadas. | Cerrada |
| Q-01 | ¿Se añadirá recuperación de contraseña en una spec futura? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados específicos de auth, sesiones y archivado. | Regresiones de seguridad no detectadas en CI. | `T-050` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02, CA-03 | Registro y duplicados verificados en el flujo end-to-end. | 2026-11-05 |
| CA-04, CA-05, CA-06 | Login con email/username y errores de credenciales revisados. | 2026-11-05 |
| CA-09, CA-10 | Revisión de `UsersService.archive` y cascada sobre proyectos privados. | 2026-11-11 |
| RNF-01, RNF-03 | Revisión de `SessionService` y cookie de sesión. | 2026-11-11 |
