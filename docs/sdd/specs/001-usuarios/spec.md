# Spec 001 · Usuarios, autenticación y sesiones

| Campo | Valor |
|---|---|
| ID | `001` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-18 |
| Dependencias | — (fundacional; coordina roles/email con 008 y 015) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/001-usuarios.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Todas las capacidades de Infinipaper dependen de una identidad de usuario y de una sesión válida. Se necesita un registro sin fricción, login por email o username, edición de perfil con avatar, cambio de contraseña y una baja de cuenta que no deje proyectos privados huérfanos ni accesibles.

La autenticación debe funcionar con el frontend y el backend en orígenes distintos durante el desarrollo, sin exponer el token de sesión a JavaScript.

Desde las specs 008 y 015, la identidad incorpora un rol global (`ADMIN`, `TEACHER`, `STUDENT`), una confirmación de email y una verificación docente. Esta spec define la cuenta, la sesión y su ciclo de vida; las reglas detalladas de permisos y verificación viven en 008 y 015.

## 2. Objetivo

> Como **usuario**, quiero **crear mi cuenta, confirmar mi email, iniciar y cerrar sesión, editar mi información y archivar mi cuenta** para **acceder al sistema de estudio de forma segura y con una identidad reconocible**.
>
> Como **administrador**, quiero **que las cuentas tengan un rol global y un estado de email verificable** para **poder habilitar la verificación docente sin romper la seguridad de la cuenta**.

## 3. Alcance

### Incluye

- Registro, login y logout.
- Sesión server-side con cookie `httpOnly`.
- Perfil: `displayName`, `bio` y avatar.
- Cambio de contraseña con verificación de la actual.
- Búsqueda de usuarios y perfil público.
- Archivado de cuenta con cascada sobre proyectos privados.
- Confirmación de email y estado `emailVerifiedAt`.
- Rol global de la cuenta (`STUDENT` por defecto) y su exposición en el perfil público.
- Coordinación con la verificación docente de la spec 015.
- Configuración pública de límites.

### No incluye

- La lógica de aprobación, rechazo o revocación docente; vive en la spec 015.
- La matriz de permisos de proyecto; vive en la spec 008.
- Recuperación de contraseña.
- Segundo factor de autenticación.
- Seguir/dejar de seguir usuarios.
- Cambio de propietario de proyectos.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Registrar una cuenta con `username`, `email`, `displayName` y contraseña; la cuenta nace `ACTIVE`, con rol global `STUDENT`, y emite sesión. | Must |
| RF-02 | `username` y `email` son únicos e insensibles a mayúsculas; se normalizan a minúsculas. | Must |
| RF-03 | El login acepta email **o** username. | Must |
| RF-04 | La contraseña se almacena con argon2 y nunca en texto plano. | Must |
| RF-05 | La sesión usa una cookie `httpOnly` y un registro `Session` con token hasheado y expiración configurable. | Must |
| RF-06 | El usuario puede editar `displayName` y `bio`. | Must |
| RF-07 | El usuario puede subir un avatar jpg/png/webp de hasta 5 MB. | Must |
| RF-08 | Cambiar contraseña exige la contraseña actual. | Must |
| RF-09 | "Eliminar cuenta" archiva la cuenta (`ARCHIVED`) e invalida sus sesiones. | Must |
| RF-10 | Al archivar, se eliminan en cascada los proyectos privados del usuario; los públicos permanecen. Los proyectos de curso privados siguen esta regla; la revocación docente es un flujo aparte de 015. | Must |
| RF-11 | Un usuario archivado no puede iniciar sesión y su perfil responde 404. | Must |
| RF-12 | La búsqueda de usuarios requiere sesión y devuelve perfiles públicos. | Must |
| RF-13 | El logout elimina la sesión y limpia la cookie. | Must |
| RF-14 | El perfil público muestra información pública y proyectos públicos. | Must |
| RF-15 | `User.role` admite `ADMIN`, `TEACHER` y `STUDENT`; el registro público asigna `STUDENT` y nunca crea administradores. | Must |
| RF-16 | Al registrarse se emite un token de confirmación de email de un solo uso; el usuario puede iniciar sesión sin confirmar, pero no solicitar verificación docente hasta confirmar. | Must |
| RF-17 | El perfil público muestra el rol global y el estado de verificación docente, pero nunca el email, la evidencia ni el motivo de rechazo. | Must |
| RF-18 | Los roles globales no conceden acceso implícito a proyectos privados; el acceso se resuelve por la spec 008. | Must |
| RF-19 | El archivado de cuenta no elimina el `TeacherProfile` ni los `AuditEvent`; la revocación docente se gestiona en 015. | Must |

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

