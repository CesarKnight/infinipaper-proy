# Spec 009 · Apuntes Markdown con editor WYSIWYG y autoguardado

| Campo | Valor |
|---|---|
| ID | `009` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Última revisión | 2026-11-18 · refinamiento UX del editor (propuesta) |
| Dependencias | `spec 001` (usuarios), `spec 003` (carpetas), `spec 005` (archivos), `spec 008` (permisos), `spec 013` (sistema de diseño) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/009-apuntes.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

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
- Editor usable en el diálogo de creación de apunte, en el visor de archivo y en el aviso del proyecto, incluidos anchos móviles.
- Toolbar agrupada por función y localizada en español.
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
| RF-16 | El diálogo “Nuevo apunte” se adapta al viewport: ancho amplio en escritorio (hasta `sm:max-w-3xl`) y casi completo en móvil, con altura máxima limitada al alto dinámico de la pantalla. | Must |
| RF-17 | Dentro del diálogo, el editor ocupa una altura acotada y desplaza su contenido internamente; la toolbar y las acciones del diálogo permanecen visibles sin que el editor empuje el botón “Crear” fuera del viewport. | Must |
| RF-18 | La toolbar agrupa las acciones por función (historial, tipo de bloque, formato, listas, enlaces, insertar y modo de vista) y muestra tooltips y etiquetas en español. | Must |
| RF-19 | En anchos estrechos la toolbar reorganiza sus grupos en varias filas y no oculta controles ni provoca scroll horizontal de la página. | Should |
| RF-20 | Los diálogos, menús y popovers del editor (insertar imagen, insertar enlace, tipo de bloque, tablas y bloques de código) se muestran por encima del diálogo que contiene el editor y son interactuables. | Must |

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
| RNF-08 | La toolbar usa objetivos táctiles de al menos 32×32 px y separación suficiente en pantallas táctiles. | Medición de botones a 320–430 px. |
| RNF-09 | El diálogo del editor no provoca scroll horizontal entre 320 px y 1440 px; el contenido largo hace scroll dentro del editor cuando está en modal. Cualquier overflow de la página anfitriona se registra como brecha separada. | Prueba manual con anchos 320, 375, 768, 1024 y 1440 px. |
| RNF-10 | Tooltips, etiquetas de bloque y modos de vista de la toolbar se muestran en español. | Revisión de la toolbar en modo redacción y modo fuente. |
| RNF-11 | El contenedor de portales de MDXEditor queda por encima de los diálogos de la aplicación (`z-50`) y no intercepta clics cuando está vacío. | Inspección de `z-index` y `elementFromPoint` con el diálogo de apunte abierto. |

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

### CA-11 · Modal de apunte en móvil

- **Dado** un usuario Editor en una pantalla de 320–430 px de ancho,
- **cuando** abre “Nuevo apunte”,
- **entonces** el diálogo cabe en el viewport, no genera scroll horizontal propio, el editor tiene altura acotada con scroll interno y el botón “Crear” permanece visible.

### CA-12 · Modal de apunte en escritorio

- **Dado** un usuario Editor en una pantalla de 768 px o más,
- **cuando** abre “Nuevo apunte”,
- **entonces** el diálogo usa un ancho amplio (hasta `sm:max-w-3xl`), el editor aprovecha el espacio disponible y el contenido del apunte no desborda la altura del diálogo.

### CA-13 · Toolbar comprensible y alcanzable

- **Dado** el editor abierto en cualquier vista,
- **cuando** se recorre la toolbar con ratón, teclado o toque,
- **entonces** las acciones están agrupadas por función, muestran tooltips en español y todas son alcanzables sin scroll horizontal oculto.

### CA-14 · Tema y foco

- **Dado** el editor en tema claro u oscuro,
- **cuando** se enfoca la toolbar y se activan controles,
- **entonces** el contraste se mantiene, el estado activo es visible y el foco por teclado se distingue.

### CA-15 · Capas de los diálogos del editor

- **Dado** el diálogo “Nuevo apunte” abierto,
- **cuando** el usuario pulsa “Insertar imagen”, “Insertar enlace” o el selector de tipo de bloque,
- **entonces** el diálogo, menú o popover se muestra por encima del modal, recibe foco y permite interactuar.
- **Y** mientras el diálogo de imagen está abierto, el modal de apunte no recibe clics.

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

