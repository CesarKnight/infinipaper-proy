# Tasks 027 · Fuentes multiformato para generación de material académico

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea tiene ID `T-NNN` y cita los requisitos o criterios que satisface.
- No se marca una tarea como hecha solo porque el código existe: debe estar verificado.
- Las tareas de brechas (`G-*`) se añaden al final y no bloquean el cierre si se aceptan explícitamente.

## Fase 0 · Preparación

- [x] `T-001` Leer spec, plan y constitución; confirmar decisiones cerradas. <RF-01–RF-25>
- [x] `T-002` Confirmar que legacy/ODF, móvil y búsqueda quedan fuera de esta fase. <G-01–G-04>

## Fase 1 · Datos

- [x] `T-010` Añadir `ResourceExtraction`, relación en `Resource` y campos `stage`/`progress` en `ContentGenerationJob`. <RF-17, RF-21>
- [x] `T-011` Crear migración Prisma y verificar rollback. <RNF-12>
- [x] `T-012` Añadir índices y restricción única de extracción por checksum/version. <RNF-08>

## Fase 2 · Contratos y extractores

- [x] `T-020` Ampliar `SourceKind`, `SourceBlock`, `ExtractedDocument`, `ExtractRequest` y `ExtractResponse`. <RF-04, RF-14>
- [x] `T-021` Implementar registro MIME/extensión → extractor y errores comunes. <RF-04, RF-24>
- [x] `T-022` Implementar extractor Markdown. <RF-12>
- [x] `T-023` Implementar extractor PDF con texto y OCR por página. <RF-05, CA-01, CA-02>
- [x] `T-024` Implementar extractor Word para DOCX/DOCM/DOTX con párrafos y tablas. <RF-06, CA-03>
- [x] `T-025` Implementar extractor de hojas de cálculo XLSX/XLSM/CSV. <RF-07, CA-04>
- [x] `T-026` Implementar extractor de presentaciones PPTX/PPTM/PPSX. <RF-08, CA-05>
- [x] `T-027` Implementar extractor de imágenes con OCR y visión opcional. <RF-09, CA-06>
- [x] `T-028` Implementar extractor de audio con ASR. <RF-10, CA-07>
- [x] `T-029` Implementar extractor de video con ffmpeg/ASR y fallback de frames. <RF-11, CA-08>

## Fase 3 · Orquestador y endpoint de extracción

- [x] `T-030` Implementar router y fan-out LangGraph por fuente. <RF-13, RNF-09>
- [x] `T-031` Implementar normalización, deduplicación, presupuesto y curador de contexto. <RF-14, RF-15, CA-15>
- [x] `T-032` Implementar `POST /v1/sources/extract` con autenticación Bearer. <RF-16>
- [x] `T-033` Integrar el orquestador en `generate_mindmap` y `generate_quiz`, eliminando el rechazo Markdown-only. <RF-13, RF-23>
- [x] `T-034` Devolver `usedSourceIds`, warnings y usage agregado de extractores/generador. <RF-14, RF-20>

## Fase 4 · Backend

- [x] `T-040` Cambiar `resolveSources()` para admitir `MARKDOWN`, `DOCUMENT`, `IMAGE`, `AUDIO` y `VIDEO`, excluyendo `QUIZ`/`MINDMAP`. <RF-03, CA-17>
- [x] `T-041` Implementar caché de extracción con `ResourceExtraction` y llamada a `/v1/sources/extract`. <RF-17, CA-14>
- [x] `T-042` Enviar extracciones cacheadas opcionales al cliente de agentes y recibir `usedSourceIds`. <RF-13, RF-20>
- [x] `T-043` Implementar fallo parcial, warnings, `EMPTY_SOURCE` y límites de fuentes/bytes. <RF-18, RF-19, CA-11, CA-12>
- [x] `T-044` Actualizar `stage`/`progress` durante extracción, generación y guardado. <RF-21, CA-20>
- [x] `T-045` Persistir en procedencia solo las fuentes usadas. <RF-20, CA-09>
- [x] `T-046` Añadir feature flag `AGENT_MULTIFORMAT_ENABLED` y conservar el camino Markdown-only. <RF-25, CA-16>
- [x] `T-047` Implementar rechazo claro de formatos diferidos en recurso individual y omisión con warning en carpeta/proyecto. <RF-24, CA-18>
- [x] `T-048` Exponer etapa y warnings en `GET /generation-jobs/:id`. <RF-22, CA-20>

## Fase 5 · Frontend

- [x] `T-050` Permitir `source.type=RESOURCE` en `GenerationDialog` y ajustar textos. <RF-01, CA-10>
- [x] `T-051` Añadir acciones de generación desde el visor de archivo para Editor+. <RF-01, CA-10>
- [x] `T-052` Mostrar etapa, progreso y warnings de fuentes omitidas. <RF-21, RF-22, CA-20>
- [x] `T-053` Mostrar tipos de fuente compatibles y excluir generados en la UI. <RF-03, CA-17>
- [x] `T-054` Implementar estados de carga, vacío, error y éxito con enlace al recurso. <RNF-11>
- [x] `T-055` Actualizar tipos de `ContentGenerationJob` y extracción en `lib/types.ts`. <RF-22>

## Fase 6 · Pruebas y verificación

- [x] `T-060` Tests unitarios de extractores con fixtures pequeños (PDF, DOCX, XLSX, PPTX, CSV, PNG). <CA-01–CA-06>
- [x] `T-061` Tests de audio/video con ASR falso y ffmpeg mockeado. <CA-07, CA-08>
- [x] `T-062` Tests del orquestador: fan-out, deduplicación, presupuesto y fallos parciales. <CA-09, CA-11, CA-15>
- [x] `T-063` Tests backend de fuentes, caché, procedencia y feature flag. <CA-09, CA-14, CA-16>
- [x] `T-064` Verificación manual con carpeta mixta real y generación desde recurso individual. <CA-01–CA-10>
- [x] `T-065` Tests de permisos, formatos diferidos, archivo corrupto y prompt injection. <CA-13, CA-18, CA-19>
- [x] `T-066` Ejecutar `ruff`, `pytest`, `pyright`, lint/test/build de backend y lint/build de frontend. <RNF-01–RNF-12>

## Fase 7 · Documentación y cierre

- [x] `T-070` Actualizar spec con evidencia y estado. <RNF-12>
- [x] `T-071` Actualizar índice de specs, librerías, infraestructura, README de agentes y diagramas. <RNF-12>
- [x] `T-072` Registrar brechas `G-*` y confirmar las que se difieren. <G-01–G-08>

## Fase 8 · Brechas diferidas

- [ ] `T-090` Soportar `.doc`, `.odt`, `.xls`, `.xlsb`, `.ods`, `.ppt` y `.odp` con LibreOffice. <G-01>
- [ ] `T-091` Conectar `ResourceExtraction` con búsqueda semántica. <G-03>
- [ ] `T-092` Permitir “Estructurar con IA” desde formatos no Markdown. <G-04>
- [ ] `T-093` Añadir generación desde la app móvil. <G-02>
- [ ] `T-094` Añadir citas a página/diapositiva en preguntas y mapas. <G-06>
- [ ] `T-095` Mejorar OCR/visión para manuscritos y diagramas complejos. <G-05>
- [ ] `T-096` Añadir fuentes web. <G-07>
- [ ] `T-097` Mover contenido extraído a MinIO si el volumen lo requiere. <G-08>

## Verificación final

- [x] Todos los `CA-*` tienen evidencia.
- [x] No quedan tareas obligatorias pendientes.
- [x] La spec está en el estado correcto.
- [x] El plan de rollback está documentado.