### CA-13 · Rol inicial y confirmación de email

- **Dado** un registro válido,
- **cuando** se crea la cuenta,
- **entonces** el rol es `STUDENT`, se envía un correo de confirmación y `emailVerifiedAt` queda nulo.

### CA-14 · Confirmación de email

- **Dado** un token válido,
- **cuando** el usuario confirma el correo,
- **entonces** `emailVerifiedAt` se establece y el token queda usado.

### CA-15 · Perfil público con rol

- **Dado** un usuario activo,
- **cuando** se consulta su perfil público,
- **entonces** se muestra su rol y estado docente, sin email ni evidencia.

### CA-16 · Archivado y rol docente

- **Dado** un docente con proyectos privados y públicos,
- **cuando** archiva su cuenta,
- **entonces** los privados se eliminan, los públicos permanecen y el perfil docente no se modifica automáticamente.

## 7. Contratos e interfaces

### API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Crear cuenta |
| `POST` | `/api/v1/auth/login` | No | Iniciar sesión |
| `POST` | `/api/v1/auth/email/verify/request` | Sí | Reenviar confirmación de email |
| `POST` | `/api/v1/auth/email/verify/confirm` | No | Confirmar email con token |
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

- `User`: `username`, `email`, `passwordHash`, `displayName`, `avatarUrl`, `bio`, `role`, `emailVerifiedAt`, `status`.
- `TeacherProfile` y `TeacherStatus` pertenecen a la spec 015; aquí solo se expone su estado en el perfil público.
- `Session`: `userId`, `tokenHash`, `expiresAt`.
- El avatar se guarda en MinIO con clave `avatars/{userId}`.

### UI

- `/login`, `/register`, `/verify-email`, `/profile`, `/users`, `/users/[username]`.
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
| Token de email inválido/expirado | No confirmar y permitir reenvío | `EMAIL_TOKEN_INVALID` / `EMAIL_TOKEN_EXPIRED` · 400/410 |
| Reenvío demasiado frecuente | Rechazar temporalmente | `EMAIL_RATE_LIMITED` · 429 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Guardar solo el hash SHA-256 del token de sesión, nunca el token en claro. | Cerrada |
| D-02 | "Eliminar cuenta" es un archivado lógico, no un borrado físico. | Cerrada |
| D-03 | El avatar se almacena en S3 y se sirve por el backend para no exponer MinIO. | Cerrada |
| D-04 | Normalizar username/email a minúsculas en lugar de aceptar variantes duplicadas. | Cerrada |
| D-05 | Los roles globales y la verificación docente se coordinan con 015; 001 solo define el rol inicial y su exposición. | Cerrada |
| D-06 | El archivado de cuenta no es la revocación docente: 015 conserva su propio flujo y auditoría. | Cerrada |
| Q-01 | ¿Se añadirá recuperación de contraseña en una spec futura? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados específicos de auth, sesiones, email y archivado. | Regresiones de seguridad no detectadas en CI. | `T-050` |
| G-02 | Sin recuperación de contraseña. | El usuario debe contactar soporte si la pierde. | `T-051` |
| G-03 | El registro conservaba la tarjeta centrada anterior; el login ya usa el layout de marca. | Resuelta: `/register` comparte `AuthShell` y `AuthCard` con `/login`. | `T-065` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02, CA-03 | Registro y duplicados verificados en el flujo end-to-end. | 2026-11-05 |
| CA-04, CA-05, CA-06 | Login con email/username y errores de credenciales revisados. | 2026-11-05 |
| CA-09, CA-10 | Revisión de `UsersService.archive` y cascada sobre proyectos privados. | 2026-11-11 |
| CA-13, CA-14 | Confirmación de email y token de un solo uso verificados en E2E de 015. | 2026-11-18 |
| CA-15 | Perfil público con rol y estado docente revisado en `UsersService`. | 2026-11-18 |
| CA-16 | Archivado de cuenta y conservación de proyectos públicos revisados. | 2026-11-18 |
| RNF-01, RNF-03 | Revisión de `SessionService` y cookie de sesión. | 2026-11-11 |

## 12. Iteración de diseño de login y registro (2026-11-18)

| Campo | Valor |
|---|---|
| Estado de la iteración | `Implementada` |
| Origen | Petición de modernizar `/login` con una imagen relacionada con el producto |
| Dependencias | 013 (sistema de diseño) y 014 (tema de marca) |

