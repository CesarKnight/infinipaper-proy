# Spec 006 · Visualización multimedia

| Campo | Valor |
|---|---|
| ID | `006` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-18 |
| Dependencias | `spec 005` (archivos), `spec 008` (permisos) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/006-visualizacion.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

El material de estudio incluye imágenes, PDF, documentos ofimáticos, audio y video. El usuario necesita consultarlos sin descargarlos obligatoriamente y sin salir del proyecto. El visor debe elegirse según el tipo de recurso y respetar los permisos de acceso.

La visualización debe ser coherente con la identidad Paper & Ink / Midnight Study y dejar preparada la interfaz para una futura colaboración en tiempo real: la fuente binaria sigue siendo la verdadera, mientras el render es un adaptador de solo lectura reemplazable por editores colaborativos.

## 2. Objetivo

> Como **participante**, quiero **visualizar imágenes, PDF, documentos Word/Excel/PowerPoint y videos compatibles** para **consultar el material académico desde la plataforma con una experiencia consistente y preparada para colaborar en el futuro**.

## 3. Alcance

### Incluye

- Vista dedicada por recurso.
- Selección de visor según `kind`.
- Imagen con zoom y paneo.
- PDF en un marco visual propio.
- Vista previa de DOCX/DOCM/DOTX, XLSX/XLSM/CSV/ODS y PPTX/PPTM/PPSX/ODP.
- Audio y video con streaming `Range`.
- Formatos legacy `.doc`, `.xls`, `.ppt` con fallback de descarga.
- Descarga para formatos no soportados.
- Botón para volver a la carpeta.
- Permisos de lectura.
- Separación entre fuente binaria y adaptador de render para futura colaboración.

### No incluye

- Colaboración en tiempo real en esta versión.
- Edición ofimática completa o coautoría de DOCX/XLSX/PPTX.
- Anotaciones sobre documentos.
- Listas de reproducción.
- Transcodificación.
- Subtítulos.
- Render de formatos binarios legacy `.doc/.xls/.ppt` sin conversión.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema identifica el `kind` y elige el visor correspondiente. | Must |
| RF-02 | La visualización ocurre en una vista dedicada por recurso. | Must |
| RF-03 | El contenido se sirve por el backend con soporte de `Range`. | Must |
| RF-04 | Imágenes: se muestran ajustadas al contenedor. | Must |
| RF-05 | PDF: se muestra con el visor nativo del navegador en un `<iframe>` al contenido proxeado. | Must |
| RF-06 | DOCX/DOCM/DOTX: vista previa HTML de solo lectura en el cliente. | Must |
| RF-06b | XLSX/XLSM/CSV/ODS: vista previa tabular con selector de hojas. | Must |
| RF-06c | PPTX/PPTM/PPSX/ODP: vista previa de diapositivas en el cliente. | Must |
| RF-06d | Formatos legacy `.doc/.xls/.ppt`: fallback de descarga sin romper la vista. | Must |
| RF-07 | Audio: reproductor nativo con controles. | Must |
| RF-08 | Video: reproductor nativo con controles y *seeking*. | Must |
| RF-09 | Markdown: se renderiza con la vista sanitizada de la spec 009. | Must |
| RF-10 | El usuario puede volver a la carpeta de origen. | Must |
| RF-11 | Un recurso inaccesible responde 403/404. | Must |
| RF-12 | Imágenes: zoom y paneo con controles de restablecer y descargar. | Should |
| RF-13 | Video: MP4, M4V, MOV, WEBM y OGV con controles y *seeking*. | Must |
| RF-14 | Los visores comparten un marco visual con tokens de marca, tema claro/oscuro y acciones. | Should |
| RF-15 | El visor se carga de forma diferida por formato para no bloquear la vista. | Should |
| RF-16 | La fuente binaria y el render están desacoplados para permitir editores colaborativos futuros. | Should |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El streaming no carga el archivo completo en memoria del navegador. | Uso de `Range` y elementos nativos. |
| RNF-02 | La vista muestra estados de carga y error. | Revisión visual. |
| RNF-03 | El visor no expone URLs de MinIO. | El `src` apunta a `/api/v1/files/:id/content`. |
| RNF-04 | La vista es usable en tema claro y oscuro. | Revisión visual. |
| RNF-05 | Las librerías ofimáticas se cargan por *dynamic import* y no bloquean el primer render. | Build y revisión de bundle. |
| RNF-06 | El fallback de descarga está disponible si falla cualquier visor. | Revisión de UI y error. |

## 6. Criterios de aceptación

### CA-01 · Imagen

- **Dada** una imagen,
- **entonces** se muestra correctamente en la vista dedicada.

### CA-02 · PDF

- **Dado** un PDF,
- **entonces** se visualiza en el visor embebido del navegador.

### CA-03 · Documentos ofimáticos

- **Dado** un DOCX, XLSX o PPTX,
- **entonces** se muestra una vista previa de solo lectura.
- **Dado** un `.doc`, `.xls` o `.ppt` legacy,
- **entonces** se ofrece descarga sin bloquear la vista.

### CA-04 · Audio

- **Dado** un audio,
- **entonces** dispone de controles básicos de reproducción.

### CA-05 · Video

- **Dado** un video,
- **entonces** dispone de controles básicos y *seeking*.

