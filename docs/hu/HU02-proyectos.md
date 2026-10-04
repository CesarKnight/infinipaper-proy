# HU02 · Gestión de proyectos

| Campo | Valor |
|---|---|
| Módulo | Proyectos |
| Prioridad | Alta |
| Estimación | 5 PHU |
| Persona | Usuario autenticado |
| Dependencias | HU01 |

## 1. Objetivo

Como usuario, quiero crear y administrar proyectos de estudio para disponer de un espacio donde organizar mis recursos académicos.

## 2. Reglas de negocio

1. Cada proyecto tiene **exactamente un propietario** (`ownerId`).
2. Campos: `name` (obligatorio), `description` (opcional), `visibility` (`PUBLIC` | `PRIVATE`, por defecto `PRIVATE`).
3. Al crear el proyecto se crea automáticamente una **carpeta raíz** (`isRoot = true`, `parentId = null`).
4. Solo el **Owner** puede editar o eliminar el proyecto.
5. Eliminar un proyecto es una operación destructiva con confirmación; borra en cascada carpetas, recursos, membresías y jobs, y sus objetos en S3.
6. Un proyecto **público** es visible en solo lectura para cualquier usuario, incluso anónimo.
7. El listado "mis proyectos" incluye: propios + donde soy participante. Adicionalmente existe un listado de públicos.
8. Un proyecto eliminado o inexistente responde 404.

## 3. Precondiciones

- Usuario autenticado (para crear/editar/eliminar).
- Ver proyecto público: no requiere sesión.

## 4. Flujos

### 4.1 Crear proyecto
1. El usuario completa nombre, descripción y visibilidad.
2. El sistema valida, crea el proyecto y su carpeta raíz.
3. Redirige al visualizador del proyecto.

### 4.2 Visualizar proyectos
1. `/projects` lista los accesibles (propios + participante).
2. `/projects?scope=public` lista los públicos.

### 4.3 Editar proyecto
1. El Owner modifica nombre/descripción/visibilidad.
2. Puede acceder a la gestión de participantes (HU7) y permisos (HU8).

### 4.4 Eliminar proyecto
1. El Owner confirma en diálogo destructivo.
2. Se elimina en cascada y se limpian los objetos S3.

## 5. Criterios de aceptación

- **CA-1** Dado un usuario autenticado, cuando crea un proyecto con nombre válido, entonces el proyecto se crea con él como Owner.
- **CA-2** Dado un proyecto recién creado, entonces existe una carpeta raíz accesible.
- **CA-3** Dado un proyecto sin nombre, cuando se intenta crear, entonces `422 VALIDATION_ERROR`.
- **CA-4** Dado un usuario no propietario, cuando intenta editar información restringida, entonces `403 PROJECT_FORBIDDEN`.
- **CA-5** Dado un usuario no propietario, cuando intenta eliminar, entonces `403 PROJECT_FORBIDDEN`.
- **CA-6** Dado el Owner, cuando elimina confirmando, entonces el proyecto y su contenido dejan de existir.
- **CA-7** Dado un proyecto público, cuando un anónimo accede a su URL, entonces puede verlo en solo lectura.
- **CA-8** Dado un proyecto inexistente/eliminado, cuando se accede, entonces `404 PROJECT_NOT_FOUND`.
- **CA-9** Dado un usuario autenticado, entonces puede consultar tanto sus proyectos privados como públicos.

## 6. Contrato de API

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| POST | `/api/v1/projects` | Sí | — | Crear |
| GET | `/api/v1/projects?scope=&cursor=&limit=` | Sí | — | Listar accesibles |
| GET | `/api/v1/projects/public?cursor=&limit=` | No | — | Listar públicos |
| GET | `/api/v1/projects/:id` | Opcional | Viewer+ | Ver detalle |
| PATCH | `/api/v1/projects/:id` | Sí | Owner | Editar |
| DELETE | `/api/v1/projects/:id` | Sí | Owner | Eliminar |

## 7. Validaciones

| Campo | Regla |
|---|---|
| `name` | 1–120 |
| `description` | ≤ 2000 (opcional) |
| `visibility` | `PUBLIC` \| `PRIVATE` |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `PROJECT_NOT_FOUND` | 404 | Inexistente/eliminado |
| `PROJECT_FORBIDDEN` | 403 | Sin permisos |
| `VALIDATION_ERROR` | 422 | DTO inválido |

## 9. Fuera de alcance (v1)

Etiquetas/categorías de proyecto, archivar proyecto, transferir propiedad, proyectos colaborativos en tiempo real, plantillas.
