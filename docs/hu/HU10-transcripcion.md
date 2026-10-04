# HU10 · Transcripción de audio

| Campo | Valor |
|---|---|
| Módulo | Transcripción |
| Prioridad | Media |
| Estimación | 8 PHU |
| Persona | Usuario autenticado con permisos de edición |
| Dependencias | HU01, HU03, HU05, HU06, HU08, HU09 |

## 1. Objetivo

Como usuario, quiero procesar un archivo de audio mediante reconocimiento automático del habla para obtener una transcripción que pueda convertirse en un apunte editable.

## 2. Reglas de negocio

1. Solo se transcriben audios **ya almacenados** en un proyecto (no hay subida directa desde este flujo).
2. Formatos admitidos: mp3, wav, ogg, m4a.
3. Límites: máx. **120 minutos** de duración (`ASR_MAX_DURATION_MINUTES`) y 200 MB.
4. El proceso es asíncrono: se crea un `TranscriptionJob` en estado `QUEUED` y un worker lo procesa.
5. El motor ASR es **Whisper autoalojado** (`faster-whisper`), invocado por HTTP.
6. Idioma por defecto `es` (`ASR_DEFAULT_LANGUAGE`), con opción `auto`.
7. El frontend consulta el estado por **polling**.
8. El usuario revisa y **edita** el texto antes de guardarlo.
9. Guardar crea un `Resource` MARKDOWN (apunte) en la misma carpeta del audio.
10. Solo **Owner** y **Editor** pueden ejecutar y guardar.

## 3. Precondiciones

- Audio `kind = AUDIO` existente en una carpeta accesible.
- Servicio `whisper` operativo.

## 4. Flujos

### 4.1 Seleccionar audio
1. El usuario abre un recurso de audio y pulsa "Transcribir".

### 4.2 Validar
1. El backend verifica formato, tamaño y duración.

### 4.3 Encolar y transcribir
1. Se crea `TranscriptionJob` `QUEUED` y se envía a la cola.
2. El worker marca `PROCESSING`, descarga el audio de S3 y llama a `POST {ASR_URL}/v1/audio/transcriptions`.
3. Al terminar, guarda `text` y marca `DONE` (o `FAILED` con `error`).

### 4.4 Mostrar y editar
1. El frontend hace polling hasta `DONE`.
2. Muestra el texto en un editor editable.

### 4.5 Guardar como apunte
1. El usuario guarda; se crea el `.md` con el texto editado.

## 5. Criterios de aceptación

- **CA-1** Dado un audio compatible, entonces el usuario puede iniciar la transcripción.
- **CA-2** Dado un formato no admitido, entonces `415 AUDIO_UNSUPPORTED`.
- **CA-3** Dado un audio dentro de los límites, entonces el job se encola con estado `QUEUED`.
- **CA-4** Dado el servicio ASR operativo, entonces el job pasa a `PROCESSING` y luego `DONE` con texto.
- **CA-5** Dado un audio sin voz detectable, entonces el job termina `FAILED` con `ASR_NO_SPEECH`.
- **CA-6** Dado un fallo del servicio ASR, entonces el job termina `FAILED` con `ASR_SERVICE_ERROR` y se informa.
- **CA-7** Dado un job `DONE`, entonces el usuario ve la transcripción y puede editarla.
- **CA-8** Dado el texto editado, cuando el usuario guarda, entonces se crea un apunte con ese contenido.
- **CA-9** Dado un intento de guardar sin transcripción válida, entonces `422 TRANSCRIPTION_REQUIRED`.
- **CA-10** Dado un usuario Viewer, cuando intenta transcribir, entonces `403 PROJECT_FORBIDDEN`.
- **CA-11** Dado un audio corrupto, entonces `422 AUDIO_CORRUPTED`.

## 6. Contrato de API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/v1/files/:id/transcriptions` | Editor+ | Encolar (`{ language? }`) |
| GET | `/api/v1/transcriptions/:id` | Editor+ | Estado y resultado (polling) |
| GET | `/api/v1/projects/:id/transcriptions` | Editor+ | Listar jobs del proyecto |
| POST | `/api/v1/transcriptions/:id/note` | Editor+ | Guardar como apunte (`{ name, content }`) |

**Respuesta de estado:**
```json
{ "id": "...", "status": "DONE", "language": "es", "text": "...", "error": null }
```

## 7. Validaciones

| Campo | Regla |
|---|---|
| `language` | `es`, `en`, `auto`, etc. |
| duración | ≤ `ASR_MAX_DURATION_MINUTES` |
| tamaño | ≤ 200 MB |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `AUDIO_UNSUPPORTED` | 415 | Formato no admitido |
| `AUDIO_CORRUPTED` | 422 | Archivo no procesable |
| `AUDIO_TOO_LONG` | 422 | Supera la duración máxima |
| `ASR_NO_SPEECH` | 422 | Sin voz detectable |
| `ASR_SERVICE_ERROR` | 502 | Fallo del servicio ASR |
| `TRANSCRIPTION_REQUIRED` | 422 | Guardar sin texto |
| `PROJECT_FORBIDDEN` | 403 | Sin permisos |

## 9. Fuera de alcance (v1)

Transcripción en vivo, diarización por hablante, marcas de tiempo, traducción, resumen automático, generación de cuestionarios con IA.
