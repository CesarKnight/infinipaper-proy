# Spec 012 · Confirmación de perfil docente (HU11)

| Campo | Valor |
|---|---|
| ID | `012` |
| Estado | `Aprobada` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `001` (Usuarios) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/012-confirmacion-perfil-docente.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md)

## 1. Contexto y problema

Para habilitar funciones académicas avanzadas como la creación y evaluación de cuestionarios tarea, la plataforma necesita distinguir qué usuarios cuentan con un perfil docente verificado sin alterar la igualdad base de cuentas ni requerir un registro separado.

## 2. Objetivo

> Como **usuario registrado**, quiero **confirmar mi perfil como docente** para **habilitar las herramientas de creación y gestión de cuestionarios académicos**.

## 3. Alcance

### Incluye

- Solicitud o confirmación de estado docente (`isTeacher` / `teacherVerifiedAt`) desde el perfil del usuario.
- Validación mediante código institucional o verificación académica.
- Visualización de insignia de docente verificado en el perfil.

### No incluye

- Panel administrativo complejo de aprobación manual por terceros (en v1 es autoconfirmación validada).
- Cambios en los permisos base de proyectos existentes (`Owner`, `Editor`, `Viewer`).

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Un usuario autenticado puede confirmar su perfil docente desde `/profile`. | Must |
| RF-02 | La confirmación requiere ingresar un código de verificación docente válido o correo institucional. | Must |
| RF-03 | Al confirmarse, el usuario adquiere el atributo `isTeacher = true` y se registra `teacherVerifiedAt`. | Must |
| RF-04 | Un usuario que ya tiene perfil docente confirmado no puede volver a ejecutar la confirmación. | Must |
| RF-05 | El endpoint `GET /api/v1/auth/me` y `GET /api/v1/users/:username` exponen el estado `isTeacher`. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El código de verificación docente se configura mediante variable de entorno (`TEACHER_VERIFICATION_CODE`). | Revisión de `.env.example` y `ConfigService`. |
| RNF-02 | Los DTOs validan el formato del código antes de procesar la solicitud. | Validación con `class-validator`. |

## 6. Criterios de aceptación

### CA-01 · Confirmación exitosa

- **Dado** un usuario autenticado con `isTeacher = false`,
- **cuando** envía el código de verificación docente correcto,
- **entonces** su perfil se actualiza a `isTeacher = true` y recibe respuesta `200 OK`.

### CA-02 · Código inválido

- **Dado** un usuario autenticado,
- **cuando** envía un código de verificación incorrecto,
- **entonces** responde `403 TEACHER_INVALID_CODE`.

### CA-03 · Perfil ya confirmado

- **Dado** un usuario que ya es docente (`isTeacher = true`),
- **cuando** intenta confirmar nuevamente,
- **entonces** responde `409 TEACHER_ALREADY_VERIFIED`.

## 7. Contratos e interfaces

### API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/users/me/teacher-verification` | Sí | Confirmar perfil docente |

### Datos

- `User`: añadir `isTeacher` (`Boolean`, default `false`) y `teacherVerifiedAt` (`DateTime?`).

### UI

- Sección "Perfil Docente" dentro de `/profile` con formulario de confirmación e insignia visual al estar verificado.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Código incorrecto | Rechazar solicitud | `TEACHER_INVALID_CODE` · 403 |
| Usuario ya verificado | Rechazar duplicado | `TEACHER_ALREADY_VERIFIED` · 409 |
| Usuario no autenticado | Rechazar | `UNAUTHORIZED` · 401 |
