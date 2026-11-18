# Plan 027 · Fuentes multiformato para generación de material académico

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | `2026-11-18` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se añade un subsistema de extracción de fuentes en `infinipaper-agents` con un extractor por familia de formato (`markdown`, `pdf`, `word`, `spreadsheet`, `slides`, `image`, `audio`, `video`). Un orquestador LangGraph recibe las fuentes, ejecuta los extractores, normaliza los documentos con localizadores, elimina duplicados y ajusta el contexto al presupuesto de entrada. Los generadores de mapas mentales y cuestionarios consumen ese contexto normalizado. NestJS conserva los permisos, la caché `ResourceExtraction` y la creación de jobs; la web añade generación desde un recurso individual y muestra warnings y progreso.

## 2. Contexto técnico actual

- `infinipaper-backend/src/modules/content-generation/content-generation.service.ts` filtra fuentes por `mimeType = text/markdown` y llama al agente con `kind: 'markdown'`.
- `infinipaper-backend/src/modules/content-generation/content-agent.client.ts` fija el tipo de fuente y el contrato de generación.
- `infinipaper-agents/src/infinipaper_agents/graph/content.py` rechaza cualquier fuente que no sea Markdown en `_load_sources()`.
- `infinipaper-agents/src/infinipaper_agents/schemas.py` ya define `SourceRef`, `ExtractedDocument`, `MindmapRequest` y `QuizGenerationRequest`.
- `infinipaper-backend/src/modules/search/search.service.ts` solo indexa Markdown, cuestionarios, audio transcrito y mapas; no PDFs, Word, hojas, diapositivas ni imágenes.
- `infinipaper-frontend/components/generation/generation-dialog.tsx` solo permite `FOLDER` y `PROJECT`.
- `infinipaper-backend/src/modules/transcriptions/asr.service.ts` y el servicio `whisper` ya resuelven ASR para audio.
- `StorageService.getPresignedGetUrl` permite que los agentes descarguen archivos sin credenciales S3.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | Extractores por familia de formato | Un agente por extensión | Evita duplicar parsers y permite normalizar variantes OOXML |
| D-02 | Parseo determinista con PyMuPDF, python-docx, openpyxl, python-pptx, Tesseract y ffmpeg | Un LLM que interprete binarios | Menos alucinación, menor coste y resultados testeables |
| D-03 | Orquestador LangGraph determinista con fan-out | Supervisor LLM | Predecible, barato y fácil de depurar |
| D-04 | LLM solo para visión, resumen de contexto y generación final | LLM en cada extracción | Reduce coste y mantiene la extracción reproducible |
| D-05 | Caché `ResourceExtraction` en PostgreSQL | Extraer en cada job | Evita repetir OCR/ASR y permite reutilización futura |
| D-06 | Fallo parcial en carpeta/proyecto | Fallar todo el job si un archivo falla | Un archivo corrupto no debe bloquear el material válido |
| D-07 | Video basado en audio/ASR, frames como fallback | Análisis visual completo de video | El audio es la fuente principal en material académico |
| D-08 | Formatos legacy/ODF fuera de v1 | Incluir LibreOffice ahora | Mantiene el contenedor y el alcance controlados; se difiere a fase 2 |
| D-09 | Generación desde recurso individual en el visor web | Solo carpeta/proyecto | Permite el caso de uso aislado y reutiliza el mismo pipeline |
| D-10 | Extracción enviada al orquestador de forma opcional | Reextraer siempre en agentes | Permite cachear sin romper el contrato stateless |

## 4. Cambios por capa

### Datos

- Nuevo modelo `ResourceExtraction` con `content`, `metadata`, `warnings`, `extractor`, `extractorVersion`, `status` y `checksum`.
- Relación `Resource.extractions`.
- Campos `ContentGenerationJob.stage` y `ContentGenerationJob.progress`.
- Índices: `@@unique([resourceId, checksum, extractorVersion])` y `@@index([resourceId, status])`.
- Migración Prisma.
- Rollback: eliminar la tabla y los campos; los recursos y jobs existentes no se modifican. Las extracciones son datos derivados y se pueden perder.

### Backend NestJS

- `ContentGenerationService.resolveSources()`:
  - acepta `MARKDOWN`, `DOCUMENT`, `IMAGE`, `AUDIO` y `VIDEO`;
  - excluye `QUIZ` y `MINDMAP`;
  - valida que un `RESOURCE` pertenezca al proyecto;
  - aplica límites de cantidad y bytes;
  - separa fuentes diferidas con warning.
- Nuevo `ExtractionClient` o métodos en `ContentAgentClient` para `POST /v1/sources/extract`.
- Nuevo `ResourceExtractionService`:
  - busca caché por checksum y versión;
  - extrae en miss;
  - guarda contenido y warnings;
  - devuelve la extracción al orquestador.
