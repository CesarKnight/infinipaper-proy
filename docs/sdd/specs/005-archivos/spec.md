# Spec 005 · Gestión de archivos

| Campo | Valor |
|---|---|
| ID | `005` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 003` (carpetas), `spec 008` (permisos) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/005-archivos.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Los proyectos necesitan incorporar material de estudio en múltiples formatos: documentos, imágenes, audio, video y Markdown. La carga debe validar tamaño y formato, guardar metadatos, permitir descargas y no exponer el almacenamiento S3 al navegador. Además, el límite de subida debe poder cambiarse en un solo lugar.

## 2. Objetivo

> Como **participante autorizado**, quiero **cargar documentos, imágenes, audio y video dentro de las carpetas** para **incorporar material de estudio**.

## 3. Alcance

### Incluye

- Subida por el backend hacia MinIO.
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
- Arrastrar y soltar en v1 (se usa `<input type="file">`).

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

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El límite se configura en una única variable y se expone en `GET /config`. | Revisión de `ConfigService` y endpoint. |
| RNF-02 | El backend revalida todo lo que el cliente pre-valida. | Tests de carga y revisión. |
| RNF-03 | Los binarios no se guardan en la base de datos. | Revisión de `Resource`. |
| RNF-04 | La UI muestra progreso/estado de subida y errores legibles. | Revisión visual. |
| RNF-05 | El nombre no permite `/` ni rutas inseguras. | Validación de DTO y servicio. |

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

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/folders/:id/files?cursor=&limit=` | Viewer+ | Listar |
| `POST` | `/api/v1/folders/:id/files` | Editor+ | Subir `multipart/form-data` campo `file` |
| `GET` | `/api/v1/files/:id` | Viewer+ | Metadatos |
| `GET` | `/api/v1/files/:id/content` | Viewer+ | Stream con `Range` |
| `PATCH` | `/api/v1/files/:id` | Editor+ | Renombrar `{ name }` |
| `DELETE` | `/api/v1/files/:id` | Editor+ | Eliminar |

### Formatos admitidos

| Kind | Formatos |
|---|---|
| `DOCUMENT` | pdf, docx, xlsx, pptx, odt |
| `IMAGE` | jpg, jpeg, png, webp, gif |
| `AUDIO` | mp3, wav, ogg, m4a |
| `VIDEO` | mp4, webm |
| `MARKDOWN` | md |

### Datos

- `Resource` con `folderId`, `authorId`, `name`, `kind`, `mimeType`, `size`, `s3Key`, `checksum`.
- `@@unique([folderId, name])`.
- Clave S3: `projects/{projectId}/folders/{folderId}/{uuid}/{filename}`.

### UI

- `resource-list.tsx`: botón de subida, input de archivo, orden, listado y eliminación.
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
| Fallo de S3 | Rechazar y no crear el recurso | `STORAGE_ERROR` · 502 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Subida proxeada por el backend | Subida directa a MinIO | Evita CORS y permite validar |
| D-02 | `kind` derivado de la extensión | MIME del navegador | Más determinista |
| D-03 | Límite en una variable de entorno | Límite duplicado en frontend y backend | Una sola fuente de verdad |
| D-04 | v1 usa `<input type="file">` | `react-dropzone` | Menos complejidad; la dependencia queda disponible |
| Q-01 | ¿Se añadirá carga por trozos o reanudable? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay arrastrar y soltar en la UI; solo selección de archivo. | Flujo menos cómodo, pero funcional. | `T-050` |
| G-02 | No hay tests automatizados de límites, formatos y limpieza S3. | Regresiones no detectadas en CI. | `T-051` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-05, CA-08 | Carga y listado verificados con MinIO en el entorno de desarrollo. | 2026-11-05 |
| CA-02, CA-03, CA-07 | Revisión de `ResourcesService.createFromUpload` y `ensureNameAvailable`. | 2026-11-11 |
| CA-04 | Revisión de `@RequireProjectRole('editor')`. | 2026-11-11 |
| CA-06 | Revisión de `remove` con borrado S3. | 2026-11-11 |
