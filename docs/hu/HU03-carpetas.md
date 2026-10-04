# HU03 · Gestión de carpetas

| Campo | Valor |
|---|---|
| Módulo | Proyectos |
| Prioridad | Alta |
| Estimación | 8 PHU |
| Persona | Participante autorizado |
| Dependencias | HU01, HU02, HU08 |

## 1. Objetivo

Como participante autorizado, quiero gestionar una estructura jerárquica de carpetas para organizar el contenido académico.

## 2. Reglas de negocio

1. Todo proyecto tiene una **carpeta raíz** (`isRoot = true`), creada con el proyecto. No se puede eliminar ni mover.
2. Las carpetas se anidan vía `parentId` (auto-relación).
3. Nombres únicos dentro del mismo padre (comparación case-insensitive en servicio; único en BD por `(projectId, parentId, name)`).
4. Solo **Owner** y **Editor** pueden crear, renombrar, mover y eliminar. **Viewer** solo navega.
5. Al eliminar una carpeta se elimina en **cascada** su subárbol (subcarpetas y recursos), con confirmación fuerte. Los objetos S3 se limpian.
6. No se puede mover una carpeta dentro de sí misma ni de un descendiente (evitar ciclos).
7. El listado se puede ordenar por **fecha de creación** o **alfabéticamente**.
8. Los recursos permanecen asociados a su carpeta.

## 3. Precondiciones

- Proyecto existente y usuario con rol Editor u Owner.

## 4. Flujos

### 4.1 Crear carpeta
1. El usuario selecciona el proyecto o una carpeta padre.
2. Ingresa un nombre válido.
3. Se crea la carpeta.

### 4.2 Renombrar carpeta
1. El usuario con permisos cambia el nombre.

### 4.3 Mover carpeta
1. El usuario elige una nueva carpeta destino.
2. El sistema valida que no sea un descendiente.
3. Se actualiza `parentId`.

### 4.4 Eliminar carpeta
1. El usuario confirma (advirtiendo del borrado en cascada).
2. Se elimina el subárbol y los objetos S3.

### 4.5 Navegar
1. Se muestra el árbol/panal y los recursos de cada carpeta.
2. Orden por fecha o alfabético.

## 5. Criterios de aceptación

- **CA-1** Dado un proyecto, entonces existe una carpeta raíz que es padre de las demás.
- **CA-2** Dado un usuario Editor, cuando crea una subcarpeta con nombre válido, entonces aparece bajo el padre.
- **CA-3** Dada una carpeta sin nombre, cuando se intenta crear, entonces `422 FOLDER_NAME_REQUIRED`.
- **CA-4** Dado un nombre duplicado en el mismo padre, cuando se intenta crear, entonces `409 FOLDER_NAME_TAKEN`.
- **CA-5** Dado un usuario Editor, cuando renombra una carpeta, entonces el cambio se refleja.
- **CA-6** Dado un usuario Editor, cuando mueve una carpeta, entonces cambia de ubicación sin ciclos.
- **CA-7** Dado un intento de mover una carpeta dentro de su propio subárbol, entonces `422 FOLDER_CYCLE`.
- **CA-8** Dado un usuario Viewer, cuando intenta modificar, entonces `403 PROJECT_FORBIDDEN`.
- **CA-9** Dado un usuario Editor, cuando elimina una carpeta confirmando, entonces el subárbol y sus recursos se eliminan.
- **CA-10** Dado un listado de carpetas, cuando se aplica orden por fecha o nombre, entonces se reordena correctamente.

## 6. Contrato de API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/projects/:id/folders?sort=name\|createdAt` | Viewer+ | Árbol/panal de carpetas |
| POST | `/api/v1/projects/:id/folders` | Editor+ | Crear (`{ name, parentId? }`) |
| PATCH | `/api/v1/folders/:id` | Editor+ | Renombrar |
| PATCH | `/api/v1/folders/:id/move` | Editor+ | Mover (`{ parentId }`) |
| DELETE | `/api/v1/folders/:id` | Editor+ | Eliminar subárbol |

## 7. Validaciones

| Campo | Regla |
|---|---|
| `name` | 1–120, sin `/` ni caracteres de control |
| `parentId` | debe existir en el mismo proyecto |
| `sort` | `name` \| `createdAt` |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `FOLDER_NAME_REQUIRED` | 422 | Nombre vacío |
| `FOLDER_NAME_TAKEN` | 409 | Duplicado en el padre |
| `FOLDER_NOT_FOUND` | 404 | Inexistente |
| `FOLDER_CYCLE` | 422 | Movimiento circular |
| `FOLDER_ROOT_IMMUTABLE` | 422 | Mover/eliminar la raíz |
| `PROJECT_FORBIDDEN` | 403 | Sin permisos |

## 9. Fuera de alcance (v1)

Papelera/restauración, arrastrar carpetas entre proyectos, etiquetas de carpeta, permisos por carpeta (los permisos son a nivel de proyecto).
