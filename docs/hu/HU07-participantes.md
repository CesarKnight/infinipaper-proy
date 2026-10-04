# HU07 · Gestión de participantes

| Campo | Valor |
|---|---|
| Módulo | Proyectos |
| Prioridad | Alta |
| Estimación | 5 PHU |
| Persona | Owner del proyecto |
| Dependencias | HU01, HU02, HU08 |

## 1. Objetivo

Como Owner, quiero añadir y retirar participantes para permitir que otros usuarios colaboren en el contenido de mi proyecto.

## 2. Reglas de negocio

1. Solo el **Owner** gestiona participantes (no hay rol Admin).
2. Se busca un usuario existente por **email o username**.
3. Al añadir, el permiso por defecto es **Viewer** (modificable en HU8).
4. Un usuario no puede aparecer más de una vez en el proyecto (`unique(projectId, userId)`).
5. Retirar un participante **revoca su acceso** de inmediato.
6. El Owner **no** puede retirarse por esta vía; el cambio de propietario está fuera de alcance v1.
7. Los participantes aparecen en un listado junto al visualizador del proyecto.
8. No requiere aceptación del invitado (se añade directamente).

## 3. Precondiciones

- Proyecto existente y usuario autenticado como Owner.

## 4. Flujos

### 4.1 Buscar participante
1. El Owner escribe email/username.
2. Se muestran coincidencias (usuarios activos).

### 4.2 Añadir participante
1. El Owner selecciona un usuario.
2. Se crea `ProjectMember` con rol Viewer.

### 4.3 Visualizar participantes
1. Se lista cada participante con su rol.

### 4.4 Retirar participante
1. El Owner confirma; se elimina la membresía y se revoca el acceso.

## 5. Criterios de aceptación

- **CA-1** Dado el Owner, cuando busca por email o username, entonces ve usuarios existentes.
- **CA-2** Dado el Owner, cuando añade un usuario válido, entonces aparece en el listado con rol Viewer.
- **CA-3** Dado un usuario ya participante, cuando se intenta añadir de nuevo, entonces `409 MEMBER_ALREADY_EXISTS`.
- **CA-4** Dado un usuario inexistente, cuando se intenta añadir, entonces `404 USER_NOT_FOUND`.
- **CA-5** Dado un participante, cuando un no-Owner intenta gestionar participantes, entonces `403 PROJECT_FORBIDDEN`.
- **CA-6** Dado el Owner, cuando retira a un participante, entonces este pierde el acceso al proyecto.
- **CA-7** Dado un intento de retirar al Owner, entonces `422 OWNER_CANNOT_BE_REMOVED`.
- **CA-8** Dado un participante añadido, entonces aparece junto al visualizador del proyecto.

## 6. Contrato de API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/users?query=` | Sí | Buscar usuarios (reutiliza HU1) |
| GET | `/api/v1/projects/:id/members` | Viewer+ | Listar participantes |
| POST | `/api/v1/projects/:id/members` | Owner | Añadir (`{ userId, role? }`) |
| PATCH | `/api/v1/projects/:id/members/:userId` | Owner | Cambiar rol (HU8) |
| DELETE | `/api/v1/projects/:id/members/:userId` | Owner | Retirar |

## 7. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `MEMBER_ALREADY_EXISTS` | 409 | Ya es participante |
| `USER_NOT_FOUND` | 404 | Usuario inexistente/inactivo |
| `OWNER_CANNOT_BE_REMOVED` | 422 | Retirar al Owner |
| `PROJECT_FORBIDDEN` | 403 | No es Owner |

## 8. Fuera de alcance (v1)

Invitaciones con aceptación/rechazo, auto-salida del participante, transferencia de propiedad, notificaciones de invitación, roles personalizados.
