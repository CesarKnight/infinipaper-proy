# Spec 004 · Aviso en el listado de carpeta

| Campo | Valor |
|---|---|
| ID | `004` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 003` (carpetas), `spec 005` (archivos), `spec 008` (permisos), `spec 009` (apuntes) |

## 1. Contexto y problema

Los participantes necesitan un canal de comunicación asíncrona dentro de cada carpeta: indicaciones de la unidad, tareas, fechas o enlaces. El aviso debe ser fácil de crear, visible para todos y editable por quienes tienen permisos, sin introducir una entidad nueva ni un sistema de notificaciones.

## 2. Objetivo

> Como **participante autorizado**, quiero **crear y mostrar un aviso en cada carpeta** para **comunicarme de forma asíncrona con los participantes**.

## 3. Alcance

### Incluye

- Aviso como archivo Markdown con nombre configurable (`AVISO_FILENAME`, por defecto `aviso.md`).
- Visible en el listado normal de archivos.
- Render al tope del visor de la carpeta cuando existe.
- Creación y edición con el editor Markdown compartido.
- Permisos Owner/Editor para escribir; Viewer solo lectura.
- Sanitización del HTML.
- Botón discreto "Crear aviso" cuando no existe.

### No incluye

- Múltiples avisos por carpeta.
- Avisos programados.
- Notificaciones push.
- Comentarios sobre el aviso.
- Resolución automática de imágenes relativas a otros archivos de la carpeta (v1).

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El aviso es un `Resource` con `kind = MARKDOWN` y nombre igual a `AVISO_FILENAME`. | Must |
| RF-02 | El aviso es visible en el listado normal de archivos. | Must |
| RF-03 | Al existir un aviso en una carpeta, su contenido se renderiza al tope del visor de esa carpeta. | Must |
| RF-04 | Puede existir como máximo un aviso por carpeta, incluida la raíz del proyecto. | Must |
| RF-05 | Owner y Editor pueden crear y editar; Viewer solo lee. | Must |
| RF-06 | Si no existe aviso, se muestra un botón discreto "Crear aviso" para Editor+. | Should |
| RF-07 | El editor es MDXEditor, compartido con los apuntes: WYSIWYG, toolbar y modo fuente. | Must |
| RF-08 | El render admite GFM (tablas, imágenes, listas de tareas) y se sanitiza contra XSS. | Must |
| RF-09 | El contenido se autoguarda al editar, con el mismo comportamiento que los apuntes. | Must |
| RF-10 | Si el contenido no es Markdown válido, la vista no se rompe: se degrada a texto legible. | Should |
| RF-11 | `AVISO_FILENAME` es configurable por variable de entorno. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La detección del aviso no requiere una consulta extra por archivo. | `noticeResourceId` en el detalle de carpeta. |
| RNF-02 | El HTML se sanitiza con `rehype-sanitize`. | Caso con `<script>` y `onerror`. |
| RNF-03 | El editor se carga de forma diferida. | `next/dynamic` con `ssr: false`. |
| RNF-04 | El aviso no bloquea el resto del listado si falla su carga. | Manejo de error local. |

## 6. Criterios de aceptación

### CA-01 · Sin aviso

- **Dada** una carpeta sin aviso,
- **entonces** se muestra el botón "Crear aviso" de forma discreta para Editor+.

### CA-02 · Crear aviso

- **Dado** un usuario Editor,
- **cuando** crea el aviso,
- **entonces** se crea `aviso.md` y se renderiza al tope.

### CA-03 · Viewer

- **Dado** un usuario Viewer,
- **cuando** intenta crear o editar el aviso,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-04 · GFM

- **Dado** un aviso con tablas e imágenes,
- **entonces** se renderizan correctamente tras sanitizar.

### CA-05 · XSS

- **Dado** un Markdown con HTML o script malicioso,
- **entonces** el contenido peligroso se elimina en el render.

### CA-06 · Nombre distinto

- **Dado** un archivo con nombre distinto a `AVISO_FILENAME`,
- **entonces** no se trata como aviso.

### CA-07 · Nombre configurable

- **Dado** que `AVISO_FILENAME` cambia por entorno,
- **entonces** el sistema detecta el nuevo nombre.

### CA-08 · Contenido inválido

- **Dado** un aviso ilegible o con Markdown inválido,
- **entonces** se muestra como texto sin error fatal.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/folders/:id` | Viewer+ | Incluye `noticeResourceId` si hay aviso |
| `POST` | `/api/v1/folders/:id/notice` | Editor+ | Crea el aviso (`{ content }`) |
| `GET` | `/api/v1/files/:id/text` | Viewer+ | Lee el contenido |
| `PUT` | `/api/v1/files/:id/content` | Editor+ | Guarda el contenido |

### Datos

- `Resource` con `kind = MARKDOWN`, `mimeType = text/markdown`.
- El nombre se compara con `AVISO_FILENAME` (por defecto `aviso.md`).
- No hay tabla `Notice`.

### UI

- `notice-panel.tsx`: render al tope, botón de creación, editor y autoguardado.
- Estados: sin aviso, cargando, editando, error de guardado.
- El aviso sigue apareciendo en `resource-list.tsx` como un archivo más.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Carpeta inexistente | Rechazar | `FOLDER_NOT_FOUND` · 404 |
| Sin permisos de edición | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Aviso inexistente | `noticeResourceId = null`; no es un error | — |
| Contenido >1.000.000 caracteres | Rechazar | `VALIDATION_ERROR` · 400 |
| HTML malicioso | Sanitizar | — |
| Fallo de red al guardar | Mostrar error y permitir reintentar | — |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Reutilizar `Resource` MARKDOWN en lugar de crear una entidad `Notice`. | Cerrada |
| D-02 | Detectar el aviso por nombre configurable, no por posición. | Cerrada |
| D-03 | Reutilizar editor y autoguardado de la spec 009. | Cerrada |
| Q-01 | ¿Se resolverán imágenes relativas a otros archivos de la carpeta? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Las imágenes y enlaces relativos dentro del aviso no se resuelven contra archivos de la misma carpeta. | El aviso puede mostrar imágenes rotas si el autor usa rutas relativas. | `T-050` |
| G-02 | No hay tests automatizados de detección, sanitización y permisos del aviso. | Regresiones no detectadas en CI. | `T-051` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02 | Creación y render del aviso verificados en el workspace. | 2026-11-05 |
| CA-03 | Revisión de `@RequireProjectRole('editor')`. | 2026-11-11 |
| CA-04, CA-05 | Revisión de `MarkdownView` y `rehype-sanitize`. | 2026-11-11 |
| CA-07 | Revisión de `AVISO_FILENAME` en la configuración. | 2026-11-11 |
