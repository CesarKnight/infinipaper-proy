# Spec 008 · Permisos y roles de proyecto

| Campo | Valor |
|---|---|
| ID | `008` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 002` (proyectos), `spec 007` (participantes) |

## 1. Contexto y problema

Los proyectos pueden ser privados o públicos y pueden tener varios colaboradores. Se necesita un modelo de permisos simple pero seguro: el propietario controla todo, los editores modifican contenido y los viewers solo consultan. La autorización debe aplicarse en el servidor en cada petición, no depender de la UI.

## 2. Objetivo

> Como **Owner**, quiero **asignar niveles de acceso a los participantes** para **controlar la visualización y edición del contenido**.

## 3. Alcance

### Incluye

- Tres roles: Owner, Editor y Viewer.
- Owner implícito en `Project.ownerId`.
- Un único rol por usuario y proyecto.
- Permisos a nivel de proyecto.
- Verificación en servidor mediante guards.
- Efecto inmediato de los cambios de rol.
- Acceso anónimo de solo lectura a proyectos públicos.

### No incluye

- Permisos por carpeta, archivo o recurso.
- Roles personalizados.
- Herencia de permisos.
- Auditoría de cambios de permisos.
- Delegación de administración.

## 4. Modelo de roles

| Rol | Descripción |
|---|---|
| **Owner** | Propietario único (`Project.ownerId`). Control total. No es una fila de `ProjectMember`. |
| **Editor** | Crea, edita y elimina carpetas, archivos, avisos y apuntes. Ejecuta transcripciones. |
| **Viewer** | Solo consulta. |

### Matriz de permisos

| Acción | Viewer | Editor | Owner |
|---|:---:|:---:|:---:|
| Ver proyecto, carpetas, archivos y apuntes | ✅ | ✅ | ✅ |
| Crear, editar o eliminar carpetas y archivos | ❌ | ✅ | ✅ |
| Crear, editar o eliminar aviso y apuntes | ❌ | ✅ | ✅ |
| Ejecutar transcripciones | ❌ | ✅ | ✅ |
| Gestionar participantes | ❌ | ❌ | ✅ |
| Asignar o modificar permisos | ❌ | ❌ | ✅ |
| Editar o eliminar el proyecto | ❌ | ❌ | ✅ |

## 5. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Solo el Owner asigna o modifica permisos. | Must |
| RF-02 | Un usuario tiene un único rol por proyecto. | Must |
| RF-03 | Los permisos son a nivel de proyecto, no por recurso. | Must |
| RF-04 | El backend verifica el permiso antes de ejecutar una operación restringida. | Must |
| RF-05 | Al cambiar un rol, el efecto es inmediato en las siguientes peticiones. | Must |
| RF-06 | El Owner no puede degradarse a sí mismo. | Must |
| RF-07 | Un Viewer nunca puede modificar contenido, aunque conozca el endpoint. | Must |
| RF-08 | Un proyecto público permite lectura anónima, pero no escritura. | Must |
| RF-09 | La jerarquía efectiva es `owner > editor > viewer > público(lectura)`. | Must |

## 6. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La resolución de rol es única y reutilizada por todos los módulos. | Revisión de `PermissionsService`. |
| RNF-02 | Los guards resuelven el proyecto desde `:projectId`, `:folderId` o `:fileId`. | Revisión de `ProjectAccessGuard`. |
| RNF-03 | Los errores de autorización no filtran información del proyecto. | Respuestas `PROJECT_FORBIDDEN`. |
| RNF-04 | Las consultas usan índices por propietario, miembro y visibilidad. | Revisión de Prisma. |

## 7. Criterios de aceptación

### CA-01 · Consultar roles

- **Dado** el Owner,
- **entonces** puede consultar el rol de cada participante.

### CA-02 · Asignar rol

- **Dado** el Owner,
- **cuando** asigna un rol,
- **entonces** se persiste.

### CA-03 · Viewer

- **Dado** un Viewer,
- **cuando** intenta modificar contenido,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-04 · Editor

- **Dado** un Editor,
- **cuando** crea, edita o elimina contenido,
- **entonces** la operación se permite.

### CA-05 · No Owner

- **Dado** un no-Owner,
- **cuando** intenta cambiar permisos,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-06 · Privado sin acceso

- **Dado** un usuario sin acceso a un proyecto privado,
- **cuando** consulta un recurso,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-07 · Público anónimo

- **Dado** un proyecto público,
- **cuando** un anónimo consulta contenido,
- **entonces** se permite solo lectura.

### CA-08 · Cambio inmediato

- **Dado** un cambio de rol,
- **cuando** el participante vuelve a operar,
- **entonces** el nuevo permiso aplica de inmediato.

## 8. Contratos e interfaces

### API

| Método | Ruta | Rol |
|---|---|---|
| `GET` | `/api/v1/projects/:id/members` | Viewer+ |
| `POST` | `/api/v1/projects/:id/members` | Owner |
| `PATCH` | `/api/v1/projects/:id/members/:userId` | Owner |
| `DELETE` | `/api/v1/projects/:id/members/:userId` | Owner |

### Diseño técnico

- `AuthGuard` global: valida la sesión y adjunta `request.user`.
- `ProjectAccessGuard`: recibe `:projectId`, `:folderId` o `:fileId`, resuelve el proyecto y calcula el rol efectivo.
- Decorador `@RequireProjectRole('viewer' | 'editor' | 'owner')`.
- `PermissionsService.resolveRole(userId | null, projectId)` es la única fuente de resolución.

### Datos

- `Project.ownerId` para Owner.
- `ProjectMember.role` para Editor/Viewer.
- `Project.visibility` para acceso público.

### UI

- `/projects/[projectId]/settings`: lista de participantes y selector de rol.
- El workspace oculta acciones según `canEdit`, pero el servidor decide.

## 9. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Rol insuficiente | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Participante inexistente | Rechazar | `MEMBER_NOT_FOUND` · 404 |
| Owner intenta cambiarse el rol | Rechazar | `OWNER_ROLE_IMMUTABLE` · 422 |
| Proyecto inexistente | Rechazar | `PROJECT_NOT_FOUND` · 404 |
| Anónimo en proyecto privado | Rechazar | `PROJECT_FORBIDDEN` · 403 |

## 10. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Owner implícito, sin fila en `ProjectMember`. | Cerrada |
| D-02 | Resolución de rol centralizada en un solo servicio. | Cerrada |
| D-03 | Permisos a nivel de proyecto. | Cerrada |
| Q-01 | ¿Se añadirán permisos granulares por carpeta? | Abierta (fuera de v1) |

## 11. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados de la matriz de permisos. | Una regresión podría abrir escritura a Viewer. | `T-050` |

## 12. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02 | Listado y cambio de rol verificados en configuración. | 2026-11-05 |
| CA-03, CA-04, CA-05 | Revisión de guards y decoradores. | 2026-11-11 |
| CA-06, CA-07 | Revisión de `PermissionsService.resolveRole` y visibilidad. | 2026-11-11 |
| CA-08 | Resolución de rol en cada request. | 2026-11-11 |
