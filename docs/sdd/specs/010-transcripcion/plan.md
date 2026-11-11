# Plan 010 · Transcripción de audio

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

El endpoint de transcripción valida que el recurso sea audio, crea un `TranscriptionJob` en `QUEUED` y encola el id en `pg-boss`. El worker descarga el audio de MinIO, llama al servicio Whisper por HTTP y actualiza el job a `DONE` o `FAILED`. El frontend hace polling del job, muestra el texto en un editor y permite guardarlo como apunte reutilizando `ResourcesService.createNote`.

## 2. Contexto técnico actual

- `transcriptions.controller.ts`, `transcriptions.service.ts`, `queue.service.ts`, `worker.ts` y `asr.service.ts`.
- `TranscriptionJob` en Prisma.
- `pg-boss` respaldado por PostgreSQL.
- `AudioViewer` en el visor de archivos.
- `ResourcesService.createNote` para guardar el apunte.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | `pg-boss` sobre PostgreSQL | Redis + BullMQ | Evita una dependencia de infraestructura |
| D-02 | Polling | WebSocket/SSE | Menos complejidad y suficiente para v1 |
| D-03 | Whisper autoalojado | API externa | Privacidad y control de costes |
| D-04 | Guardar como apunte existente | Nueva entidad de nota | Reutiliza permisos, visor y borrado |
| D-05 | Reintentos del worker | Reintento manual | Tolerancia a fallos transitorios |

## 4. Cambios por capa

### Datos

- `TranscriptionJob` con estado, idioma, texto y error.
- Índices por recurso y estado.
- Sin migración pendiente.

### Backend

- Encolado y worker.
- Llamada a Whisper con `fetch`.
- Actualización de estado y errores.
- Listado por proyecto.
- Guardado como apunte.

### Frontend

- Botón de transcripción en audio.
- Polling con React Query.
- Editor del texto y guardado.
- Estados de espera, progreso y error.

### Infraestructura

- Servicio `whisper` (`faster-whisper`).
- Variables `ASR_URL`, `ASR_API_KEY`, `ASR_DEFAULT_LANGUAGE`, `ASR_MAX_DURATION_MINUTES`.
- Cola `pg-boss`.

## 5. Contratos

```http
POST /api/v1/files/:fileId/transcriptions
{ "language": "es" }
```

```http
GET /api/v1/transcriptions/:id

{ "id": "...", "status": "DONE", "language": "es", "text": "...", "error": null }
```

```http
POST /api/v1/transcriptions/:id/note
{ "name": "clase-1.md", "content": "..." }
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Encolar, procesar y guardar apunte | Playwright + Whisper |
| Unitario | Estados y errores del worker | Vitest (pendiente) |
| Integración | Llamada a ASR y actualización del job | Vitest (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Audio enorme o largo | Alto | G-01: validar duración y tamaño antes de encolar |
| Servicio ASR caído | Alto | Job `FAILED` y mensaje al usuario |
| Worker bloqueado | Medio | Cola y reintentos |
| Pérdida de texto editado | Medio | Guardado explícito como apunte |
| Coste de transcripción | Medio | Whisper local y límites |

## 8. Rollback

- Revertir código.
- Los jobs existentes conservan su estado; se pueden borrar en cascada con el recurso.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/transcriptions/*` | Controlador, servicio, cola, worker y ASR |
| `infinipaper-backend/src/modules/resources/resources.service.ts` | Guardado como apunte |
| `infinipaper-backend/prisma/schema.prisma` | `TranscriptionJob` |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx` | Visor de audio y transcripción |
| `infinipaper-backend/docker-compose.yml` | Servicio Whisper |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-010`, `T-011` |
| RF-03 | `T-012` (parcial) |
| RF-04, RF-05 | `T-013`, `T-014` |
| RF-06, RF-07 | `T-015`, `T-016` |
| RF-08, RF-09 | `T-020`, `T-021` |
| RF-10 | `T-017` |
| RF-11, RF-12 | `T-018` |
