# Spec 009 · Apuntes Markdown con editor WYSIWYG y autoguardado

| Campo | Valor |
|---|---|
| ID | `009` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 003` (carpetas), `spec 005` (archivos), `spec 008` (permisos) |

## 1. Contexto y problema

Los proyectos de Infinipaper agrupan material académico en carpetas. Además de subir archivos, los participantes necesitan escribir apuntes propios dentro del proyecto: tomar notas de una clase, resumir una lectura o documentar una transcripción. Un formulario de texto plano no basta: el contenido debe poder estructurarse con títulos, listas, enlaces, tablas y bloques de código, y no debe perderse si el usuario olvida guardar.

La solución debe integrarse con el modelo de archivos existente para que los apuntes aparezcan junto al resto del material y respeten los mismos permisos del proyecto.

## 2. Objetivo

> Como **participante autorizado (Editor u Owner)**, quiero **crear y editar apuntes Markdown dentro de las carpetas del proyecto** para **registrar y organizar información académica sin perder cambios**.

El resultado esperado es un apunte persistente, visible en el listado de archivos, editable con un editor WYSIWYG y guardado automáticamente mientras se escribe.

## 3. Alcance

### Incluye

- Crear apuntes `.md` dentro de una carpeta del proyecto.
- Ver cualquier `.md` del proyecto como apunte editable.
- Editor WYSIWYG con barra de herramientas y modo de código fuente.
- Autoguardado con *debounce* y estado visible.
- Vista de solo lectura sanitizada.
- Permisos Owner/Editor (escritura) y Viewer (lectura).
- Renombrar y eliminar apuntes.
- Reutilizar el editor en el aviso del proyecto (spec 004).

### No incluye

- Edición colaborativa en tiempo real (CRDT/OT).
- Historial de versiones o *undo* persistente entre sesiones.
- Comentarios, resaltado de sintaxis avanzado o plantillas de apunte.
- Exportación a PDF.
- Resolución automática de imágenes relativas a otros archivos de la carpeta.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Crear un apunte en una carpeta existente como `Resource` con `kind = MARKDOWN`, `mimeType = text/markdown`, almacenado en MinIO. | Must |
| RF-02 | Todo archivo `.md` del proyecto es visible en el listado de archivos y editable como apunte. | Must |
| RF-03 | El editor es MDXEditor: WYSIWYG con encabezados, negrita/cursiva, tachado, código, listas, citas, enlaces, imágenes, tablas, separador, bloques de código, deshacer/rehacer y cambio a modo fuente. | Must |
| RF-04 | Al editar un apunte existente, el contenido se autoguarda con *debounce* de 1200 ms, sin acción explícita del usuario. | Must |
| RF-05 | El autoguardado solo envía una petición si el contenido cambió respecto al último guardado; no guarda al montar el editor. | Must |
| RF-06 | La UI muestra el estado `Guardando…`, `Guardado` o `Error al guardar`. | Must |
| RF-07 | La vista de solo lectura renderiza Markdown con `react-markdown` + `remark-gfm` y lo sanitiza con `rehype-sanitize`. | Must |
| RF-08 | Owner y Editor pueden crear, editar, renombrar y eliminar apuntes; Viewer solo puede leer. | Must |
| RF-09 | El servidor aplica los permisos; ocultar botones en la UI no sustituye la comprobación. | Must |
| RF-10 | Se permite guardar contenido vacío; al crear solo se exige un nombre y una carpeta válida. | Must |
| RF-11 | El nombre se normaliza a `.md` si el usuario no incluye la extensión. | Must |
| RF-12 | Los conflictos se resuelven *last-write-wins*; no hay bloqueo ni edición concurrente. | Must |
| RF-13 | Renombrar un apunte conserva su contenido y actualiza su nombre en el listado. | Should |
| RF-14 | Eliminar un apunte lo quita del listado, borra su registro y elimina el objeto de MinIO. | Must |
| RF-15 | El apunte conserva su estructura Markdown al cerrarlo y reabrirlo. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El editor se carga de forma diferida (`next/dynamic` con `ssr: false`) para no aumentar el bundle inicial de rutas que no lo usan. | Revisión del build y del componente `markdown-editor.tsx`. |
| RNF-02 | Todo HTML del Markdown se sanitiza al renderizar; no se ejecutan scripts ni atributos peligrosos. | Caso con `<script>` y `onerror`; revisión de `rehype-sanitize`. |
| RNF-03 | Una ráfaga de escritura genera como máximo una petición de guardado tras el retardo, no una por tecla. | Prueba manual con red/registro de peticiones. |
| RNF-04 | El editor respeta el tema claro/oscuro mediante tokens de `globals.css`. | Revisión visual en ambos temas. |
| RNF-05 | Los controles del editor son accesibles por teclado y tienen nombre accesible. | Navegación con Tab y revisión de la toolbar. |
| RNF-06 | El contenido máximo aceptado es de 1.000.000 de caracteres. | Validación de DTO y prueba con contenido límite. |
| RNF-07 | El guardado actualiza tamaño y checksum del recurso para mantener coherencia con la descarga. | Revisión de `updateContent` y verificación del recurso. |

## 6. Criterios de aceptación

### CA-01 · Crear apunte

- **Dado** un usuario con rol Editor en un proyecto con una carpeta válida,
- **cuando** crea un apunte con nombre y contenido,
- **entonces** se crea un `Resource` `MARKDOWN` visible en el listado y persistido en MinIO.

### CA-02 · Autoguardado

- **Dado** un apunte existente abierto en modo edición,
- **cuando** el usuario modifica el contenido y deja de escribir,
- **entonces** tras ~1200 ms se guarda automáticamente y se muestra `Guardado`.

### CA-03 · Persistencia de estructura

- **Dado** un apunte con títulos, listas, enlaces, tablas y bloques de código,
- **cuando** se guarda, se cierra y se vuelve a abrir,
- **entonces** la estructura Markdown se conserva.

### CA-04 · Viewer sin permisos de escritura

- **Dado** un usuario con rol Viewer,
- **cuando** intenta crear o guardar un apunte por API,
- **entonces** el servidor responde `403 PROJECT_FORBIDDEN` y no modifica nada.

### CA-05 · Carpeta inválida

- **Dado** un usuario Editor,
- **cuando** intenta crear un apunte en una carpeta inexistente,
- **entonces** la operación falla con un error 4xx y no se crea el recurso.

### CA-06 · Sanitización

- **Dado** un apunte con HTML malicioso (`<script>`, `onerror`),
- **cuando** se renderiza en solo lectura,
- **entonces** el HTML peligroso se elimina y no se ejecuta.

### CA-07 · Eliminar

- **Dado** un usuario Editor y un apunte existente,
- **cuando** confirma su eliminación,
- **entonces** desaparece del listado y se borran registro y objeto de MinIO.

### CA-08 · Conflictos

- **Dado** dos sesiones que editan el mismo apunte,
- **cuando** ambas guardan,
- **entonces** prevalece la última escritura recibida, sin bloqueo ni error de conflicto.

### CA-09 · Nombre sin extensión

- **Dado** un usuario que crea un apunte llamado `tema`,
- **cuando** se persiste,
- **entonces** el recurso se guarda como `tema.md`.

### CA-10 · Contenido vacío y límite

- **Dado** un usuario Editor,
- **cuando** guarda un apunte vacío,
- **entonces** se acepta; **cuando** supera 1.000.000 de caracteres, se rechaza con `VALIDATION_ERROR`.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/folders/:folderId/notes` | Editor+ | `{ name, content }` | `Resource` creado |
| `GET` | `/api/v1/files/:fileId` | Viewer+ | — | `Resource` |
| `GET` | `/api/v1/files/:fileId/text` | Viewer+ | — | `{ content: string }` |
| `GET` | `/api/v1/files/:fileId/content` | Viewer+ | — | Stream del archivo (soporta `Range`) |
| `PUT` | `/api/v1/files/:fileId/content` | Editor+ | `{ content }` | `Resource` actualizado |
| `PATCH` | `/api/v1/files/:fileId` | Editor+ | `{ name }` | `Resource` renombrado |
| `DELETE` | `/api/v1/files/:fileId` | Editor+ | — | `204 No Content` |

