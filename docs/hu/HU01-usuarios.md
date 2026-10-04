# HU01 · Gestión de usuarios

| Campo | Valor |
|---|---|
| Módulo | Usuarios |
| Prioridad | Alta |
| Estimación | 7 PHU |
| Persona | Usuario registrado |
| Dependencias | — (fundacional) |

## 1. Objetivo

Como usuario, quiero crear mi cuenta, iniciar y cerrar sesión, editar mi información y archivar mi cuenta, para acceder al sistema de estudio.

## 2. Reglas de negocio

1. `username` y `email` son únicos e **insensibles a mayúsculas** (se normalizan a minúsculas).
2. El login acepta **email o username**.
3. La contraseña se almacena con **argon2**; nunca en texto plano.
4. La sesión es una cookie `httpOnly` + registro en `Session`; expira a los `SESSION_TTL_DAYS` (7 por defecto).
5. Cambiar contraseña exige la contraseña actual.
6. "Eliminar" = **archivar** (`status = ARCHIVED`).
7. Al archivar: se **eliminan en cascada los proyectos privados**; los **públicos permanecen**.
8. Un usuario archivado no puede iniciar sesión y su perfil responde 404.
9. Todos los usuarios son iguales (sin roles de plataforma).
10. La búsqueda de usuarios requiere sesión.
11. Avatar: jpg/png/webp, ≤ 5 MB.

## 3. Precondiciones

- HU01 es la base de autenticación de todas las demás HUs.

## 4. Flujos

### 4.1 Registro
1. El usuario completa el formulario (username, email, displayName, contraseña).
2. El sistema valida formato y unicidad.
3. Se crea la cuenta `ACTIVE` y se emite la cookie de sesión.

### 4.2 Inicio de sesión
1. El usuario ingresa email/username + contraseña.
2. El backend verifica credenciales y estado.
3. Se emite la cookie y se crea `Session`.

### 4.3 Editar perfil
1. El usuario edita `displayName`, `bio` y avatar.
2. Se persisten los cambios.

### 4.4 Cambiar contraseña
1. Ingresa contraseña actual + nueva.
2. Se verifica la actual y se actualiza el hash.

### 4.5 Archivar cuenta
1. El usuario confirma la acción (diálogo destructivo).
2. Se marcan los privados en cascada; la cuenta pasa a `ARCHIVED`; se invalidan sesiones.

### 4.6 Buscar usuarios
1. El usuario consulta `query` por username/displayName.
2. Se listan perfiles con información pública.

### 4.7 Cerrar sesión
1. Se elimina la `Session` y se limpia la cookie.

## 5. Criterios de aceptación (Given/When/Then)

- **CA-1** Dado un email/username no registrado, cuando el usuario se registra con datos válidos, entonces se crea la cuenta y queda autenticado.
- **CA-2** Dado un username ya existente, cuando se intenta registrar, entonces el sistema responde `409` con `USER_USERNAME_TAKEN`.
- **CA-3** Dado un email ya existente, cuando se intenta registrar, entonces el sistema responde `409` con `USER_EMAIL_TAKEN`.
- **CA-4** Dado un usuario activo, cuando inicia sesión con su email **o** su username y la contraseña correcta, entonces recibe una cookie válida.
- **CA-5** Dado credenciales incorrectas, cuando intenta iniciar sesión, entonces recibe `401 AUTH_INVALID_CREDENTIALS` sin revelar cuál campo falló.
- **CA-6** Dado un usuario archivado, cuando intenta iniciar sesión, entonces recibe `403 AUTH_ACCOUNT_ARCHIVED`.
- **CA-7** Dado un usuario autenticado, cuando cambia la contraseña con la actual correcta, entonces la nueva contraseña queda activa y la actual falla.
- **CA-8** Dado un cambio de contraseña con la actual incorrecta, entonces recibe `403 AUTH_INVALID_PASSWORD`.
- **CA-9** Dado un usuario autenticado, cuando archiva su cuenta, entonces sus proyectos privados desaparecen y los públicos siguen accesibles; no puede volver a iniciar sesión.
- **CA-10** Dado un usuario archivado, cuando alguien visita su perfil, entonces recibe "usuario no encontrado" (404).
- **CA-11** Dado un usuario autenticado, cuando busca por coincidencia, entonces ve perfiles públicos con sus proyectos públicos.
- **CA-12** Dado un usuario autenticado, cuando cierra sesión, entonces la cookie se invalida y `GET /auth/me` responde 401.

## 6. Contrato de API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Crear cuenta |
| POST | `/api/v1/auth/login` | No | Iniciar sesión |
| POST | `/api/v1/auth/logout` | Sí | Cerrar sesión |
| GET | `/api/v1/auth/me` | Sí | Usuario actual |
| PATCH | `/api/v1/users/me` | Sí | Editar perfil |
| PUT | `/api/v1/users/me/password` | Sí | Cambiar contraseña |
| POST | `/api/v1/users/me/avatar` | Sí | Subir avatar (multipart) |
| DELETE | `/api/v1/users/me` | Sí | Archivar cuenta |
| GET | `/api/v1/users?query=&cursor=&limit=` | Sí | Buscar usuarios |
| GET | `/api/v1/users/:username` | Sí | Perfil público |
| GET | `/api/v1/config` | No | Límites y configuración pública |

## 7. Validaciones

| Campo | Regla |
|---|---|
| `username` | 3–30, `[a-z0-9_.-]`, único |
| `email` | formato email, único |
| `password` | ≥ 8 caracteres |
| `displayName` | 1–80 |
| `bio` | ≤ 280 (opcional) |
| `avatar` | jpg/png/webp, ≤ 5 MB |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `USER_USERNAME_TAKEN` | 409 | Username duplicado |
| `USER_EMAIL_TAKEN` | 409 | Email duplicado |
| `AUTH_INVALID_CREDENTIALS` | 401 | Login fallido |
| `AUTH_ACCOUNT_ARCHIVED` | 403 | Usuario archivado |
| `AUTH_INVALID_PASSWORD` | 403 | Contraseña actual incorrecta |
| `USER_NOT_FOUND` | 404 | Perfil inexistente/archivado |
| `VALIDATION_ERROR` | 422 | DTO inválido |

## 9. Fuera de alcance (v1)

Verificación de correo, recuperación de contraseña, segundo factor, roles de plataforma, seguir/dejar de seguir usuarios, cambio de propietario.
