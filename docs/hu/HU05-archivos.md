# HU05 · Gestión de archivos

| Campo | Valor |
|---|---|
| Módulo | Proyectos |
| Prioridad | Alta |
| Estimación | 8 PHU |
| Persona | Participante autorizado |
| Dependencias | HU01, HU03, HU08 |

## 1. Objetivo

Como participante autorizado, quiero cargar documentos, imágenes, audio y video dentro de las carpetas de un proyecto para incorporar material de estudio.

## 2. Reglas de negocio

1. La subida se hace **por el backend** (proxy), que valida y luego escribe en MinIO.
2. Límite por archivo: **`MAX_UPLOAD_SIZE_MB` = 50 MB** (configurable en un solo lugar).
3. Se valida formato por MIME y extensión.
4. Cada recurso registra: nombre, `kind`, `mimeType`, `size`, `s3Key`, `checksum`, autor y carpeta.
5. `kind` determina el visor: `DOCUMENT`, `IMAGE`, `AUDIO`, `VIDEO`, `MARKDOWN`.
6. Nombres únicos por carpeta; si hay colisión se sugiere un nombre alternativo.
7. Solo **Owner** y **Editor** suben/renombran/eliminan. **Viewer** solo visualiza.
8. Los archivos aparecen en el listado de su carpeta tras una carga exitosa.
9. Eliminar un recurso borra también el objeto en S3.

## 3. Formatos admitidos

| Kind | Formatos |
|---|---|
| DOCUMENT | pdf, docx, xlsx, pptx, odt |
| IMAGE | jpg, jpeg, png, webp, gif |
| AUDIO | mp3, wav, ogg, m4a |
| VIDEO | mp4, webm |
| MARKDOWN | md |

## 4. Flujos

### 4.1 Seleccionar y validar
1. El usuario selecciona un archivo (input o arrastrar/soltar).
2. El cliente valida tamaño/formato (pre-chequeo con `maxUploadSizeMb`).
3. El backend revalida MIME, extensión y tamaño.

### 4.2 Cargar
1. Se sube por multipart a `POST /folders/:folderId/files`.
2. Se calcula checksum, se sube a S3 y se crea el `Resource`.

### 4.3 Listar
1. Al entrar a la carpeta, el archivo aparece con su icono y metadatos.

### 4.4 Renombrar / Eliminar
1. Editor+ renombra o elimina (con confirmación).

## 5. Criterios de aceptación

- **CA-1** Dado un archivo admitido dentro del límite, cuando se sube, entonces aparece en el listado.
- **CA-2** Dado un formato no soportado, entonces `415 FILE_UNSUPPORTED_TYPE`.
- **CA-3** Dado un archivo mayor a `MAX_UPLOAD_SIZE_MB`, entonces `413 FILE_TOO_LARGE` con el límite en el mensaje.
- **CA-4** Dado un usuario Viewer, cuando intenta subir, entonces `403 PROJECT_FORBIDDEN`.
- **CA-5** Dado un archivo subido, entonces se registra su autor.
- **CA-6** Dado un usuario Editor, cuando elimina un archivo confirmando, entonces desaparece del listado y de S3.
- **CA-7** Dado un nombre duplicado en la carpeta, entonces `409 FILE_NAME_TAKEN` (con sugerencia).
- **CA-8** Dado el valor de `MAX_UPLOAD_SIZE_MB` cambiado por entorno, entonces el nuevo límite aplica sin tocar código.
- **CA-9** Dado un fallo de selección del archivo, entonces no se inicia la carga y se informa.

## 6. Contrato de API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/folders/:id/files?cursor=&limit=` | Viewer+ | Listar |
| POST | `/api/v1/folders/:id/files` | Editor+ | Subir (multipart `file`) |
| GET | `/api/v1/files/:id` | Viewer+ | Metadata |
| GET | `/api/v1/files/:id/content` | Viewer+ | Stream con *range* |
| PATCH | `/api/v1/files/:id` | Editor+ | Renombrar (`{ name }`) |
| DELETE | `/api/v1/files/:id` | Editor+ | Eliminar |

## 7. Validaciones

| Campo | Regla |
|---|---|
| `file` | no vacío, MIME/extensión admitidos, ≤ `MAX_UPLOAD_SIZE_MB` |
| `name` | 1–255, sin `/` |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `FILE_UNSUPPORTED_TYPE` | 415 | Formato no admitido |
| `FILE_TOO_LARGE` | 413 | Supera el límite |
| `FILE_NAME_TAKEN` | 409 | Duplicado en la carpeta |
| `FILE_NOT_FOUND` | 404 | Inexistente |
| `FOLDER_NOT_FOUND` | 404 | Carpeta inexistente |
| `PROJECT_FORBIDDEN` | 403 | Sin permisos |
| `STORAGE_ERROR` | 502 | Fallo al escribir en S3 |

## 9. Fuera de alcance (v1)

Versionado de archivos, subida por trozos (chunked), compresión, cuotas por usuario, vista previa de documentos ofimáticos, deduplicación.
