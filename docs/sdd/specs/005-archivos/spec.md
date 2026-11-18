# Spec 005 · Gestión de archivos

| Campo | Valor |
|---|---|
| ID | `005` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-18 |
| Dependencias | `spec 001` (usuarios), `spec 003` (carpetas), `spec 008` (permisos) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/005-archivos.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Los proyectos necesitan incorporar material de estudio en múltiples formatos: documentos, imágenes, audio, video y Markdown. La carga debe validar tamaño y formato, guardar metadatos, permitir descargas y no exponer el almacenamiento S3 al navegador. Además, el límite de subida debe poder cambiarse en un solo lugar.

## 2. Objetivo

> Como **participante autorizado**, quiero **cargar documentos, imágenes, audio y video dentro de las carpetas** para **incorporar material de estudio**.

## 3. Alcance

### Incluye

- Subida por el backend hacia MinIO.
- Arrastrar y soltar uno o varios archivos en la carpeta abierta.
- Selección múltiple mediante `<input type="file" multiple>`.
- Selección múltiple de recursos y menú contextual (clic derecho).
- Copiar y mover archivos entre carpetas del mismo proyecto.
- Diálogo de carpeta destino y operaciones por lotes.
- Límite configurable `MAX_UPLOAD_SIZE_MB` (50 MB por defecto).
- Validación por extensión/MIME y tamaño.
- Metadatos: nombre, `kind`, `mimeType`, `size`, `s3Key`, `checksum`, autor y carpeta.
- Listado, descarga con `Range`, renombrado y eliminación.
- Nombres únicos por carpeta con sugerencia.
- Permisos Owner/Editor para escribir; Viewer solo lectura.

### No incluye

- Versionado de archivos.
- Subida por trozos (chunked).
- Compresión.
- Cuotas por usuario.
- Vista previa de documentos ofimáticos.
- Deduplicación.
- Subida por trozos o reanudable.
- Progreso granular por archivo en v1.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | La subida se hace por el backend, que valida y escribe en MinIO. | Must |
| RF-02 | El límite por archivo es `MAX_UPLOAD_SIZE_MB` (50 MB por defecto) y se aplica en servidor. | Must |
| RF-03 | Se valida formato por extensión/MIME y se asigna un `kind`. | Must |
| RF-04 | Cada recurso registra metadatos completos y checksum. | Must |
| RF-05 | `kind` determina el visor: `DOCUMENT`, `IMAGE`, `AUDIO`, `VIDEO`, `MARKDOWN`. | Must |
| RF-06 | Los nombres son únicos por carpeta; en colisión se devuelve una sugerencia. | Must |
| RF-07 | Owner y Editor suben, renombran y eliminan; Viewer solo visualiza. | Must |
| RF-08 | El archivo aparece en el listado de su carpeta tras una carga exitosa. | Must |
| RF-09 | Eliminar un recurso borra también el objeto en S3. | Must |
| RF-10 | El contenido se sirve por el backend con soporte de `Range`. | Must |
| RF-11 | El Editor puede arrastrar y soltar archivos sobre la carpeta abierta. | Must |
| RF-12 | El drop target muestra un overlay de marca y sube varios archivos secuencialmente. | Should |
| RF-13 | Viewer no puede activar el drop target ni iniciar cargas. | Must |
| RF-14 | El usuario puede seleccionar varios archivos con checkbox y seleccionar todo. | Must |
| RF-15 | Clic derecho abre un menú contextual con Copiar, Mover y Eliminar. | Must |
| RF-16 | Copiar duplica archivos y su contenido S3 en la carpeta destino; Mover cambia la carpeta y conserva el objeto. | Must |
| RF-17 | Solo se permite copiar/mover entre carpetas del mismo proyecto y con permiso Editor. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El límite se configura en una única variable y se expone en `GET /config`. | Revisión de `ConfigService` y endpoint. |
| RNF-02 | El backend revalida todo lo que el cliente pre-valida. | Tests de carga y revisión. |
| RNF-03 | Los binarios no se guardan en la base de datos. | Revisión de `Resource`. |
| RNF-04 | La UI muestra progreso/estado de subida y errores legibles. | Revisión visual. |
| RNF-05 | El nombre no permite `/` ni rutas inseguras. | Validación de DTO y servicio. |
| RNF-06 | El drop target solo se activa para Owner/Editor y no bloquea la navegación normal. | Revisión de UI y permisos. |
| RNF-07 | La subida múltiple notifica cuántos archivos se subieron y refresca el listado una sola vez. | Revisión visual y E2E. |
| RNF-08 | Copiar/mover conserva metadatos, checksum, procedencia y validación de origen de forma explícita. | Tests de integridad. |
| RNF-09 | La selección y el menú contextual son accesibles por teclado y no rompen la navegación. | Revisión de UI y E2E. |