### 12.1 Contexto y problema

El login actual es una tarjeta pequeña y centrada sobre un fondo vacío. Funciona, pero no comunica qué es Infinipaper, no aprovecha la identidad visual de las specs 013/014 y ofrece poca orientación a un usuario nuevo.

### 12.2 Objetivo

> Como **visitante**, quiero **entender rápidamente qué ofrece Infinipaper y acceder con una experiencia visual cuidada** para **confiar en el producto y completar el inicio de sesión sin fricción**.

### 12.3 Alcance

**Incluye**

- Rediseño visual de `/login` con un layout de dos columnas en escritorio: panel de marca e ilustración a la izquierda y formulario a la derecha.
- Rediseño de `/register` con el mismo shell, panel de marca y tarjeta, adaptado a sus cuatro campos.
- Componentes compartidos `AuthShell` y `AuthCard` para evitar duplicar el layout entre login y registro.
- Ilustración SVG original relacionada con el producto: apuntes, carpetas, proyectos y generación con IA.
- Logo, propuesta de valor y mensajes breves de capacidades del producto.
- Adaptación responsive: una columna en móvil, panel de marca compacto y formulario a ancho completo.
- Conservar los formularios, la validación, el manejo de errores y las redirecciones existentes.
- Estados de foco visibles, contraste AA y respeto por `prefers-reduced-motion`.
- Enlaces visibles entre `/login` y `/register`.

**No incluye**

- Cambios en la API, la sesión, los DTOs o el backend.
- Cambios funcionales en el perfil o la recuperación de contraseña.
- Nuevas dependencias, fuentes o servicios externos.
- Fotografías de stock con licencia o recursos remotos.
- Rediseño de `/verify-email` en esta iteración.

### 12.4 Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-20 | `/login` usa un layout de dos columnas en pantallas grandes: panel de marca con ilustración y formulario de acceso. | Must |
| RF-21 | El panel de marca muestra el logo de Infinipaper, una frase de propuesta de valor y una ilustración SVG original relacionada con apuntes, proyectos e IA. | Must |
| RF-22 | El formulario conserva el login por correo o usuario, la validación, los estados `Entrando…`/error y la redirección a `next`. | Must |
| RF-23 | En móvil el layout se apila: marca compacta, formulario y enlace a registro, sin scroll horizontal a 320 px. | Must |
| RF-24 | El login incluye un enlace visible a `/register` y un acceso al cambio de tema claro/oscuro. | Should |
| RF-25 | `/register` reutiliza el mismo shell de marca, ilustración y tarjeta que `/login`. | Must |
| RF-26 | El registro conserva sus cuatro campos, validación, errores y redirección a `/profile`; añade `autoComplete` y errores accesibles. | Must |

### 12.5 Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-06 | Todos los textos de login y registro cumplen WCAG AA en claro y oscuro. | Revisión de contraste y navegación visual. |
| RNF-07 | La ilustración es un SVG local, sin recursos remotos ni fuentes externas, y pesa menos de 150 KB. | Revisión del archivo y del build. |
| RNF-08 | No se añaden dependencias ni se modifican contratos de API, datos o autenticación. | `git diff` y `npm run build`. |
| RNF-09 | El layout no provoca scroll horizontal a 320, 375, 768, 1024 y 1440 px. | Medición con el navegador. |
| RNF-10 | Las animaciones decorativas se desactivan con `prefers-reduced-motion`. | Revisión de CSS y emulación. |
| RNF-11 | Login y registro comparten `AuthShell` y `AuthCard`; el layout no se duplica entre páginas. | Revisión de imports y componentes. |

### 12.6 Criterios de aceptación

#### CA-17 · Login de escritorio

- **Dado** un visitante en una pantalla de escritorio,
- **cuando** abre `/login`,
- **entonces** ve un panel de marca con logo, propuesta de valor e ilustración, y un formulario de acceso claramente diferenciado.

#### CA-18 · Login móvil

- **Dado** un visitante en un viewport de 320 px,
- **cuando** abre `/login`,
- **entonces** la marca y el formulario se apilan sin scroll horizontal y todos los controles son accesibles.

#### CA-19 · Inicio de sesión sin regresiones

- **Dado** un usuario activo,
- **cuando** introduce credenciales válidas en el nuevo login,
- **entonces** inicia sesión y se redirige a `next` o al dashboard como antes.

#### CA-20 · Accesibilidad y temas

