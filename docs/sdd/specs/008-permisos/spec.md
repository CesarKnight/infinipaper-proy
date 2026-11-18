# Spec 008 · Permisos y roles de proyecto

| Campo | Valor |
|---|---|
| ID | `008` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-18 |
| Dependencias | `001` (usuarios), `002` (proyectos), `007` (participantes), `015` (roles globales y docentes), `016` (proyectos de curso) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/008-permisos.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Los proyectos pueden ser privados o públicos y pueden tener varios colaboradores. Además, las cuentas tienen un rol global: `ADMIN`, `TEACHER` o `STUDENT`. El rol global no sustituye los permisos del proyecto: un docente verificado puede crear cursos y queda como Owner de ellos, pero en proyectos ajenos sigue sujeto a la membresía asignada. Un administrador verifica docentes y audita decisiones, sin acceso implícito al contenido privado. La autorización debe aplicarse en el servidor en cada petición, no depender de la UI.

## 2. Objetivo

> Como **Owner**, quiero **asignar editores, lectores y estudiantes a mi proyecto** para **controlar quién puede modificar contenido, quién solo consulta y quién participa en las evaluaciones**.
>
> Como **docente verificado**, quiero **crear proyectos de curso y administrar sus participantes** para **organizar mi asignatura manteniendo los permisos dentro del proyecto**.
>
> Como **administrador**, quiero **verificar o revocar docentes y auditar la decisión** para **habilitar la creación de cursos sin obtener acceso automático a proyectos privados**.

## 3. Alcance

### Incluye

- Roles globales `ADMIN`, `TEACHER` y `STUDENT`, coordinados con 001 y 015.
- Responsabilidad del `ADMIN`: verificar, rechazar y revocar docentes; auditar decisiones; no acceder implícitamente a proyectos privados.
- Permiso del `TEACHER` verificado: crear proyectos `COURSE` y quedar como Owner de ellos.
- Roles de proyecto: Owner, Editor, Viewer y Student.
- Owner implícito en `Project.ownerId`.
- Un único rol por usuario y proyecto.
- Permisos a nivel de proyecto; el rol global no los sustituye.
- El Owner asigna editores, lectores y estudiantes.
- Verificación en servidor mediante guards.
- Efecto inmediato de los cambios de rol.
- Acceso anónimo de solo lectura a proyectos públicos.
- Proyecto archivado: lectura para participantes; gestión reservada al Owner.

### No incluye

- Permisos por carpeta, archivo o recurso.
- Roles personalizados.
- Herencia de permisos.
- Acceso del admin al contenido privado sin ser miembro.
- Que un docente acceda a cursos ajenos sin membresía.
- Delegación de administración.
- Auditoría detallada de cada cambio de rol de proyecto en v1 (solo se audita la administración docente).

## 4. Modelo de roles

### Roles globales

| Rol global | Responsabilidad | Límite |
|---|---|---|
| **ADMIN** | Verifica, rechaza y revoca docentes; audita decisiones; gestiona bootstrap de administradores. | No obtiene acceso implícito a proyectos privados ni puede editar contenido sin membresía. |
| **TEACHER** | Docente con `TeacherProfile.status = VERIFIED`. Puede crear proyectos `COURSE` y es Owner de ellos. | En proyectos ajenos necesita membresía y rol de proyecto; no puede saltarse `ProjectAccessGuard`. |
| **STUDENT** | Rol global por defecto. Puede ser miembro `STUDENT` de un curso, responder tareas y ver su propio progreso. | No puede editar contenido ni ver notas de otros estudiantes. |

### Roles de proyecto

| Rol | Descripción |
|---|---|
| **Owner** | Propietario único (`Project.ownerId`). Control total. No es una fila de `ProjectMember`. |
| **Editor** | Crea, edita y elimina carpetas, archivos, avisos y apuntes. Ejecuta transcripciones. |
| **Viewer** | Solo consulta. |
| **Student** | Consulta el contenido publicado y participa en las evaluaciones asignadas; ve solo su propio progreso. |

### Matriz de permisos

