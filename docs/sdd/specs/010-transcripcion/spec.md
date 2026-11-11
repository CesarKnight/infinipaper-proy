# Spec 010 · Transcripción de audio

| Campo | Valor |
|---|---|
| ID | `010` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 003` (carpetas), `spec 005` (archivos), `spec 006` (visualización), `spec 008` (permisos), `spec 009` (apuntes) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/010-transcripcion.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Los audios de clases o apuntes son material valioso, pero consultarlos requiere escucharlos completos. El usuario necesita una transcripción automática que pueda revisar, editar y convertir en un apunte dentro de la misma carpeta. La transcripción puede tardar, por lo que debe ejecutarse en segundo plano y notificar su estado sin bloquear la UI.

## 2. Objetivo

> Como **usuario con permisos de edición**, quiero **procesar un audio mediante reconocimiento automático del habla** para **obtener una transcripción editable que pueda convertirse en un apunte**.

## 3. Alcance

### Incluye

- Transcripción de audios ya almacenados en un proyecto.
- Formatos mp3, wav, ogg y m4a.
- Job asíncrono con estados `QUEUED`, `PROCESSING`, `DONE`, `FAILED`.
- Whisper autoalojado invocado por HTTP.
- Idioma configurable (`es` por defecto, `auto` disponible).
- Polling del estado desde el frontend.
- Edición del texto y guardado como apunte `.md`.
- Permisos Owner/Editor.

### No incluye

- Transcripción en vivo.
- Diarización por hablante.
- Marcas de tiempo.
- Traducción.
- Resumen automático.
- Generación de cuestionarios con IA.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Solo se transcriben audios existentes en un proyecto; no hay subida directa en este flujo. | Must |
| RF-02 | Formatos admitidos: mp3, wav, ogg, m4a. | Must |
| RF-03 | Se aplican límites de duración (`ASR_MAX_DURATION_MINUTES`, 120 por defecto) y tamaño (200 MB). | Must |
| RF-04 | El proceso es asíncrono: se crea un `TranscriptionJob` en `QUEUED` y un worker lo procesa. | Must |
| RF-05 | El motor ASR es Whisper autoalojado (`faster-whisper`) invocado por HTTP. | Must |
| RF-06 | El idioma por defecto es `es`, configurable, con opción `auto`. | Must |
| RF-07 | El frontend consulta el estado por polling. | Must |
| RF-08 | El usuario revisa y edita el texto antes de guardarlo. | Must |
| RF-09 | Guardar crea un `Resource` MARKDOWN en la misma carpeta del audio. | Must |
| RF-10 | Solo Owner y Editor pueden ejecutar y guardar. | Must |
| RF-11 | Un job sin voz detectable termina `FAILED` con `ASR_NO_SPEECH`. | Must |
| RF-12 | Un fallo del servicio ASR termina `FAILED` con `ASR_SERVICE_ERROR`. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La transcripción no bloquea la petición HTTP; el trabajo corre en un worker. | Revisión de `pg-boss` y worker. |
| RNF-02 | El estado se puede consultar sin descargar el audio nuevamente. | `GET /transcriptions/:id`. |
| RNF-03 | El texto se guarda como apunte reutilizando la lógica de la spec 009. | Revisión de `saveAsNote`. |
| RNF-04 | Los errores se registran sin exponer credenciales ni rutas internas. | Revisión de logs y respuestas. |
| RNF-05 | La UI muestra estados de espera, progreso, éxito y error. | Revisión del visor de audio. |

## 6. Criterios de aceptación

### CA-01 · Iniciar transcripción

- **Dado** un audio compatible,
- **entonces** el usuario puede iniciar la transcripción.

### CA-02 · Formato no admitido

- **Dado** un formato no admitido,
- **entonces** responde `415 AUDIO_UNSUPPORTED`.

### CA-03 · Encolar

- **Dado** un audio dentro de los límites,
- **entonces** el job se crea en `QUEUED`.

### CA-04 · Procesar

- **Dado** el servicio ASR operativo,
- **entonces** el job pasa a `PROCESSING` y luego `DONE` con texto.

### CA-05 · Sin voz

- **Dado** un audio sin voz detectable,
- **entonces** el job termina `FAILED` con `ASR_NO_SPEECH`.

### CA-06 · Fallo de ASR

- **Dado** un fallo del servicio ASR,
- **entonces** el job termina `FAILED` con `ASR_SERVICE_ERROR` y se informa.

### CA-07 · Ver y editar

- **Dado** un job `DONE`,
- **entonces** el usuario ve la transcripción y puede editarla.

### CA-08 · Guardar apunte

- **Dado** el texto editado,
- **cuando** el usuario guarda,
- **entonces** se crea un apunte con ese contenido.

### CA-09 · Sin texto

- **Dado** un intento de guardar sin transcripción válida,
- **entonces** responde `422 TRANSCRIPTION_REQUIRED`.

### CA-10 · Viewer

- **Dado** un usuario Viewer,
- **cuando** intenta transcribir,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/files/:id/transcriptions` | Editor+ | Encolar `{ language? }` |
| `GET` | `/api/v1/transcriptions/:id` | Editor+ | Estado y resultado (polling) |
| `GET` | `/api/v1/projects/:id/transcriptions` | Editor+ | Listar jobs del proyecto |
| `POST` | `/api/v1/transcriptions/:id/note` | Editor+ | Guardar como apunte `{ name, content }` |