- **Dado** el login en tema claro u oscuro,
- **cuando** se navega con teclado y se revisan los contrastes,
- **entonces** el foco es visible, los textos cumplen AA y la ilustración no transmite información esencial sin alternativa textual.

#### CA-21 · Registro de escritorio

- **Dado** un visitante en una pantalla de escritorio,
- **cuando** abre `/register`,
- **entonces** ve el mismo panel de marca y el mismo estilo de tarjeta que en `/login`, con los cuatro campos del registro.

#### CA-22 · Registro móvil

- **Dado** un visitante en un viewport de 320 px,
- **cuando** abre `/register`,
- **entonces** el formulario se apila bajo la marca compacta, es desplazable y no provoca scroll horizontal.

#### CA-23 · Registro sin regresiones

- **Dado** un visitante con datos válidos,
- **cuando** completa el registro,
- **entonces** la cuenta se crea, se muestra el aviso de confirmación de correo y se redirige a `/profile` como antes.

### 12.7 Contratos e interfaces

- **UI:** `app/login/page.tsx`, `app/register/page.tsx`, `components/auth/auth-shell.tsx`, `public/brand/login-study.svg` y utilidades visuales en `app/globals.css`.
- **API:** sin cambios.
- **Datos:** sin cambios.

### 12.8 Decisiones

| ID | Decisión | Estado |
|---|---|---|
| D-08 | Usar una ilustración SVG original de marca en lugar de una fotografía de stock. | Cerrada |
| D-09 | Mantener el panel de marca oscuro en ambos temas para conservar el contraste y la identidad Midnight Study. | Cerrada |
| D-10 | No cambiar la lógica del formulario ni los contratos; el rediseño es visual y de composición. | Cerrada |
| D-11 | Extraer `AuthShell` y `AuthCard` para que login y registro compartan layout, tarjeta y estilos. | Cerrada |

### 12.9 Evidencia

| CA / RNF | Evidencia | Fecha |
|---|---|---|
| CA-17 | Revisión visual en 1024 × 768 y 1440 × 900: panel de marca con logo, titular, capacidades e ilustración; formulario en tarjeta separada. | 2026-11-18 |
| CA-18 | Revisión en 320 × 568, 375 × 667 y 768 × 900. `scrollWidth` igual a `clientWidth` en los tres anchos; el formulario se apila bajo la marca compacta. | 2026-11-18 |
| CA-19 | Login real con el usuario de prueba `logincheck` y `?next=/projects`: la sesión se creó y la redirección terminó en `/projects`. Envío vacío mostró los dos errores con `role="alert"`. | 2026-11-18 |
| CA-20 | Revisión en tema claro y oscuro; foco visible en campos y botón; textos del panel sobre `night`/`surface`; ilustración con `alt` descriptivo. | 2026-11-18 |
| CA-21, RNF-11 | Revisión de `/register` en 1024 × 768 y 1440 × 900: usa `AuthShell` y `AuthCard`, los mismos que `/login`, con cuatro campos y enlace a inicio de sesión. | 2026-11-18 |
| CA-22 | Revisión de `/register` en 320 × 568, 375 × 667 y 768 × 900; el formulario se apila, la tarjeta es desplazable y no hay overflow horizontal. | 2026-11-18 |
| CA-23 | Registro real con un usuario de prueba: la cuenta se creó, se mostró el aviso de confirmación y la redirección terminó en `/profile`. Envío vacío mostró los errores con `role="alert"`. | 2026-11-18 |
| RNF-07 | `public/brand/login-study.svg` pesa 9 KB y no referencia recursos externos. | 2026-11-18 |
| RNF-08, RNF-09 | `npm run lint` y `npm run build` pasan; la iteración no añade dependencias ni toca API o datos. Sin overflow horizontal en 320, 375, 768, 1024 y 1440 px. | 2026-11-18 |
| RNF-10 | `login-float` se desactiva con `prefers-reduced-motion: reduce` en `globals.css`. | 2026-11-18 |

### 12.10 Archivos implementados

- `infinipaper-frontend/components/auth/auth-shell.tsx`: `AuthShell` con panel de marca e ilustración y `AuthCard` compartida.
- `infinipaper-frontend/app/login/page.tsx`: formulario de acceso con el shell compartido.
- `infinipaper-frontend/app/register/page.tsx`: registro con el shell compartido, campos accesibles y `autoComplete`.
- `infinipaper-frontend/public/brand/login-study.svg`: ilustración original de apuntes, proyecto e IA.
- `infinipaper-frontend/app/globals.css`: animación decorativa `login-float` con respeto a `prefers-reduced-motion`.
