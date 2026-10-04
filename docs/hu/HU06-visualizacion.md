# HU06 · Visualización multimedia

| Campo | Valor |
|---|---|
| Módulo | Proyectos |
| Prioridad | Alta |
| Estimación | 8 PHU |
| Persona | Participante autorizado |
| Dependencias | HU05 |

## 1. Objetivo

Como participante, quiero visualizar imágenes y documentos, y reproducir audio y video compatibles desde la plataforma para consultar el material académico.

## 2. Reglas de negocio

1. El sistema identifica el `kind` del recurso y elige el visor correspondiente.
2. La visualización ocurre en una **vista dedicada** por recurso; el usuario puede regresar a la carpeta.
3. El contenido se sirve por el backend (`/files/:id/content`) con soporte de **range requests** para audio/video.
4. Respetar permisos: un recurso inaccesible responde 403/404.

## 3. Matriz de visores

| Kind | Formatos | Visor |
|---|---|---|
| IMAGE | jpg, png, webp, gif | `<img>` con zoom y ajuste |
| DOCUMENT | pdf | **PDF.js** (`react-pdf`) |
| DOCUMENT | docx, xlsx, pptx, odt | solo descarga |
| AUDIO | mp3, wav, ogg, m4a | reproductor `<audio>` nativo |
| VIDEO | mp4, webm | reproductor `<video>` nativo |
| MARKDOWN | md | render Markdown (HU4/HU9) |

## 4. Flujos

### 4.1 Visualizar imagen
1. El usuario selecciona una imagen.
2. Se abre la vista dedicada con el visor.

### 4.2 Visualizar documento
1. PDF → visor embebido.
2. Ofimático → se ofrece descarga.

### 4.3 Reproducir audio/video
1. Se carga el recurso con controles nativos.
2. El streaming usa range requests.

### 4.4 Regresar
1. El usuario vuelve a la carpeta de origen.

## 5. Criterios de aceptación

- **CA-1** Dada una imagen, entonces se muestra correctamente.
- **CA-2** Dado un PDF, entonces se visualiza en el visor embebido.
- **CA-3** Dado un docx/xlsx/pptx/odt, entonces se ofrece descarga (no se intenta renderizar).
- **CA-4** Dado un audio, entonces dispone de controles básicos de reproducción.
- **CA-5** Dado un video, entonces dispone de controles básicos y *seeking*.
- **CA-6** Dado un recurso, entonces el sistema identifica su `kind` antes de elegir el visor.
- **CA-7** Dado que el usuario visualiza un recurso, entonces puede regresar a la carpeta.
- **CA-8** Dado un formato no soportado por el visor, entonces `415 VIEWER_UNSUPPORTED` y se ofrece descarga.
- **CA-9** Dado un archivo dañado, entonces se informa `422 FILE_CORRUPTED`.
- **CA-10** Dado un usuario sin acceso, entonces `403 PROJECT_FORBIDDEN`.

## 6. Contrato de API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/files/:id` | Viewer+ | Metadata para elegir visor |
| GET | `/api/v1/files/:id/content` | Viewer+ | Binario con `Range`/`Accept-Ranges` |

## 7. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `VIEWER_UNSUPPORTED` | 415 | Sin visor para el formato |
| `FILE_CORRUPTED` | 422 | No interpretable |
| `PROJECT_FORBIDDEN` | 403 | Sin acceso |
| `FILE_NOT_FOUND` | 404 | Inexistente |

## 8. Fuera de alcance (v1)

Anotaciones sobre documentos, reproducción de listas, transcodificación, visor ofimático embebido, subtítulos.