`CreateNoteDto`: `name` string de 1–255; `content` string de hasta 1.000.000 de caracteres. El servidor añade `.md` si falta.

`UpdateContentDto`: `content` string de hasta 1.000.000 de caracteres.

### Datos

No hay cambios de esquema específicos. Se reutiliza `Resource`:

| Campo | Uso en apuntes |
|---|---|
| `kind` | `MARKDOWN` |
| `mimeType` | `text/markdown` |
| `name` | Nombre visible, con extensión `.md` |
| `size` | Tamaño en bytes del contenido UTF-8 |
| `s3Key` | Clave del objeto en MinIO |
| `checksum` | Hash del contenido para coherencia |
| `authorId` | Autor del apunte |
| `folderId` | Carpeta contenedora |

Restricción existente: `@@unique([folderId, name])`.

### UI

- **Listado de carpeta** (`resource-list.tsx`): botón “Nuevo apunte” para Editor+, diálogo con nombre y editor; el apunte aparece en la lista.
- **Visor de archivo** (`files/[fileId]/page.tsx`): para `MARKDOWN`, botón “Editar”, editor con autoguardado y estado, y vista de solo lectura al salir.
- **Aviso** (`notice-panel.tsx`): reutiliza el mismo editor y autoguardado (spec 004).
- **Estados:** carga con skeleton, error de guardado con toast/indicador, lista vacía con mensaje.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Carpeta inexistente | No crear el recurso | `FOLDER_NOT_FOUND` · 404 |
| Sin rol Editor/Owner | Rechazar la operación | `PROJECT_FORBIDDEN` · 403 |
| Apunte inexistente | Rechazar la operación | `FILE_NOT_FOUND` · 404 |
| Recurso no Markdown | Rechazar lectura/escritura de texto | `FILE_UNSUPPORTED_TYPE` · 415 |
| Nombre duplicado en la carpeta | Rechazar y sugerir nombre | `FILE_NAME_TAKEN` · 409 |
| Nombre vacío o >255 | Rechazar | `VALIDATION_ERROR` · 400 |
| Contenido >1.000.000 caracteres | Rechazar | `VALIDATION_ERROR` · 400 |
| Fallo de red durante autoguardado | Mostrar error y permitir reintentar al seguir editando | `Error al guardar` |
| Dos editores simultáneos | Última escritura gana | Sin error de conflicto |
| HTML malicioso | Sanitizar al renderizar | — |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Usar MDXEditor en lugar de un textarea o un editor Markdown sin WYSIWYG, por su toolbar, modo fuente y soporte de tablas/código. | Cerrada |
| D-02 | Autoguardado *last-write-wins* sin colaboración en tiempo real; el alcance v1 no justifica CRDT/OT. | Cerrada |
| D-03 | El servidor normaliza el nombre a `.md` en lugar de rechazar nombres sin extensión; es más tolerante y evita fricción. | Cerrada |
| D-04 | Reutilizar el editor y el hook de autoguardado en el aviso del proyecto para no duplicar comportamiento. | Cerrada |
| Q-01 | ¿Se mantienen los códigos actuales o se alinean con un contrato más específico (`NOTE_LOCATION_REQUIRED` 422, `CONTENT_TOO_LARGE` 413)? | Abierta |
| Q-02 | ¿El límite debe ser 1 MB binario o 1.000.000 de caracteres? En UTF-8 un texto de 1.000.000 de caracteres puede superar 1 MB. | Abierta |
| Q-03 | ¿Se añade historial de versiones en una spec futura? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | El botón de eliminar del listado borra directamente, sin diálogo de confirmación. | CA-07 y el flujo de la spec piden confirmación; riesgo de borrado accidental. | `T-060` |
| G-02 | El endpoint `PATCH /files/:id` existe, pero no hay UI para renombrar un apunte. | RF-13 no es usable desde la interfaz. | `T-051` |
| G-03 | Los códigos de error no coinciden con los códigos específicos definidos inicialmente: carpeta inválida devuelve `FOLDER_NOT_FOUND` 404 (no `NOTE_LOCATION_REQUIRED` 422) y el exceso de contenido devuelve `VALIDATION_ERROR` 400 (no `CONTENT_TOO_LARGE` 413). | Contratos inconsistentes entre la especificación y la API real. | `T-062` |
| G-04 | El límite es de 1.000.000 de caracteres, no de 1 MB binario. | Un contenido UTF-8 puede pesar más de 1 MB. | `T-053` |
| G-05 | No hay tests automatizados específicos de apuntes (solo el test base del backend). | Regresiones en autoguardado, permisos o sanitización no se detectan en CI. | `T-054` |
| G-06 | No hay confirmación visual de “cambios sin guardar” al salir del editor antes del *debounce*. | El autoguardado cubre el caso normal, pero una salida inmediata puede perder la última edición. | `T-055` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02, CA-03 | Verificación manual con Playwright: creación, autoguardado, persistencia al reabrir y cero errores de consola. | 2026-11-05 |
| CA-04, CA-05 | Revisión de `ProjectAccessGuard` y `@RequireProjectRole('editor')`; caso de carpeta inexistente cubierto por `getFolderOrFail`. | 2026-11-11 |
| CA-06 | Revisión de `MarkdownView` con `rehype-sanitize`; pendiente prueba automatizada. | 2026-11-11 |
| CA-07 | Implementado en backend; falta confirmación en UI (G-01). | 2026-11-11 |
| CA-08 | Revisión de `updateContent` (*last-write-wins*); sin prueba concurrente. | 2026-11-11 |
| CA-09 | Revisión de `createNote`; normalización con `.md`. | 2026-11-11 |
| CA-10 | Revisión de `CreateNoteDto`/`UpdateContentDto`; falta prueba de límite. | 2026-11-11 |
| RNF-01 | Editor cargado con `next/dynamic` y `ssr: false`. | 2026-11-11 |
| RNF-05, RNF-06 | Build y lint limpios; falta auditoría de accesibilidad y prueba de límite. | 2026-11-11 |
