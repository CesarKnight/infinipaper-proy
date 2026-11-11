# Spec 003 · Carpetas

| Campo | Valor |
|---|---|
| ID | `003` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 002` (proyectos), `spec 008` (permisos) |

## 1. Contexto y problema

El contenido de un proyecto necesita una estructura jerárquica que permita agrupar materiales por tema, unidad o clase. La jerarquía debe ser navegable, segura ante ciclos y coherente al eliminar: borrar una carpeta no puede dejar recursos huérfanos ni objetos en S3.

## 2. Objetivo

> Como **participante autorizado**, quiero **gestionar una estructura jerárquica de carpetas** para **organizar el contenido académico**.

## 3. Alcance

### Incluye

- Carpeta raíz automática e inmutable.
- Subcarpetas anidadas mediante `parentId`.
- Crear, renombrar, mover y eliminar.
- Nombres únicos por padre.
- Borrado en cascada con limpieza de S3.
- Orden por nombre o fecha.
- Navegación por árbol.

### No incluye

- Papelera o restauración.
- Mover carpetas entre proyectos.
- Etiquetas de carpeta.
- Permisos por carpeta (son a nivel de proyecto).

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Todo proyecto tiene una carpeta raíz creada con el proyecto; no se puede eliminar ni mover. | Must |
| RF-02 | Las carpetas se anidan mediante `parentId` (auto-relación). | Must |
| RF-03 | Los nombres son únicos dentro del mismo padre (comparación case-insensitive en servicio). | Must |
| RF-04 | Solo Owner y Editor pueden crear, renombrar, mover y eliminar; Viewer solo navega. | Must |
| RF-05 | Eliminar una carpeta borra en cascada su subárbol y recursos, y limpia los objetos S3. | Must |
| RF-06 | No se puede mover una carpeta dentro de sí misma ni de un descendiente. | Must |
| RF-07 | El listado se puede ordenar por fecha de creación o alfabéticamente. | Must |
| RF-08 | Los recursos permanecen asociados a su carpeta. | Must |
| RF-09 | La raíz se muestra como nodo del árbol y permite navegar al proyecto. | Should |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La validación de ciclos es eficiente y no recorre todo el árbol innecesariamente. | Revisión de `folders.service.ts`. |
| RNF-02 | El borrado en cascada es transaccional en base y limpia S3. | Prueba manual y revisión. |
| RNF-03 | El árbol se carga sin bloquear la UI y muestra estados de carga. | Revisión visual. |
| RNF-04 | Los nombres no permiten `/` ni caracteres de control. | Validación de DTO. |

## 6. Criterios de aceptación

### CA-01 · Raíz

- **Dado** un proyecto,
- **entonces** existe una carpeta raíz que es padre de las demás.

### CA-02 · Crear subcarpeta

- **Dado** un usuario Editor,
- **cuando** crea una subcarpeta con nombre válido,
- **entonces** aparece bajo el padre.

### CA-03 · Nombre requerido

- **Dada** una carpeta sin nombre,
- **cuando** se intenta crear,
- **entonces** responde `400 VALIDATION_ERROR`.

### CA-04 · Nombre duplicado

- **Dado** un nombre duplicado en el mismo padre,
- **cuando** se intenta crear,
- **entonces** responde `409 FOLDER_NAME_TAKEN`.

### CA-05 · Renombrar

- **Dado** un usuario Editor,
- **cuando** renombra una carpeta,
- **entonces** el cambio se refleja.

### CA-06 · Mover

- **Dado** un usuario Editor,
- **cuando** mueve una carpeta,
- **entonces** cambia de ubicación sin ciclos.

### CA-07 · Ciclo

- **Dado** un intento de mover una carpeta dentro de su propio subárbol,
- **entonces** responde `422 FOLDER_CYCLE`.

### CA-08 · Viewer

- **Dado** un usuario Viewer,
- **cuando** intenta modificar,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-09 · Eliminar

- **Dado** un usuario Editor,
- **cuando** elimina una carpeta confirmando,
- **entonces** el subárbol y sus recursos se eliminan.

### CA-10 · Orden

- **Dado** un listado de carpetas,
- **cuando** se aplica orden por fecha o nombre,
- **entonces** se reordena correctamente.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/projects/:id/folders?sort=name\|createdAt` | Viewer+ | Árbol de carpetas |
| `POST` | `/api/v1/projects/:id/folders` | Editor+ | Crear `{ name, parentId? }` |
| `GET` | `/api/v1/folders/:id` | Viewer+ | Detalle |
| `PATCH` | `/api/v1/folders/:id` | Editor+ | Renombrar |
| `PATCH` | `/api/v1/folders/:id/move` | Editor+ | Mover `{ parentId }` |
| `DELETE` | `/api/v1/folders/:id` | Editor+ | Eliminar subárbol |

### Datos

- `Folder`: `projectId`, `parentId`, `name`, `isRoot`.
- `@@unique([projectId, parentId, name])`.
- `onDelete: Cascade` para subcarpetas y recursos.

### UI

- `folder-tree.tsx`: árbol con raíz y subcarpetas.
- Workspace: breadcrumbs, selección de carpeta y acciones.
- Diálogo de creación/renombrado y confirmación de borrado.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Nombre vacío | Rechazar | `VALIDATION_ERROR` · 400 |
| Nombre duplicado | Rechazar | `FOLDER_NAME_TAKEN` · 409 |
| Carpeta inexistente | Rechazar | `FOLDER_NOT_FOUND` · 404 |
| Movimiento circular | Rechazar | `FOLDER_CYCLE` · 422 |
| Mover/eliminar raíz | Rechazar | `FOLDER_ROOT_IMMUTABLE` · 422 |
| Sin permisos | Rechazar | `PROJECT_FORBIDDEN` · 403 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | La raíz es un nodo real de `Folder`, no una carpeta virtual. | Cerrada |
| D-02 | El borrado es en cascada con confirmación fuerte. | Cerrada |
| D-03 | La comparación de nombres es case-insensitive en servicio, aunque la unicidad de base sea sensible. | Cerrada |
| Q-01 | ¿Se añadirá arrastrar y soltar carpetas en una spec futura? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados específicos de ciclos, unicidad y cascada. | Regresiones de integridad no detectadas en CI. | `T-050` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02 | Árbol y creación de subcarpetas verificados en el workspace. | 2026-11-05 |
| CA-05, CA-06, CA-07 | Revisión de `folders.service.ts` y validación de ciclos. | 2026-11-11 |
| CA-08 | Revisión de `ProjectAccessGuard`. | 2026-11-11 |
| CA-09 | Revisión de cascada y limpieza S3. | 2026-11-11 |