| Acción | Student | Viewer | Editor | Owner |
|---|:---:|:---:|:---:|:---:|
| Ver proyecto, carpetas y contenido publicado | ✅ | ✅ | ✅ | ✅ |
| Ver cuestionarios asignados y su propio progreso | ✅ | ❌ | ❌ | ❌ |
| Crear, editar o eliminar contenido | ❌ | ❌ | ✅ | ✅ |
| Ejecutar transcripciones | ❌ | ❌ | ✅ | ✅ |
| Gestionar participantes | ❌ | ❌ | ❌ | ✅ |
| Asignar o modificar permisos | ❌ | ❌ | ❌ | ✅ |
| Editar o eliminar el proyecto | ❌ | ❌ | ❌ | ✅ |
| Archivar, extender o restaurar | ❌ | ❌ | ❌ | ✅ |

> El rol `Student` se resuelve como lectura para contenido, pero conserva semántica propia para tareas, intentos y progreso personal. El `ADMIN` no aparece en esta matriz porque no tiene permisos de proyecto implícitos.

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
| RF-09 | La jerarquía efectiva de contenido es `owner > editor > viewer/student > público(lectura)`. | Must |
| RF-10 | El rol global no concede acceso a proyectos privados; el acceso se resuelve por membresía y visibilidad. | Must |
| RF-11 | El `ADMIN` puede verificar, rechazar y revocar docentes con auditoría, pero no accede al contenido privado sin membresía. | Must |
| RF-12 | Un `TEACHER` con `TeacherProfile.status = VERIFIED` puede crear proyectos `COURSE` y queda como Owner. | Must |
| RF-13 | Solo el Owner asigna o modifica roles de proyecto `EDITOR`, `VIEWER` o `STUDENT`. | Must |
| RF-14 | Un proyecto archivado solo permite lectura a participantes que no son Owner; el Owner conserva la gestión y restauración. | Must |
| RF-15 | Un docente no puede acceder a un curso ajeno sin membresía, aunque sea `TEACHER` o `ADMIN`. | Must |

## 6. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La resolución de rol es única y reutilizada por todos los módulos. | Revisión de `PermissionsService`. |
| RNF-02 | Los guards resuelven el proyecto desde `:projectId`, `:folderId` o `:fileId`. | Revisión de `ProjectAccessGuard`. |
| RNF-03 | Los errores de autorización no filtran información del proyecto. | Respuestas `PROJECT_FORBIDDEN`. |
| RNF-04 | Las consultas usan índices por propietario, miembro y visibilidad. | Revisión de Prisma. |
| RNF-05 | La matriz de permisos incluye roles globales, `STUDENT` y proyectos archivados en tests automatizados. | Tests de permisos y acceso cruzado. |

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

### CA-09 · Administrador verifica docente

- **Dado** un administrador y una solicitud docente `PENDING`,
- **cuando** la aprueba o rechaza,
- **entonces** se actualiza el perfil docente, se registra auditoría y el rol global cambia según corresponda.

### CA-10 · Docente crea curso

- **Dado** un docente con email confirmado y perfil `VERIFIED`,
- **cuando** crea un proyecto `COURSE`,
- **entonces** el proyecto se crea y el docente queda como Owner.

### CA-11 · Admin sin acceso implícito

- **Dado** un administrador que no es miembro de un proyecto privado,
- **cuando** intenta abrir su contenido,
- **entonces** recibe `403 PROJECT_FORBIDDEN`.

### CA-12 · Docente en curso ajeno

- **Dado** un docente verificado que no pertenece a otro curso privado,
- **cuando** intenta acceder,
- **entonces** recibe `403` y no puede usar su rol global como bypass.

### CA-13 · Estudiante en proyecto

- **Dado** un estudiante miembro con rol `STUDENT`,
- **cuando** intenta editar contenido o notas de otros,
- **entonces** recibe `403`; solo ve contenido publicado, sus tareas y su progreso.

### CA-14 · Owner asigna roles de proyecto

- **Dado** el Owner de un curso,
- **cuando** añade o cambia un participante,
- **entonces** puede asignar `EDITOR`, `VIEWER` o `STUDENT`, y el cambio aplica de inmediato.

## 8. Contratos e interfaces