### Respuesta de estado

```json
{ "id": "...", "status": "DONE", "language": "es", "text": "...", "error": null }
```

### Datos

- `TranscriptionJob`: `resourceId`, `requestedById`, `status`, `language`, `text`, `error`.
- El listado por proyecto se resuelve mediante `resource.folder.projectId`.

### UI

- `AudioViewer` en `files/[fileId]/page.tsx`.
- Botón "Transcribir", estado del job y editor del texto.
- Guardado como apunte en la misma carpeta.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Recurso no audio | Rechazar | `AUDIO_UNSUPPORTED` · 415 |
| Recurso inexistente | Rechazar | `FILE_NOT_FOUND` · 404 |
| Job inexistente | Rechazar | `TRANSCRIPTION_NOT_FOUND` · 404 |
| Sin texto para guardar | Rechazar | `TRANSCRIPTION_REQUIRED` · 422 |
| Sin voz | Job `FAILED` | `ASR_NO_SPEECH` · 422 |
| Fallo ASR | Job `FAILED` | `ASR_SERVICE_ERROR` · 502 |
| Sin permisos | Rechazar | `PROJECT_FORBIDDEN` · 403 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Job asíncrono con `pg-boss` sobre PostgreSQL | Redis + BullMQ | Evita sumar infraestructura |
| D-02 | Polling en lugar de WebSocket | SSE/WebSocket | Menos complejidad en v1 |
| D-03 | Whisper autoalojado | API externa | Privacidad y coste |
| D-04 | Guardar como apunte reutilizando la spec 009 | Entidad de transcripción aparte | Coherencia con el contenido |
| Q-01 | ¿Se añadirán marcas de tiempo o diarización? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | El backend no valida duración ni tamaño del audio antes de encolar; solo valida que sea `AUDIO`. | Un audio enorme o demasiado largo puede consumir recursos del worker. | `T-050` |
| G-02 | No se detecta audio corrupto con un código específico; el fallo se reporta como `ASR_SERVICE_ERROR`. | Diagnóstico menos preciso. | `T-051` |
| G-03 | No hay tests automatizados del worker, estados y guardado como apunte. | Regresiones no detectadas en CI. | `T-052` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-03 | Encolado verificado con el visor de audio. | 2026-11-05 |
| CA-04, CA-07, CA-08 | Flujo con Whisper revisado en el entorno de desarrollo. | 2026-11-05 |
| CA-02, CA-10 | Revisión de `transcriptions.service.ts` y guards. | 2026-11-11 |
| CA-05, CA-06, CA-09 | Revisión del worker y de `saveAsNote`. | 2026-11-11 |