- `ContentAgentClient` envía `extraction` opcional por fuente y recibe `usedSourceIds`.
- `ContentGenerationService.process()`:
  - actualiza `stage`/`progress` por fuente;
  - continúa ante fallos parciales;
  - falla si no queda ninguna fuente;
  - persiste solo fuentes usadas en `ResourceSource`.
- `ContentGenerationController` mantiene endpoints y añade etapa/warnings al `GET` del job.
- Feature flag `AGENT_MULTIFORMAT_ENABLED`; con `false`, el servicio conserva el filtro Markdown-only y el mensaje anterior.

### Frontend

- `GenerationDialog`:
  - acepta `sourceType` `RESOURCE`;
  - muestra “contenido” en lugar de “apuntes”;
  - muestra etapa, progreso y warnings;
  - recibe `sourceId` y `folderId` de destino.
- Visor de archivo y menú contextual:
  - acciones “Generar mapa mental desde este archivo” y “Generar cuestionario desde este archivo” para Editor+.
- Lista de recursos:
  - indica tipos compatibles y excluye generados.
- Estados:
  - carga al iniciar;
  - progreso durante extracción/generación;
  - warnings de archivos omitidos;
  - error con reintento;
  - éxito con enlace al recurso generado.

### Agentes

- Nuevo paquete `sources/`:
  - `registry.py` con mapa MIME/extensión → extractor;
  - `base.py` con interfaz `Extractor`;
  - `markdown.py`, `pdf.py`, `word.py`, `spreadsheet.py`, `slides.py`, `image.py`, `audio.py`, `video.py`.
- `schemas.py`:
  - amplía `SourceKind` a familias;
  - añade `SourceBlock` y campos de extracción;
  - añade `ExtractRequest`/`ExtractResponse`;
  - añade `usedSourceIds` a respuestas de generación.
- `graph/extraction.py`:
  - `route_sources`, fan-out, `normalize`, `deduplicate`, `budget`, `curate`.
- `graph/content.py`:
  - deja de rechazar fuentes no Markdown;
  - usa el orquestador;
  - agrega usage de extractores y generador.
- `api/routes/sources.py`:
  - `POST /v1/sources/extract`.
- Dependencias Python:
  - `pymupdf`, `python-docx`, `docx2python`, `openpyxl`, `python-pptx`, `pillow`, `pytesseract`.
- Dependencias del contenedor:
  - `tesseract-ocr` y `tesseract-ocr-spa`;
  - `ffmpeg`.
- No se añade LibreOffice en esta fase.

### Infraestructura

- `ASR_URL` disponible para el servicio de agentes.
- Variables nuevas:
  - `AGENT_MULTIFORMAT_ENABLED`;
  - `AGENT_EXTRACTION_VERSION`;
  - `AGENT_MAX_SOURCES`;
  - `AGENT_MAX_TOTAL_SOURCE_BYTES`;
  - `AGENT_MAX_EXTRACTED_CHARS`;
  - `AGENT_MAX_OCR_PAGES`;
  - `AGENT_MAX_AUDIO_MINUTES`;
  - `AGENT_EXTRACTION_TIMEOUT_SECONDS`;
  - `AGENT_VISION_ENABLED`;
  - `AGENT_VIDEO_FRAME_FALLBACK`.
- Actualizar `docker-compose.yml`, `.env.example`, README de agentes y `docs/sdd/referencia/librerias.md`.
- Rollback inmediato: `AGENT_MULTIFORMAT_ENABLED=false`.

## 5. Contratos