- **Listado de carpeta** (`resource-list.tsx`): botón “Nuevo apunte” para Editor+, diálogo con nombre y editor; el apunte aparece en la lista. El diálogo limita su altura al viewport y el editor usa altura acotada con scroll interno (RF-16, RF-17).
- **Visor de archivo** (`files/[fileId]/page.tsx`): para `MARKDOWN`, botón “Editar”, editor con autoguardado y estado, y vista de solo lectura al salir.
- **Aviso** (`notice-panel.tsx`): reutiliza el mismo editor y autoguardado (spec 004).
- **Toolbar** (`mdx-editor-inner.tsx`): grupos de historial, bloque, formato, listas, enlaces, insertar y modo de vista; tooltips en español y reorganización en varias filas en anchos estrechos (RF-18, RF-19).
- **Capas del editor**: los portales de MDXEditor (imagen, enlace, tipo de bloque, tablas) se muestran por encima del diálogo contenedor y no bloquean la página cuando están vacíos (RF-20, RNF-11).
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
| D-09 | Usar `mdxeditor-full-height` con una altura acotada por `dvh` en el modal, en lugar de dejar que el editor crezca sin límite. | Cerrada |
| D-10 | Localizar la toolbar con la prop `translation` de MDXEditor en lugar de reemplazar sus controles por botones propios. | Cerrada |
| D-11 | Permitir que la toolbar reorganice sus grupos en varias filas en anchos estrechos; se descarta el scroll horizontal porque oculta acciones. | Cerrada |
| D-12 | Elevar el contenedor de portales de MDXEditor a `z-index: 60` y delegar `pointer-events` a sus hijos, para que sus diálogos queden sobre los modales de la app sin bloquear clics cuando está vacío. | Cerrada |
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
| G-07 | A 320 px la página de carpeta (cabecera y barra de filtros/acciones) desborda horizontalmente antes de abrir el editor. | El diálogo del editor sí cabe en el viewport, pero no se puede afirmar que toda la vista móvil esté libre de scroll horizontal. | `T-078` |

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
| CA-11 | Verificación manual en Firefox a 320×568 y 375×667: diálogo de 304×511 px y 359×600 px, con 8 px de margen, footer visible (bottom 540/647) y editor con scroll interno; toolbar en 4 filas. | 2026-11-18 |
| CA-12 | Verificación manual a 768×800, 1024×800 y 1440×900: diálogo de 752 px (768) y 768 px (1024/1440), altura 720–735 px, footer visible y editor con scroll interno. | 2026-11-18 |
| CA-13 | Toolbar agrupada (Historial, Tipo de bloque, Formato de texto, Listas, Insertar contenido) con tooltips en español (`Negrita`, `Deshacer (Ctrl+Z)`) y selector `Redactar / Markdown` visible. | 2026-11-18 |
| CA-14 | Revisión visual en tema claro y oscuro: foco con `--ring`, estado activo con `--secondary` y contraste legible. | 2026-11-18 |
| RNF-08 | Botones de toolbar con `min-width`/`min-height` de 2rem (32 px), incluidos los controles sin `data-toolbar-item`. | 2026-11-18 |
| RNF-09 | El diálogo no introduce overflow horizontal a 320/375 px y el contenido largo hace scroll interno. Persiste overflow de la página de carpeta a 320 px (G-07). | 2026-11-18 |
| RNF-10 | Traducciones aplicadas a toolbar, tipos de bloque, modos y diálogos de enlace, imagen y tabla. | 2026-11-18 |
| CA-15, RNF-11 | Con el diálogo “Nuevo apunte” abierto, “Insertar imagen” y “Insertar enlace” se muestran por encima y centrados; el selector de tipo de bloque lista y aplica opciones. `elementFromPoint` en la cabecera del modal devuelve el overlay del diálogo de imagen, que queda por encima del modal `z-50`. | 2026-11-18 |

## 12. Iteración de refinamiento UX del editor (2026-11-18)

**Estado:** Implementada (2026-11-18). Ver evidencia en la sección 11.

### Problema observado

El diálogo “Nuevo apunte” reutiliza un `DialogContent` de ancho pequeño (`sm:max-w-sm`) y sin límite de altura. El editor MDXEditor crece con el contenido y su toolbar completa no cabe en anchos móviles; el resultado es un modal que desborda el viewport, un botón “Crear” que puede quedar fuera de pantalla y controles que solo se alcanzan con scroll horizontal.

Además, la toolbar actual usa iconos sin etiquetas localizadas y no separa visualmente los grupos de acciones, lo que dificulta reconocer qué hace cada control, sobre todo en pantallas táctiles.

### Resultado esperado

- El modal de creación se adapta a 320 px y a escritorio sin que el diálogo desborde el viewport.
- El editor tiene altura acotada dentro del modal, con scroll interno y toolbar siempre visible.
- La toolbar se agrupa por función y muestra tooltips en español.
- Los controles tienen objetivos táctiles suficientes y estados de foco/activo visibles en ambos temas.
- Los diálogos y menús del editor (imagen, enlace, tipo de bloque) quedan por encima del modal contenedor y son interactuables.

### Fuera de alcance de esta iteración

- Cambios en el backend, contratos de API, modelo de datos o autoguardado.
- Colaboración en tiempo real, historial de versiones o nuevas capacidades del editor.
- Rediseño del visor de solo lectura o de la app móvil (spec 026).

### Corrección de capas de los diálogos del editor

MDXEditor monta sus diálogos y popovers en `.mdxeditor-popup-container`, un contenedor al final del `body` con `z-index: 2`. El diálogo “Nuevo apunte” usa `z-index: 50`, por lo que los diálogos de imagen, enlace y los menús del editor quedaban detrás y no eran accesibles.

La corrección eleva el contenedor de portales a `z-index: 60` y mueve `pointer-events` a sus hijos, de modo que los flotantes del editor quedan por encima de los modales sin que el contenedor vacío intercepte clics (D-12, RF-20, RNF-11, CA-15).

### Archivos previstos

| Archivo | Cambio |
|---|---|
| `infinipaper-frontend/components/markdown/mdx-editor-inner.tsx` | Props de altura/relleno, traducción y agrupación de la toolbar |
| `infinipaper-frontend/components/markdown/markdown-editor.tsx` | Propagación de `className`, `fill` y skeleton con altura estable |
| `infinipaper-frontend/components/project/resource-list.tsx` | Diálogo “Nuevo apunte” responsive y editor acotado |
| `infinipaper-frontend/app/globals.css` | Estilos de toolbar, grupos, touch targets, scroll interno y foco |

### Trazabilidad

`RF-16`–`RF-20`, `RNF-08`–`RNF-11`, `CA-11`–`CA-15`; tareas `T-070`–`T-081` (con `T-078` pendiente, G-07) del [plan](./plan.md) y [tareas](./tasks.md).