## 6. Criterios de aceptación

### CA-01 · Subida válida

- **Dado** un archivo admitido dentro del límite,
- **cuando** se sube,
- **entonces** aparece en el listado con sus metadatos.

### CA-02 · Formato no admitido

- **Dado** un formato no soportado,
- **entonces** responde `415 FILE_UNSUPPORTED_TYPE`.

### CA-03 · Archivo demasiado grande

- **Dado** un archivo mayor a `MAX_UPLOAD_SIZE_MB`,
- **entonces** responde `413 FILE_TOO_LARGE` con el límite en el mensaje.

### CA-04 · Viewer

- **Dado** un usuario Viewer,
- **cuando** intenta subir,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-05 · Autor

- **Dado** un archivo subido,
- **entonces** se registra su autor.

### CA-06 · Eliminar

- **Dado** un usuario Editor,
- **cuando** elimina un archivo confirmando,
- **entonces** desaparece del listado y de S3.

### CA-07 · Nombre duplicado

- **Dado** un nombre duplicado en la carpeta,
- **entonces** responde `409 FILE_NAME_TAKEN` con una sugerencia.

### CA-08 · Límite configurable

- **Dado** el valor de `MAX_UPLOAD_SIZE_MB` cambiado por entorno,
- **entonces** el nuevo límite aplica sin tocar código.

### CA-09 · Sin selección

- **Dado** que el usuario no selecciona archivo,
- **entonces** no se inicia la carga y se informa.

### CA-10 · Arrastrar y soltar

- **Dado** un Editor con una carpeta abierta,
- **cuando** arrastra uno o varios archivos sobre la sección de archivos,
- **entonces** aparece el overlay de carga, se suben y se refresca el listado.

### CA-11 · Viewer sin drop

- **Dado** un Viewer,
- **cuando** arrastra un archivo sobre la carpeta,
- **entonces** no se inicia ninguna carga.

### CA-12 · Selección múltiple

- **Dado** un Editor en una carpeta,
- **cuando** marca varios archivos,
- **entonces** ve el contador y las acciones Copiar, Mover y Eliminar.

### CA-13 · Mover por lotes

- **Dado** varios archivos seleccionados,
- **cuando** elige Mover y una carpeta destino,
- **entonces** los archivos desaparecen del origen y aparecen en el destino.

### CA-14 · Copiar por lotes

- **Dado** un archivo seleccionado,
- **cuando** elige Copiar y una carpeta destino,
- **entonces** se crea una copia con nombre único y el contenido se conserva.

### CA-15 · Menú contextual

- **Dado** un archivo,
- **cuando** hace clic derecho,
- **entonces** se abre un menú contextual con acciones sobre la selección.

### CA-16 · Proyecto ajeno