### API

| Método | Ruta | Rol |
|---|---|---|
| `GET` | `/api/v1/projects/:id/members` | Viewer+ |
| `POST` | `/api/v1/projects/:id/members` | Owner |
| `PATCH` | `/api/v1/projects/:id/members/:userId` | Owner |
| `DELETE` | `/api/v1/projects/:id/members/:userId` | Owner |

> La administración docente (`/admin/teacher-verifications`, revocación) pertenece a la spec 015. Esta spec define el efecto de esos roles sobre el acceso a proyectos, no duplica sus endpoints.

### Diseño técnico

- `AuthGuard` global: valida la sesión y adjunta `request.user`.
- `ProjectAccessGuard`: recibe `:projectId`, `:folderId` o `:fileId`, resuelve el proyecto y calcula el rol efectivo.
- Decorador `@RequireProjectRole('viewer' | 'editor' | 'owner')`.
- `PermissionsService.resolveRole(userId | null, projectId)` es la única fuente de resolución.

### Datos

- `User.role` para el rol global (`ADMIN`, `TEACHER`, `STUDENT`).
- `TeacherProfile.status` para habilitar la creación de cursos.
- `Project.ownerId` para Owner.
- `ProjectMember.role` para Editor/Viewer/Student.
- `Project.visibility` y `Project.status` para acceso público, privado y archivado.

### UI

- `/projects/[projectId]/settings`: lista de participantes y selector `Editor`, `Viewer` o `Student`.
- `/admin/teacher-verifications`: cola de verificación docente para `ADMIN`.
- Creación de proyectos `COURSE` visible solo para docentes verificados.
- El workspace oculta acciones según el rol, pero el servidor decide.

## 9. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Rol insuficiente | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Participante inexistente | Rechazar | `MEMBER_NOT_FOUND` · 404 |
| Owner intenta cambiarse el rol | Rechazar | `OWNER_ROLE_IMMUTABLE` · 422 |
| Proyecto inexistente | Rechazar | `PROJECT_NOT_FOUND` · 404 |
| Anónimo en proyecto privado | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Docente no verificado crea curso | Rechazar | `TEACHER_VERIFICATION_REQUIRED` · 403 |
| Admin sin membresía intenta abrir contenido | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Student intenta escribir | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Edición en proyecto archivado | Rechazar | `PROJECT_ARCHIVED` · 423 |

## 10. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Owner implícito, sin fila en `ProjectMember`. | Cerrada |
| D-02 | Resolución de rol centralizada en un solo servicio. | Cerrada |
| D-03 | Permisos a nivel de proyecto. | Cerrada |
| D-04 | Roles globales y roles de proyecto son capas distintas. | Cerrada |
| D-05 | Admin verifica docentes sin acceso implícito al contenido. | Cerrada |
| D-06 | Docente verificado crea cursos y queda como Owner. | Cerrada |
| D-07 | `Student` se resuelve como lectura de contenido y acceso propio a evaluaciones. | Cerrada |
| Q-01 | ¿Se añadirán permisos granulares por carpeta? | Abierta (fuera de v1) |

## 11. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados de la matriz de permisos. | Una regresión podría abrir escritura a Viewer/Student. | `T-050` |
| G-02 | Sin tests automatizados de admin, docente verificado y acceso cruzado. | El rol global podría convertirse en bypass accidental. | `T-051` |

## 12. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02 | Listado y cambio de rol verificados en configuración. | 2026-11-05 |
| CA-03, CA-04, CA-05 | Revisión de guards y decoradores. | 2026-11-11 |
| CA-06, CA-07 | Revisión de `PermissionsService.resolveRole` y visibilidad. | 2026-11-11 |
| CA-08 | Resolución de rol en cada request. | 2026-11-11 |
| CA-09, CA-10 | Aprobación docente y creación de curso verificadas en E2E de 015/016. | 2026-11-18 |
| CA-11, CA-12 | Admin y docente sin membresía revisados contra `PermissionsService`. | 2026-11-18 |
| CA-13, CA-14 | Rol `STUDENT` y asignación Owner revisados en E2E de 016/018. | 2026-11-18 |
