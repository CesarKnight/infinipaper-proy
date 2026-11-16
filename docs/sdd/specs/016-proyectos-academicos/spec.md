# Spec 016 · Proyectos académicos y archivado

| Campo | Valor |
|---|---|
| ID | `016` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `001`, `002`, `008`, `015` |

## 1. Contexto y problema

`Project` es hoy un espacio genérico con carpetas, recursos y participantes. No distingue entre un proyecto personal y un curso, no tiene datos académicos y no contempla estudiantes como participantes. Tampoco existe un ciclo de archivado: los proyectos solo se pueden usar o eliminar.

Para que funcionen cuestionarios, tareas, paneles y MCP necesitamos:

- Proyectos personales para cualquier usuario.
- Proyectos tipo curso creados por docentes verificados.
- Estudiantes inscritos en el proyecto.
- Archivado con solo lectura temporal y purga posterior de archivos.

## 2. Objetivo

> Como **docente verificado**, quiero **crear y administrar proyectos de curso con estudiantes** para **organizar el material y las evaluaciones de una asignatura**.
>
> Como **Owner**, quiero **archivar un proyecto y limitar el acceso de solo lectura** para **cerrar un periodo sin perder el historial de inmediato**.

## 3. Alcance

### Incluye

- `Project.type = PERSONAL | COURSE`.
- Datos académicos: institución, periodo, asignatura y código.
- `ProjectMember.role = STUDENT` además de `EDITOR` y `VIEWER`.
- Proyectos de curso solo para docentes `VERIFIED`.
- Archivado con `archiveAccessUntil` por defecto de 30 días.
- Extensión y restauración por el Owner.
- Purga completa de archivos y contenido al vencer el plazo.
- Privacidad `PUBLIC`/`PRIVATE` y reglas para proyectos archivados.

### No incluye

- Múltiples docentes propietarios en un mismo proyecto.
- Matrícula automática desde SIS universitarios.
- Grupos, secciones o subcursos dentro de un proyecto.
- Facturación o límites por plan.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | `Project.type` distingue `PERSONAL` y `COURSE`; los proyectos existentes migran como `PERSONAL`. | Must |
| RF-02 | Un proyecto `COURSE` solo puede crearlo un `TEACHER` con `TeacherProfile.status = VERIFIED`. | Must |
| RF-03 | Un proyecto `COURSE` guarda institución, periodo, asignatura y código opcional. | Must |
| RF-04 | Cualquier usuario autenticado puede crear proyectos `PERSONAL`. | Must |
| RF-05 | El Owner puede añadir estudiantes como `ProjectMember.role = STUDENT`. | Must |
| RF-06 | Solo los estudiantes inscritos y el Owner/Editor pueden acceder a los recursos publicados del curso. | Must |
| RF-07 | El Owner puede archivar un proyecto; todos los participantes pasan a solo lectura. | Must |
| RF-08 | Al archivar se fija `archiveAccessUntil` a 30 días por defecto. | Must |
| RF-09 | El Owner puede extender el acceso o restaurar el proyecto antes del vencimiento. | Must |
| RF-10 | Al vencer `archiveAccessUntil`, un job elimina los archivos de MinIO y todo el contenido del proyecto. | Must |
| RF-11 | La purga deja solo un registro de auditoría sin contenido personal. | Must |
| RF-12 | Un proyecto archivado no aparece en listados públicos. | Must |
| RF-13 | Un administrador no obtiene acceso automático al contenido de proyectos privados. | Must |
| RF-14 | El Owner puede eliminar un proyecto activo o archivado con confirmación explícita. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La purga es idempotente y reintentable. | Test del job con ejecución duplicada. |
| RNF-02 | La eliminación de archivos cubre todos los objetos S3 del proyecto. | Test de integración con MinIO. |
| RNF-03 | Los guards evalúan rol global, rol de proyecto, estado y fecha de archivo. | Tests de permisos. |
| RNF-04 | La migración conserva todos los proyectos existentes. | Verificación de migración y conteos. |
| RNF-05 | La UI muestra cuenta atrás y estado archivado sin romper la navegación. | Revisión visual y build. |

## 6. Criterios de aceptación

### CA-01 · Crear proyecto personal

- **Dado** un usuario `STUDENT`, `TEACHER` o `ADMIN`,
- **cuando** crea un proyecto `PERSONAL`,
- **entonces** el proyecto se crea con Owner implícito y funciona como hoy.

### CA-02 · Crear proyecto de curso

- **Dado** un `TEACHER` verificado,
- **cuando** crea un proyecto `COURSE` con institución y periodo,
- **entonces** el proyecto se crea y muestra como curso.

### CA-03 · Estudiante no verificado intenta crear curso

- **Dado** un usuario `STUDENT` o un `TEACHER` no verificado,
- **cuando** intenta crear un proyecto `COURSE`,
- **entonces** recibe `TEACHER_VERIFICATION_REQUIRED` · 403.

### CA-04 · Inscribir estudiante

- **Dado** el Owner de un curso,
- **cuando** añade a un usuario como `STUDENT`,
- **entonces** el estudiante ve el contenido publicado y las tareas asignadas, pero no puede editar recursos.

### CA-05 · Archivar proyecto