El contrato completo está en [`spec.md`](./spec.md#7-contratos-e-interfaces).

Resumen:

- NestJS resuelve permisos y fuentes.
- NestJS consulta/crea `ResourceExtraction`.
- NestJS llama a `/v1/sources/extract` en miss.
- NestJS llama a `/v1/mindmaps/generate` o `/v1/quizzes/generate` con extracciones opcionales.
- El orquestador devuelve `usedSourceIds`, warnings y usage.
- NestJS persiste el recurso generado y la procedencia de las fuentes usadas.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Agentes unitario | Router, extractores, normalización, presupuesto y deduplicación | pytest + fixtures |
| Agentes integración | PDF, DOCX, XLSX, PPTX, CSV e imagen con archivos pequeños | pytest |
| Agentes audio/video | ASR falso y ffmpeg con fixture corto o mock | pytest |
| Agentes orquestador | Fan-out y generación con modelo falso | pytest + FakeListChatModel |
| Backend unitario | Resolución de fuentes, caché, fallos parciales, procedencia y feature flag | Vitest |
| Backend contrato | Request/response NestJS ↔ agentes | Vitest + mock |
| Frontend | Acción desde recurso, warnings y progreso | Playwright / revisión visual |
| Manual | Carpeta mixta real y PDF/PPTX/DOCX/imagen/audio | Navegador |
| Calidad | `ruff`, `pytest`, `pyright`, lint, test, build | Comandos locales |

Incluye casos de permisos, prompt injection, formatos diferidos, archivo corrupto, archivo vacío, contexto grande y caché.

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| OCR de baja calidad | Media | Medio | Warning, visión opcional y no prometer manuscritos |
| PDFs con tablas complejas | Alta | Medio | Extracción textual y tablas básicas; documentar límite |
| ASR lento o caído | Media | Alto | Timeout, caché, warnings y fallback a transcripción existente |
| Video largo | Media | Alto | Límite de minutos, audio-first y frames opcionales |
| Contexto excesivo | Alta | Medio | Presupuesto, resumen y recorte con warning |
| Prompt injection en archivos | Media | Alto | Delimitadores `<source>`, system prompt y tests |
| Crecimiento de `ResourceExtraction` | Media | Medio | Límite de contenido y migración futura a MinIO |
| Dependencias del contenedor | Media | Medio | `uv.lock`, Dockerfile reproducible y healthcheck |
| Regresión Markdown | Baja | Alto | Feature flag y tests de contrato existentes |

## 8. Rollback

- Poner `AGENT_MULTIFORMAT_ENABLED=false` para volver a Markdown-only.
- Revertir el código de agentes, backend y frontend.
- La migración de `ResourceExtraction` puede mantenerse; no afecta recursos existentes.
- Si se revierte antes de producción, eliminar tabla y campos `stage`/`progress`.
- Las extracciones son datos derivados; perderlas solo obliga a reextraer.
- Los recursos generados ya creados permanecen como archivos normales.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/prisma/schema.prisma` | `ResourceExtraction`, relaciones y campos de job |
| `infinipaper-backend/prisma/migrations/*` | Migración |
| `infinipaper-backend/src/modules/content-generation/content-generation.service.ts` | Fuentes multiformato, caché, warnings, stage y procedencia |
| `infinipaper-backend/src/modules/content-generation/content-agent.client.ts` | Extracción y contrato ampliado |
| `infinipaper-backend/src/modules/content-generation/content-generation.controller.ts` | Estado ampliado |
| `infinipaper-backend/src/modules/content-generation/dto/content-generation.dto.ts` | Validación de `RESOURCE` y límites |
| `infinipaper-backend/src/modules/content-generation/content-generation.module.ts` | Nuevos servicios |
| `infinipaper-backend/.env.example` | Variables nuevas |
| `infinipaper-backend/docker-compose.yml` | Variables y dependencia ASR para agentes |
| `infinipaper-agents/src/infinipaper_agents/schemas.py` | Contratos de extracción |
| `infinipaper-agents/src/infinipaper_agents/sources/*` | Extractores y registro |
| `infinipaper-agents/src/infinipaper_agents/graph/extraction.py` | Orquestador de fuentes |
| `infinipaper-agents/src/infinipaper_agents/graph/content.py` | Generación desde contexto normalizado |
| `infinipaper-agents/src/infinipaper_agents/api/routes/sources.py` | Endpoint de extracción |
| `infinipaper-agents/src/infinipaper_agents/main.py` | Registro de rutas |
| `infinipaper-agents/pyproject.toml` / `uv.lock` | Dependencias de extracción |
| `infinipaper-agents/Dockerfile` | Tesseract y ffmpeg |
| `infinipaper-agents/README.md` | Formatos y variables |
| `infinipaper-frontend/components/generation/generation-dialog.tsx` | Fuente individual, etapa y warnings |
| `infinipaper-frontend/components/project/resource-list.tsx` | Acciones y textos |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx` | Acciones desde el visor |
| `infinipaper-frontend/lib/types.ts` | Tipos de extracción, etapa y warnings |
| `docs/sdd/referencia/librerias.md` | Librerías nuevas |
| `docs/sdd/specs/027-*` | Spec, plan y tareas |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02, RF-03 | `T-040`, `T-050`, `T-065` |
| RF-04–RF-12 | `T-020`–`T-027`, `T-060` |
| RF-13–RF-15 | `T-030`–`T-032`, `T-061` |
| RF-16–RF-17 | `T-032`, `T-041`, `T-061` |
| RF-18–RF-20 | `T-042`, `T-043`, `T-062` |
| RF-21–RF-22 | `T-044`, `T-052`, `T-063` |
| RF-23 | `T-066` |
| RF-24–RF-25 | `T-044`, `T-065` |
| G-01–G-08 | `T-090`–`T-097` |