- **Dado** un archivo de otro proyecto,
- **cuando** intenta moverlo o copiarlo,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/folders/:id/files?cursor=&limit=` | Viewer+ | Listar |
| `POST` | `/api/v1/folders/:id/files` | Editor+ | Subir `multipart/form-data` campo `file` |
| `POST` | `/api/v1/folders/:id/files/move` | Editor+ | Mover lote `{ fileIds }` |
| `POST` | `/api/v1/folders/:id/files/copy` | Editor+ | Copiar lote `{ fileIds }` |
| `GET` | `/api/v1/files/:id` | Viewer+ | Metadatos |
| `GET` | `/api/v1/files/:id/content` | Viewer+ | Stream con `Range` |
| `PATCH` | `/api/v1/files/:id` | Editor+ | Renombrar `{ name }` |
| `DELETE` | `/api/v1/files/:id` | Editor+ | Eliminar |

### Formatos admitidos

| Kind | Formatos |
|---|---|
| `DOCUMENT` | pdf, docx/docm/dotx, xlsx/xlsm/csv/ods, pptx/pptm/ppsx/odp, doc/xls/ppt, odt |
| `IMAGE` | jpg, jpeg, png, webp, gif |
| `AUDIO` | mp3, wav, ogg, m4a |
| `VIDEO` | mp4, m4v, mov, webm, ogv |
| `MARKDOWN` | md |

### Datos

- `Resource` con `folderId`, `authorId`, `name`, `kind`, `mimeType`, `size`, `s3Key`, `checksum`.
- `@@unique([folderId, name])`.
- Clave S3: `projects/{projectId}/folders/{folderId}/{uuid}/{filename}`.

### UI

- `resource-list.tsx`: input `multiple`, drop target, checkbox de selección, barra de acciones, menú contextual, diálogo de carpeta destino y listado.
- El menú contextual actúa sobre la selección; si el archivo no estaba seleccionado, lo selecciona antes de abrirse.
- El listado muestra icono por `kind`, autor, tamaño y acciones.
- Los errores se muestran con toast.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Formato no admitido | Rechazar | `FILE_UNSUPPORTED_TYPE` · 415 |
| Archivo grande | Rechazar | `FILE_TOO_LARGE` · 413 |
| Nombre duplicado | Rechazar con sugerencia | `FILE_NAME_TAKEN` · 409 |
| Recurso inexistente | Rechazar | `FILE_NOT_FOUND` · 404 |
| Carpeta inexistente | Rechazar | `FOLDER_NOT_FOUND` · 404 |
| Sin permisos | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Drop de Viewer | Ignorar y mantener solo lectura | — |
| Drop con archivos no admitidos | Subir los válidos y reportar error de los demás | `FILE_UNSUPPORTED_TYPE` · 415 |
| Mover a carpeta con nombre duplicado | Rechazar el lote con sugerencia | `FILE_NAME_TAKEN` · 409 |
| Copiar con nombre duplicado | Generar `(copia)` o `(copia N)` | `201` |
| Copiar/mover entre proyectos | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Fallo de S3 | Rechazar y no crear el recurso | `STORAGE_ERROR` · 502 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Subida proxeada por el backend | Subida directa a MinIO | Evita CORS y permite validar |
| D-02 | `kind` derivado de la extensión | MIME del navegador | Más determinista |
| D-03 | Límite en una variable de entorno | Límite duplicado en frontend y backend | Una sola fuente de verdad |
| D-04 | `<input type="file" multiple>` + drop nativo | `react-dropzone` | Sin dependencia extra y control visual propio |
| D-05 | Subida secuencial de varios archivos | Paralelismo sin límite | Evita saturar backend y permite mensajes claros |
| D-06 | Copiar duplica objeto S3 y metadatos; mover solo cambia `folderId`. | Copiar moviendo el mismo objeto | Cada operación conserva semántica clara |
| D-07 | Las copias resuelven colisiones con `(copia)`/`(copia N)`. | Rechazar duplicados al copiar | La copia debe ser una acción fluida |
| Q-01 | ¿Se añadirá carga por trozos o reanudable? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados de drag-and-drop y subida múltiple. | Regresiones no detectadas en CI. | `T-050` |
| G-02 | No hay tests automatizados de límites, formatos y limpieza S3. | Regresiones no detectadas en CI. | `T-051` |
| G-03 | No hay tests automatizados de mover/copiar y nombres duplicados. | Regresiones de integridad no detectadas. | `T-052` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-05, CA-08 | Carga y listado verificados con MinIO en el entorno de desarrollo. | 2026-11-05 |
| CA-02, CA-03, CA-07 | Revisión de `ResourcesService.createFromUpload` y `ensureNameAvailable`. | 2026-11-11 |
| CA-04 | Revisión de `@RequireProjectRole('editor')`. | 2026-11-11 |
| CA-06 | Revisión de `remove` con borrado S3. | 2026-11-11 |
| CA-10 | Drop de `drag-drop.md` verificado en navegador; archivo subido y listado refrescado. | 2026-11-18 |
| CA-11 | Condición `canEdit` revisada en el drop target. | 2026-11-18 |
| CA-12–CA-15 | Selección múltiple, menú contextual, mover dos archivos y copiar uno verificados en navegador. | 2026-11-18 |
| CA-14 | Copia `uno (copia).md` con contenido conservado y nombre único. | 2026-11-18 |
