# Spec 002 · Proyectos

| Campo | Valor |
|---|---|
| ID | `002` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/002-proyectos.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Un proyecto es el espacio de estudio donde se organizan carpetas, archivos, avisos y apuntes. Necesita un propietario claro, una visibilidad configurable y una carpeta raíz desde la que crece todo el contenido. El propietario debe poder administrarlo sin que otros participantes modifiquen su configuración.

## 2. Objetivo

> Como **usuario**, quiero **crear y administrar proyectos de estudio** para **disponer de un espacio donde organizar mis recursos académicos**.

## 3. Alcance

### Incluye

- Crear, listar, ver, editar y eliminar proyectos.
- Visibilidad `PUBLIC` o `PRIVATE`.
- Carpeta raíz automática.
- Listado de proyectos propios, participados y públicos.
- Eliminación en cascada con limpieza de S3.
- Acceso anónimo de solo lectura a proyectos públicos.

### No incluye

- Etiquetas o categorías.
- Archivar proyecto.
- Transferir propiedad.
- Colaboración en tiempo real.
- Plantillas de proyecto.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Cada proyecto tiene exactamente un propietario (`ownerId`). | Must |
| RF-02 | Campos: `name` obligatorio, `description` opcional y `visibility` (`PUBLIC`/`PRIVATE`, por defecto `PRIVATE`). | Must |
| RF-03 | Al crear el proyecto se crea automáticamente una carpeta raíz (`isRoot = true`, `parentId = null`). | Must |
| RF-04 | Solo el Owner puede editar o eliminar el proyecto. | Must |
| RF-05 | Eliminar un proyecto borra en cascada carpetas, recursos, membresías y jobs, y limpia los objetos de S3. | Must |
| RF-06 | Un proyecto público es visible en solo lectura para cualquier usuario, incluso anónimo. | Must |
| RF-07 | "Mis proyectos" incluye propios y aquellos en los que participo; existe además un listado de públicos. | Must |
| RF-08 | Un proyecto inexistente o eliminado responde 404. | Must |
| RF-09 | El listado soporta paginación por cursor y filtro `scope=owned\|participating\|public\|all`. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Los permisos se comprueban en servidor con `ProjectAccessGuard`. | Revisión de controladores y tests de permisos. |
| RNF-02 | La eliminación es atómica a nivel de base y limpia S3 después. | Revisión de servicio y prueba manual. |
| RNF-03 | La lista es paginada y no carga todos los proyectos en memoria. | Contrato `cursor`/`limit`. |
| RNF-04 | La UI muestra estados de carga, vacío y error. | Revisión visual. |

## 6. Criterios de aceptación

### CA-01 · Crear proyecto

- **Dado** un usuario autenticado,
- **cuando** crea un proyecto con nombre válido,
- **entonces** el proyecto se crea con él como Owner.

### CA-02 · Carpeta raíz

- **Dado** un proyecto recién creado,
- **entonces** existe una carpeta raíz accesible.

### CA-03 · Nombre obligatorio

- **Dado** un proyecto sin nombre,
- **cuando** se intenta crear,
- **entonces** responde `400 VALIDATION_ERROR`.

### CA-04 · Edición restringida

- **Dado** un usuario no propietario,
- **cuando** intenta editar el proyecto,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-05 · Eliminación restringida

- **Dado** un usuario no propietario,
- **cuando** intenta eliminar el proyecto,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-06 · Eliminación por Owner

- **Dado** el Owner,
- **cuando** confirma la eliminación,
- **entonces** el proyecto y su contenido dejan de existir y se limpian sus objetos de S3.

### CA-07 · Proyecto público

- **Dado** un proyecto público,
- **cuando** un anónimo accede a su URL,
- **entonces** puede verlo en solo lectura.

### CA-08 · Proyecto inexistente

- **Dado** un proyecto inexistente o eliminado,
- **cuando** se accede,
- **entonces** responde `404 PROJECT_NOT_FOUND`.

### CA-09 · Listados

- **Dado** un usuario autenticado,
- **cuando** consulta sus proyectos,
- **entonces** ve propios y participados; el filtro `scope=public` muestra públicos.

## 7. Contratos e interfaces

### API

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/projects` | Sí | — | Crear |
| `GET` | `/api/v1/projects?scope=&cursor=&limit=` | Sí | — | Listar accesibles |
| `GET` | `/api/v1/projects/public?cursor=&limit=` | No | — | Listar públicos |
| `GET` | `/api/v1/projects/:id` | Opcional | Viewer+ | Ver detalle |
| `PATCH` | `/api/v1/projects/:id` | Sí | Owner | Editar |
| `DELETE` | `/api/v1/projects/:id` | Sí | Owner | Eliminar |

### Datos

- `Project`: `ownerId`, `name`, `description`, `visibility`.
- `Folder` raíz creada en la misma transacción.
- Las relaciones hijas usan `onDelete: Cascade`.

### UI

- `/projects`: listado con tabs o filtro por `scope`.
- `/projects/[projectId]`: workspace del proyecto.
- `/projects/[projectId]/settings`: edición y eliminación.
- Tarjeta de proyecto reutilizable en dashboard y listados.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Proyecto inexistente | Rechazar | `PROJECT_NOT_FOUND` · 404 |
| Sin permisos | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| DTO inválido | Rechazar | `VALIDATION_ERROR` · 400 |
| Eliminación con contenido | Borrar en cascada y limpiar S3 | 204 |
| Acceso anónimo a privado | Rechazar | `PROJECT_FORBIDDEN` · 403 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | El Owner vive en `Project.ownerId`, no en `ProjectMember`. | Cerrada |
| D-02 | La carpeta raíz se crea con el proyecto y no se puede eliminar. | Cerrada |
| D-03 | El listado público usa proyectos públicos recientes, sin recomendación. | Cerrada |
| Q-01 | ¿Se añadirá transferencia de propiedad en una spec futura? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados específicos de proyectos y cascada S3. | Regresiones de borrado no detectadas en CI. | `T-050` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02 | Creación de proyecto y carpeta raíz verificadas en flujo end-to-end. | 2026-11-05 |
| CA-04, CA-05, CA-09 | Revisión de `ProjectAccessGuard` y filtros `scope`. | 2026-11-11 |
| CA-06 | Revisión de eliminación en cascada y limpieza de S3. | 2026-11-11 |