### CA-06 · Selección de visor

- **Dado** un recurso,
- **entonces** el sistema identifica su `kind` antes de elegir el visor.

### CA-07 · Volver

- **Dado** que el usuario visualiza un recurso,
- **entonces** puede regresar a la carpeta.

### CA-08 · Sin visor

- **Dado** un formato no soportado por el visor,
- **entonces** se ofrece descarga.

### CA-09 · Sin acceso

- **Dado** un usuario sin acceso,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-10 · Imagen con zoom

- **Dada** una imagen,
- **cuando** el usuario usa los controles,
- **entonces** puede acercar, alejar, arrastrar y restablecer la vista.

### CA-11 · Formatos de video

- **Dado** un MP4, M4V, MOV, WEBM u OGV,
- **entonces** se ofrece reproducción o fallback de descarga si el códec no es compatible.

### CA-12 · Identidad visual

- **Dado** cualquier visor,
- **entonces** usa el marco visual de marca, tema claro/oscuro y acciones consistentes.

### CA-13 · Preparación colaborativa

- **Dado** un documento ofimático,
- **entonces** el render es de solo lectura y la fuente binaria queda separada para conectar un editor colaborativo futuro.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/files/:id` | Viewer+ | Metadatos para elegir visor |
| `GET` | `/api/v1/files/:id/content` | Viewer+ | Binario con `Range`/`Accept-Ranges` |
| `GET` | `/api/v1/files/:id/text` | Viewer+ | Texto para Markdown |

### Matriz de visores

| Kind | Formatos | Visor |
|---|---|---|
| `IMAGE` | jpg, png, webp, gif, avif | `ImageViewer` con zoom/paneo |
| `DOCUMENT` | pdf | `PdfViewer` con `<iframe>` proxeado |
| `DOCUMENT` | docx, docm, dotx | `docx-preview` en cliente |
| `DOCUMENT` | xlsx, xlsm, csv, ods | `xlsx` + tabla React |
| `DOCUMENT` | pptx, pptm, ppsx, odp | `pptx-preview` en cliente |
| `DOCUMENT` | doc, xls, ppt | Descarga/fallback |
| `AUDIO` | mp3, wav, ogg, m4a | `<audio>` nativo |
| `VIDEO` | mp4, m4v, mov, webm, ogv | `VideoViewer` con `<video>` y fallback |
| `MARKDOWN` | md | Render sanitizado |

### UI

- Ruta `/projects/[projectId]/files/[fileId]`.
- Botón de volver a la carpeta.
- Marco `ViewerShell` con badge de formato, título, subtítulo y acciones.
- Botón de descarga siempre disponible.
- Para audio, además, acciones de transcripción (spec 010).
- Los visores ofimáticos muestran “solo lectura · base preparada para colaboración”.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Formato sin visor | Ofrecer descarga | — |
| Recurso inexistente | Rechazar | `FILE_NOT_FOUND` · 404 |
| Sin acceso | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Archivo dañado | Informar y ofrecer descarga | — |
| Fallo de carga | Mostrar error local | — |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | PDF con visor nativo mediante `<iframe>` | `react-pdf`/PDF.js | Evita worker y mantiene same-origin |
| D-02 | Audio/video con elementos nativos | Librería de reproducción | Menos dependencias y `Range` nativo |
| D-03 | Render ofimático en cliente con carga diferida | Conversión en servidor | Menos infraestructura y sin subir el archivo a terceros |
| D-04 | Marco visual común de visores | Estilos nativos por formato | Consistencia con Paper & Ink / Midnight Study |
| D-05 | Fuente binaria + adaptador de render | Editar directamente el binario | Permite sustituir el render por un editor colaborativo sin cambiar almacenamiento |
| Q-01 | ¿Se añadirá navegación de páginas y anotaciones PDF? | Abierta |
| Q-02 | ¿La colaboración en tiempo real usará Yjs/CRDT sobre una representación editable? | Abierta (diseño futuro) |
| Q-03 | ¿Se convertirá legacy `.doc/.xls/.ppt` en servidor? | Abierta (requiere LibreOffice) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin colaboración en tiempo real todavía. | El visor es de solo lectura y no hay presencia/cursores. | `T-050` |
| G-02 | Sin render de `.doc/.xls/.ppt` legacy. | Depende de conversión externa. | `T-051` |
| G-03 | Sin tests automatizados de selección de visor y `Range`. | Regresiones no detectadas en CI. | `T-052` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02, CA-04, CA-05 | Visores revisados en la vista dedicada. | 2026-11-05 |
| CA-03, CA-10–CA-13 | DOCX, XLSX y PPTX reales renderizados en navegador; zoom, video y marco de marca compilados. | 2026-11-18 |
| CA-03 | E2E de navegador: `.docx` genera HTML, `.xlsx` tabla y `.pptx` diapositivas; sin errores de consola salvo fuentes del DOCX de muestra. | 2026-11-18 |
| CA-03, CA-08 | Revisión de `ResourceContent` y fallback de descarga. | 2026-11-11 |
| CA-09 | Revisión de `ProjectAccessGuard`. | 2026-11-11 |
| RNF-01 | Revisión de `resources.controller.ts` con `Range`. | 2026-11-11 |
