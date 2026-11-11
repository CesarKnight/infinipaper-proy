# Spec 006 · Visualización multimedia

| Campo | Valor |
|---|---|
| ID | `006` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 005` (archivos), `spec 008` (permisos) |

## 1. Contexto y problema

El material de estudio incluye imágenes, documentos, audio y video. El usuario necesita consultarlos sin descargarlos obligatoriamente y sin salir del proyecto. El visor debe elegirse según el tipo de recurso y respetar los permisos de acceso.

## 2. Objetivo

> Como **participante**, quiero **visualizar imágenes y documentos, y reproducir audio y video compatibles** para **consultar el material académico desde la plataforma**.

## 3. Alcance

### Incluye

- Vista dedicada por recurso.
- Selección de visor según `kind`.
- Imagen, PDF, audio, video y Markdown.
- Descarga para formatos ofimáticos y no soportados.
- Streaming con `Range` para audio/video.
- Botón para volver a la carpeta.
- Permisos de lectura.

### No incluye

- Anotaciones sobre documentos.
- Listas de reproducción.
- Transcodificación.
- Visor ofimático embebido.
- Subtítulos.
- Zoom avanzado de imágenes en v1.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema identifica el `kind` y elige el visor correspondiente. | Must |
| RF-02 | La visualización ocurre en una vista dedicada por recurso. | Must |
| RF-03 | El contenido se sirve por el backend con soporte de `Range`. | Must |
| RF-04 | Imágenes: se muestran ajustadas al contenedor. | Must |
| RF-05 | PDF: se muestra con el visor nativo del navegador en un `<iframe>` al contenido proxeado. | Must |
| RF-06 | Documentos ofimáticos: se ofrece descarga, sin intentar renderizarlos. | Must |
| RF-07 | Audio: reproductor nativo con controles. | Must |
| RF-08 | Video: reproductor nativo con controles y *seeking*. | Must |
| RF-09 | Markdown: se renderiza con la vista sanitizada de la spec 009. | Must |
| RF-10 | El usuario puede volver a la carpeta de origen. | Must |
| RF-11 | Un recurso inaccesible responde 403/404. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El streaming no carga el archivo completo en memoria del navegador. | Uso de `Range` y elementos nativos. |
| RNF-02 | La vista muestra estados de carga y error. | Revisión visual. |
| RNF-03 | El visor no expone URLs de MinIO. | El `src` apunta a `/api/v1/files/:id/content`. |
| RNF-04 | La vista es usable en tema claro y oscuro. | Revisión visual. |

## 6. Criterios de aceptación

### CA-01 · Imagen

- **Dada** una imagen,
- **entonces** se muestra correctamente en la vista dedicada.

### CA-02 · PDF

- **Dado** un PDF,
- **entonces** se visualiza en el visor embebido del navegador.

### CA-03 · Documento ofimático

- **Dado** un docx/xlsx/pptx/odt,
- **entonces** se ofrece descarga y no se intenta renderizar.

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
| `IMAGE` | jpg, png, webp, gif | `<img>` ajustada |
| `DOCUMENT` | pdf | `<iframe>` al contenido proxeado |
| `DOCUMENT` | docx, xlsx, pptx, odt | Descarga |
| `AUDIO` | mp3, wav, ogg, m4a | `<audio>` nativo |
| `VIDEO` | mp4, webm | `<video>` nativo |
| `MARKDOWN` | md | Render sanitizado |

### UI

- Ruta `/projects/[projectId]/files/[fileId]`.
- Botón de volver a la carpeta.
- Botón de descarga siempre disponible.
- Para audio, además, acciones de transcripción (spec 010).

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
| D-03 | Descarga para ofimáticos | Conversión en servidor | Fuera de alcance v1 |
| Q-01 | ¿Se añadirá zoom y navegación de páginas para PDF? | Abierta (fuera de v1) |
| Q-02 | ¿Se añadirá zoom de imágenes? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Las imágenes no tienen zoom ni paneo; solo ajuste al contenedor. | Menos control para imágenes grandes. | `T-050` |
| G-02 | No hay tests automatizados de selección de visor y `Range`. | Regresiones no detectadas en CI. | `T-051` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02, CA-04, CA-05 | Visores revisados en la vista dedicada. | 2026-11-05 |
| CA-03, CA-08 | Revisión de `ResourceContent` y fallback de descarga. | 2026-11-11 |
| CA-09 | Revisión de `ProjectAccessGuard`. | 2026-11-11 |
| RNF-01 | Revisión de `resources.controller.ts` con `Range`. | 2026-11-11 |
