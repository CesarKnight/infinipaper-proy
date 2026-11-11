# Spec 007 · Participantes

| Campo | Valor |
|---|---|
| ID | `007` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 002` (proyectos), `spec 008` (permisos) |

## 1. Contexto y problema

Un proyecto puede ser individual o colaborativo. El Owner necesita incorporar a otros usuarios para que consulten o editen el contenido, y retirarlos cuando ya no deben tener acceso. La gestión debe ser simple, sin invitaciones pendientes ni roles personalizados.

## 2. Objetivo

> Como **Owner**, quiero **añadir y retirar participantes** para **permitir que otros usuarios colaboren en el contenido de mi proyecto**.

## 3. Alcance

### Incluye

- Búsqueda de usuarios existentes por email o username.
- Añadir participantes con rol Viewer por defecto.
- Listar participantes con su rol.
- Retirar participantes con revocación inmediata.
- Restricción de gestión al Owner.
- Visualización de participantes junto al proyecto.

### No incluye

- Invitaciones con aceptación o rechazo.
- Auto-salida del participante.
- Transferencia de propiedad.
- Notificaciones de invitación.
- Roles personalizados.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Solo el Owner gestiona participantes. | Must |
| RF-02 | La búsqueda de usuarios se hace por email o username. | Must |
| RF-03 | Al añadir, el rol por defecto es Viewer. | Must |
| RF-04 | Un usuario no puede aparecer más de una vez en el proyecto. | Must |
| RF-05 | Retirar un participante revoca su acceso de inmediato. | Must |
| RF-06 | El Owner no puede retirarse por esta vía. | Must |
| RF-07 | Los participantes se listan con su rol junto al visualizador del proyecto. | Must |
| RF-08 | No se requiere aceptación del invitado. | Must |
| RF-09 | El Owner puede cambiar el rol de un participante (detalle en spec 008). | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Las operaciones de gestión están protegidas en servidor con rol Owner. | Revisión de `@RequireProjectRole('owner')`. |
| RNF-02 | El listado es eficiente y no duplica al Owner como miembro. | Revisión de `members.service.ts`. |
| RNF-03 | La UI muestra estados de carga, vacío y error. | Revisión visual. |
| RNF-04 | Los cambios de rol se reflejan sin recargar la página. | Invalidación de React Query. |

## 6. Criterios de aceptación

### CA-01 · Buscar

- **Dado** el Owner,
- **cuando** busca por email o username,
- **entonces** ve usuarios existentes.

### CA-02 · Añadir

- **Dado** el Owner,
- **cuando** añade un usuario válido,
- **entonces** aparece en el listado con rol Viewer.

### CA-03 · Duplicado

- **Dado** un usuario ya participante,
- **cuando** se intenta añadir de nuevo,
- **entonces** responde `409 MEMBER_ALREADY_EXISTS`.

### CA-04 · Usuario inexistente

- **Dado** un usuario inexistente,
- **cuando** se intenta añadir,
- **entonces** responde `404 USER_NOT_FOUND`.

### CA-05 · No Owner

- **Dado** un participante,
- **cuando** un no-Owner intenta gestionar participantes,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-06 · Retirar

- **Dado** el Owner,
- **cuando** retira a un participante,
- **entonces** este pierde el acceso al proyecto.

### CA-07 · Owner

- **Dado** un intento de retirar al Owner,
- **entonces** responde `422 OWNER_CANNOT_BE_REMOVED`.

### CA-08 · Listado

- **Dado** un participante añadido,
- **entonces** aparece junto al visualizador del proyecto.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/users?query=` | Sí | Buscar usuarios (spec 001) |
| `GET` | `/api/v1/projects/:id/members` | Viewer+ | Listar participantes |
| `POST` | `/api/v1/projects/:id/members` | Owner | Añadir `{ userId, role? }` |
| `PATCH` | `/api/v1/projects/:id/members/:userId` | Owner | Cambiar rol (spec 008) |
| `DELETE` | `/api/v1/projects/:id/members/:userId` | Owner | Retirar |

### Datos

- `ProjectMember` con `projectId`, `userId`, `role`.
- `@@unique([projectId, userId])`.
- El Owner no tiene fila en `ProjectMember`.

### UI

- `participants-panel.tsx`: lista de participantes y Owner.
- `members-manager.tsx`: búsqueda, alta, cambio de rol y retirada.
- `/projects/[projectId]/settings`: gestión.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Ya es participante | Rechazar | `MEMBER_ALREADY_EXISTS` · 409 |
| Usuario inexistente o archivado | Rechazar | `USER_NOT_FOUND` · 404 |
| Retirar al Owner | Rechazar | `OWNER_CANNOT_BE_REMOVED` · 422 |
| No es Owner | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Miembro inexistente | Rechazar | `MEMBER_NOT_FOUND` · 404 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | El Owner no se modela como `ProjectMember`. | Cerrada |
| D-02 | Alta directa sin invitación. | Cerrada |
| D-03 | Rol inicial Viewer. | Cerrada |
| Q-01 | ¿Se añadirán invitaciones con aceptación? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados de alta, duplicado y retirada. | Regresiones de permisos no detectadas en CI. | `T-050` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02, CA-08 | Alta y listado verificados en configuración del proyecto. | 2026-11-05 |
| CA-03, CA-04, CA-07 | Revisión de `members.service.ts`. | 2026-11-11 |
| CA-05 | Revisión de `@RequireProjectRole('owner')`. | 2026-11-11 |
| CA-06 | Retirada y revocación revisadas. | 2026-11-11 |