- **Dado** un proyecto activo con participantes,
- **cuando** el Owner lo archiva,
- **entonces** todos los participantes pasan a solo lectura y se muestra `archiveAccessUntil`.

### CA-06 · Bloqueo de escritura

- **Dado** un proyecto archivado,
- **cuando** un Editor intenta crear, editar o borrar contenido,
- **entonces** recibe `PROJECT_ARCHIVED` · 423.

### CA-07 · Extensión

- **Dado** un proyecto archivado antes del vencimiento,
- **cuando** el Owner extiende 30 días,
- **entonces** `archiveAccessUntil` se actualiza y el acceso de lectura continúa.

### CA-08 · Purga al vencer

- **Dado** un proyecto cuyo `archiveAccessUntil` ya venció,
- **cuando** se ejecuta el job de purga,
- **entonces** se eliminan recursos, carpetas, cuestionarios, intentos y objetos S3; solo queda auditoría sin contenido.

### CA-09 · Privacidad

- **Dado** un proyecto `PRIVATE`,
- **cuando** un usuario ajeno intenta acceder,
- **entonces** recibe `404` o `403` sin revelar la existencia del proyecto.

### CA-10 · Acceso de administrador

- **Dado** un administrador autenticado,
- **cuando** intenta abrir un proyecto privado ajeno,
- **entonces** no obtiene acceso implícito al contenido.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/projects` | Autenticado | `{ name, type, institution?, period?, subject?, code?, visibility? }` | `Project` |
| `GET` | `/api/v1/projects` | Autenticado | `?scope=&type=&status=` | Lista paginada |
| `POST` | `/api/v1/projects/:id/members` | Owner | `{ userId, role: "STUDENT" }` | `ProjectMember` |
| `GET` | `/api/v1/projects/:id/members` | Owner/Editor | — | Participantes |
| `POST` | `/api/v1/projects/:id/archive` | Owner | `{ reason? }` | `Project` |
| `POST` | `/api/v1/projects/:id/archive/extend` | Owner | `{ days: 30 }` | `Project` |
| `POST` | `/api/v1/projects/:id/restore` | Owner | — | `Project` |
| `DELETE` | `/api/v1/projects/:id` | Owner | — | `204` |

### Datos

- `Project.type: PERSONAL | COURSE`.
- `Project.status: ACTIVE | ARCHIVED`.
- `Project.institution`, `period`, `subject`, `code`.
- `Project.archivedAt`, `archiveAccessUntil`.
- `ProjectRole.STUDENT`.
- Job `project-purge` en pg-boss.
- `AuditEvent` para archivo, extensión, restauración y purga.

### UI

- Creación de proyecto con selector “Personal” o “Curso”.
- Campos académicos visibles solo para cursos.
- Listado con badges de tipo, estado y cuenta atrás.
- Acciones de archivar, extender y restaurar en ajustes.
- Confirmación destructiva para eliminar.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Curso sin institución o periodo | Rechazar | `COURSE_METADATA_REQUIRED` · 422 |
| Docente revocado con cursos | Archivar cursos automáticamente | `TEACHER_REVOKED` · 200 |
| Proyecto ya archivado | No archivar dos veces | `PROJECT_ALREADY_ARCHIVED` · 409 |
| Extender proyecto no archivado | Rechazar | `PROJECT_NOT_ARCHIVED` · 409 |
| Purga con error de S3 | Reintentar y no borrar la base hasta completar S3 | `PROJECT_PURGE_FAILED` · 500 |
| Proyecto público archivado | Ocultar de listados públicos | `404` |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Extender `Project` en lugar de crear `Course` separado en v1. | Cerrada |
| D-02 | `ProjectMember` incorpora el rol `STUDENT`; Owner sigue implícito. | Cerrada |
| D-03 | Solo puede existir un docente propietario; los editores gestionan contenido. | Cerrada |
| D-04 | Archivado por 30 días por defecto, ampliable por el Owner. | Cerrada |
| D-05 | Al vencer se purgan archivos y contenido; queda auditoría sin datos personales. | Cerrada |
| Q-01 | ¿Se notificará al Owner antes del vencimiento? | Abierta (v1: email 7 días antes) |
| Q-02 | ¿La purga elimina también el registro `Project` o lo deja vacío? | Abierta (v1: eliminar y auditar) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin edición de metadatos académicos después de crear. | El Owner debe recrear el curso para cambiarlos. | `T-060` |
| G-02 | La UI de extensión usa 30 días fijos. | El backend admite 1–365 días, pero falta el selector. | `T-061` |
| G-03 | Sin tests automatizados de purga/guards. | La cobertura es E2E manual. | `T-062` |
| G-04 | Sin matrícula automática desde SIS ni múltiples docentes propietarios. | La inscripción es manual y solo hay un Teacher Owner. | `T-063` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01–CA-04 | Curso creado por docente verificado; estudiante y editor añadidos. | 2026-11-15 |
| CA-05–CA-07 | Archivado, bloqueo `423 PROJECT_ARCHIVED`, extensión y restauración. | 2026-11-15 |
| CA-08 | Purga manual de proyecto vencido: recurso S3/DB eliminado y proyecto `404`. | 2026-11-15 |
| CA-09–CA-10 | Privacidad y no acceso implícito de admin revisados en código. | 2026-11-15 |

> Plan y tareas: [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md).
