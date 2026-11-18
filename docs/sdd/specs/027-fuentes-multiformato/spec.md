# Spec 027 · Fuentes multiformato para generación de material académico

| Campo | Valor |
|---|---|
| ID | `027` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-18` |
| Origen | Requisito de producto: usar cualquier archivo admitido como fuente de mapas mentales y cuestionarios |
| Dependencias | `005`, `009`, `010`, `012`, `020`, `021`, `022` |

## 1. Contexto y problema

La generación de mapas mentales y cuestionarios solo acepta apuntes Markdown. El proyecto ya permite subir PDF, DOCX, XLSX, PPTX, CSV, imágenes, audio y video, pero esos recursos no participan en la generación. El estudiante o docente que reúne material en una carpeta debe convertirlo manualmente a Markdown antes de poder generar contenido.

Además, la extracción está acoplada a los generadores. No existe una pieza reutilizable que permita extraer el contenido de un archivo para generarlo desde un solo recurso, para una carpeta completa o, más adelante, para búsqueda semántica y estructuración de apuntes.

## 2. Objetivo

> Como **Owner o Editor de un proyecto**, quiero **generar mapas mentales y cuestionarios a partir de cualquier archivo compatible subido al proyecto, de una carpeta o de un recurso individual**, para **reutilizar el material que ya está reunido en comunidad sin convertirlo previamente a Markdown**.

El resultado debe conservar la trazabilidad de las fuentes usadas, indicar las fuentes omitidas y mantener el material original intacto.

## 3. Alcance

### Incluye

- Agentes de extracción por familia de formato en `infinipaper-agents`.
- Router y orquestador LangGraph que reúne las extracciones.
- Extracción reutilizable mediante un endpoint interno.
- Formatos modernos:
  - Markdown `.md`.
  - PDF `.pdf`.
  - Word OOXML `.docx`, `.docm`, `.dotx`.
  - Hojas de cálculo `.xlsx`, `.xlsm`, `.csv`.
  - Presentaciones `.pptx`, `.pptm`, `.ppsx`.
  - Imágenes `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`.
  - Audio `.mp3`, `.wav`, `.ogg`, `.m4a`.
  - Video `.mp4`, `.m4v`, `.mov`, `.webm`, `.ogv`.
- Extracción de texto de PDF con fallback OCR para páginas escaneadas.
- Extracción de párrafos y tablas de Word.
- Extracción de hojas, tablas y rangos de hojas de cálculo.
- Extracción de títulos, viñetas, tablas y notas de diapositivas.
- OCR de imágenes y fallback opcional a modelo de visión para diagramas sin texto.
- Transcripción de audio con el servicio ASR existente.
- Transcripción de audio de video; fallback opcional a frames cuando no hay audio o transcripción.
- Generación desde un recurso, una carpeta o todo el proyecto.
- Acciones “Generar mapa mental” y “Generar cuestionario” desde un archivo individual en la web.
- Caché de extracción por checksum y versión del extractor.
- Fallos parciales con warnings; el job continúa si queda al menos una fuente válida.
- Etapa y progreso visibles del job.
- Trazabilidad solo de las fuentes que se usaron.
- Feature flag para volver al comportamiento Markdown-only.

### No incluye

- Formatos legacy/ODF: `.doc`, `.odt`, `.xls`, `.xlsb`, `.ods`, `.ppt`, `.odp`. Quedan para una segunda fase.
- Generación desde URLs o páginas web.
- Generación desde la app móvil; esta spec es solo web y API.
- Indexación semántica del texto extraído; queda para una spec posterior.
- “Estructurar con IA” desde formatos no Markdown; queda para una spec posterior.
- Reconstrucción perfecta de tablas complejas, fórmulas o maquetación.
- OCR garantizado de manuscritos o diagramas complejos.
- Comprensión visual avanzada de video.
- Publicación automática de cuestionarios.
- Colaboración en tiempo real.
- Generación de imágenes para preguntas.
- Reemplazo o modificación del recurso original.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | La web permite elegir un recurso individual, una carpeta o todo el proyecto como fuente de generación. | Must |
| RF-02 | Solo Owner y Editor pueden crear generaciones; Viewer y Student no. | Must |
| RF-03 | Se admiten como fuentes `MARKDOWN`, `DOCUMENT`, `IMAGE`, `AUDIO` y `VIDEO`; se excluyen `QUIZ` y `MINDMAP` generados. | Must |
| RF-04 | El servicio de agentes enruta cada fuente a un extractor por familia de formato. | Must |
| RF-05 | PDF extrae texto por página; si una página no tiene texto suficiente, intenta OCR y conserva el localizador de página. | Must |
| RF-06 | Word extrae párrafos, títulos y tablas en orden, con localizadores de sección o tabla. | Must |
| RF-07 | Hojas de cálculo extraen nombre de hoja, encabezados, tablas y un resumen de rangos; CSV usa el mismo contrato. | Must |
| RF-08 | Presentaciones extraen título, texto, tablas y notas por diapositiva, con localizador de diapositiva. | Must |
| RF-09 | Imágenes extraen texto con OCR; si no hay texto suficiente, pueden usar visión para describir diagramas cuando esté configurada. | Should |
| RF-10 | Audio se transcribe con el servicio ASR y conserva metadatos de duración e idioma. | Must |
| RF-11 | Video extrae audio y lo transcribe; si no hay transcripción, puede muestrear frames y aplicar OCR/visión como fallback. | Should |
| RF-12 | Markdown se normaliza sin alterar su contenido semántico. | Must |
| RF-13 | El orquestador ejecuta los extractores, normaliza los documentos y elimina duplicados por checksum. | Must |
| RF-14 | El orquestador conserva estructura, localizadores y referencias a la fuente en el contexto entregado al generador. | Must |
| RF-15 | Si el contexto supera el presupuesto de entrada, el orquestador resume por fuente/sección o recorta con warnings explícitos. | Must |
| RF-16 | El endpoint interno `POST /v1/sources/extract` permite extraer una fuente de forma aislada y reutilizable. | Must |
| RF-17 | El backend reutiliza una extracción cacheada por `resourceId + checksum + versión del extractor`. | Must |
| RF-18 | Un fallo de extracción en un recurso individual falla el job; en una carpeta o proyecto se registra warning y se continúa. | Must |
| RF-19 | Si ninguna fuente produce contenido, el job falla con `EMPTY_SOURCE`. | Must |
| RF-20 | La procedencia del recurso generado incluye solo las fuentes que realmente se usaron. | Must |
| RF-21 | El job expone etapa y progreso (`EXTRACTING`, `GENERATING`, `SAVING`) mientras se procesa. | Should |
| RF-22 | La UI muestra warnings de extracción, archivos omitidos y fuentes usadas. | Must |
| RF-23 | Las generaciones existentes desde Markdown siguen funcionando sin cambios de contrato. | Must |
| RF-24 | Los formatos diferidos se rechazan con un mensaje claro en un recurso individual y se omiten con warning en carpeta/proyecto. | Must |
| RF-25 | La función se puede desactivar con `AGENT_MULTIFORMAT_ENABLED=false` y volver a Markdown-only. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El parseo de formatos es determinista; el LLM solo se usa para visión, resumen y generación. | Tests de extractores con fixtures y modelos falsos. |
| RNF-02 | El contenido extraído se trata como datos no confiables y no se ejecuta como instrucción. | Tests de prompt injection y revisión de prompts. |
| RNF-03 | No se registran contenidos completos, credenciales ni URLs presignadas en logs. | Revisión de logging. |
| RNF-04 | No se ejecutan macros ni binarios subidos; los parsers corren en el contenedor de agentes. | Revisión de configuración y pruebas de archivos con macros. |
| RNF-05 | Cada extracción tiene timeout y límites de páginas, celdas, duración y tamaño. | Variables de entorno y tests de límites. |
| RNF-06 | El servicio de agentes sigue siendo stateless y no accede a la base principal. | Revisión de dependencias. |
| RNF-07 | El backend sigue funcionando si un extractor o el ASR no están disponibles. | Feature flag, warnings y tests de error. |
| RNF-08 | La caché evita repetir OCR/ASR/conversión cuando el archivo no cambió. | Test de segunda generación sin llamada al extractor. |
| RNF-09 | Los extractores son testeables sin servicios externos. | Fixtures, ASR falso y visión falsa. |
| RNF-10 | Los resultados no incluyen HTML ni scripts ejecutables. | Sanitización y validadores. |
| RNF-11 | La UI muestra estados de carga, error, vacío y progreso sin bloquear el proyecto. | Revisión visual y tests de componentes. |
| RNF-12 | Las nuevas dependencias quedan documentadas y el contenedor sigue siendo reproducible. | `uv.lock`, Dockerfile y docs. |

## 6. Criterios de aceptación

### CA-01 · PDF con texto

- **Dado** un PDF con texto y un Editor,
- **cuando** genera un cuestionario desde ese recurso,
- **entonces** el job termina `DONE` y las preguntas citan el PDF como fuente.

### CA-02 · PDF escaneado

- **Dado** un PDF sin capa de texto,
- **cuando** se extrae,
- **entonces** se aplica OCR y el resultado conserva la página de origen y warnings de calidad si existen.

### CA-03 · Word

- **Dado** un DOCX con párrafos y tablas,
- **cuando** se genera un mapa mental,
- **entonces** el contenido incluye ambos y la fuente queda en la procedencia.

### CA-04 · Hoja de cálculo y CSV

- **Dado** un XLSX o CSV,
- **cuando** se genera un cuestionario,
- **entonces** se usan encabezados, tablas y resúmenes de las hojas y se citan las fuentes.

### CA-05 · Presentación

- **Dado** un PPTX,
- **cuando** se genera un mapa mental,
- **entonces** se usan títulos, viñetas y notas por diapositiva.

### CA-06 · Imagen

- **Dado** una imagen con texto,
- **cuando** se extrae,
- **entonces** el OCR produce texto utilizable; si no hay texto y la visión está activa, se devuelve una descripción estructurada.

### CA-07 · Audio

- **Dado** un audio,
- **cuando** se genera material,
- **entonces** se usa la transcripción ASR y se registra la fuente.

### CA-08 · Video

- **Dado** un video con audio,
- **cuando** se extrae,
- **entonces** se transcribe su audio; si no hay transcripción, se intenta el fallback de frames cuando está habilitado.

### CA-09 · Carpeta o proyecto mixto

- **Dado** una carpeta con PDF, DOCX, imagen y Markdown,
- **cuando** se genera un cuestionario,
- **entonces** se usan todas las fuentes compatibles y la procedencia contiene las usadas.

### CA-10 · Recurso individual

- **Dado** un archivo abierto en el visor web,
- **cuando** el Editor elige “Generar cuestionario desde este archivo”,
- **entonces** se crea un job con `source.type=RESOURCE` y el recurso generado aparece en la misma carpeta.

### CA-11 · Fallo parcial

- **Dado** una carpeta con un archivo corrupto y dos válidos,
- **cuando** se genera,
- **entonces** el job termina `DONE`, usa los válidos y muestra un warning con el omitido.

### CA-12 · Sin fuentes válidas

- **Dado** una carpeta sin archivos extraíbles,
- **cuando** se intenta generar,
- **entonces** el job falla con `EMPTY_SOURCE` y no crea un recurso.

### CA-13 · Permisos

- **Dado** un Viewer o Student,
- **cuando** intenta generar,
- **entonces** recibe `403 PROJECT_FORBIDDEN` y no ve las acciones de generación.

### CA-14 · Caché

- **Dado** un recurso ya extraído,
- **cuando** se genera de nuevo sin modificar el archivo,
- **entonces** se reutiliza la extracción y no se repite OCR/ASR.

### CA-15 · Contexto grande

- **Dado** un conjunto de fuentes que supera el presupuesto de entrada,
- **cuando** se orquesta,
- **entonces** se resume o recorta y se devuelve un warning sin inventar contenido.

### CA-16 · Regresión Markdown

- **Dado** un proyecto existente con apuntes Markdown,
- **cuando** se genera un cuestionario o mapa,
- **entonces** el comportamiento y el contrato previos siguen funcionando.

### CA-17 · Recursos generados excluidos

- **Dado** una carpeta con cuestionarios y mapas generados,
- **cuando** se genera un nuevo recurso desde la carpeta,
- **entonces** los `QUIZ` y `MINDMAP` no se usan como fuente.

### CA-18 · Formato diferido

- **Dado** un recurso `.doc` o `.odt`,
- **cuando** se intenta usar como fuente individual,
- **entonces** recibe `UNSUPPORTED_SOURCE_TYPE` con mensaje de fase 2; en carpeta/proyecto se omite con warning.

### CA-19 · Contenido malicioso

- **Dado** un archivo con instrucciones para el modelo,
- **cuando** se extrae y genera,
- **entonces** esas instrucciones se tratan como datos y no alteran el sistema.

### CA-20 · Etapa y warnings

- **Dado** una generación en curso,
- **cuando** la UI consulta el job,
- **entonces** muestra la etapa actual y, al terminar, los warnings de fuentes omitidas o calidad.

## 7. Contratos e interfaces

### API interna de agentes

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/v1/sources/extract` | Bearer | Extrae una fuente y devuelve el documento normalizado |
| `POST` | `/v1/mindmaps/generate` | Bearer | Orquesta las fuentes y genera un mapa mental |
| `POST` | `/v1/quizzes/generate` | Bearer | Orquesta las fuentes y genera un cuestionario |

`POST /v1/sources/extract`:

```json
{
  "jobId": "cuid",
  "source": {
    "resourceId": "cuid",
    "kind": "pdf",
    "name": "tema.pdf",
    "mimeType": "application/pdf",
    "size": 123456,
    "checksum": "sha256...",
    "url": "http://minio:9000/...presigned..."
  },
  "context": {
    "projectId": "cuid",
    "folderId": "cuid",
    "language": "es"
  }
}
```

Respuesta:

```json
{
  "document": {
    "sourceId": "cuid",
    "kind": "pdf",
    "name": "tema.pdf",
    "mimeType": "application/pdf",
    "markdown": "# Tema\n\n...",
    "blocks": [
      { "type": "heading", "locator": "p. 1", "text": "Tema" },
      { "type": "paragraph", "locator": "p. 2", "text": "..." }
    ],
    "metadata": { "pages": 12 },
    "warnings": [],
    "extractor": "pdf/v1"
  },
  "warnings": [],
  "usage": { "model": "", "inputTokens": 0, "outputTokens": 0 },
  "promptVersion": "source-extraction/v1"
}
```

Los endpoints de generación conservan su forma actual. Cada `source` puede incluir una extracción cacheada:

```json
{
  "extraction": {
    "markdown": "# Tema...",
    "blocks": [],
    "metadata": {},
    "warnings": [],
    "extractor": "pdf/v1"
  }
}
```

Si `extraction` no está presente, el orquestador la obtiene desde la URL presignada.

La respuesta de generación añade:

```json
{
  "usedSourceIds": ["cuid1", "cuid2"],
  "warnings": ["Se omitió informe.doc: formato diferido a fase 2"],
  "usage": { "model": "...", "inputTokens": 0, "outputTokens": 0 },
  "promptVersion": "content-orchestrator/v1"
}
```

### API NestJS

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/folders/:folderId/mindmaps` | Editor+ | Genera desde `RESOURCE`, `FOLDER` o `PROJECT` |
| `POST` | `/api/v1/folders/:folderId/quizzes/generate` | Editor+ | Genera desde `RESOURCE`, `FOLDER` o `PROJECT` |
| `GET` | `/api/v1/generation-jobs/:generationJobId` | Editor+ | Estado, etapa, warnings y fuentes usadas |

El DTO de fuente se mantiene:

```json
{ "type": "RESOURCE", "id": "cuid" }
```

### Datos

```prisma
model ResourceExtraction {
  id               String         @id @default(cuid())
  resourceId       String
  checksum         String?
  extractor        String
  extractorVersion String
  status           AgentJobStatus @default(QUEUED)
  content          String?        @db.Text
  metadata         Json?
  warnings         Json?
  error            String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([resourceId, checksum, extractorVersion])
  @@index([resourceId, status])
}
```

`ContentGenerationJob` añade:

```prisma
stage    String?
progress Json?
```

`Resource` añade la relación `extractions ResourceExtraction[]`.

### UI

- Diálogo de generación con fuentes por carpeta, proyecto o recurso.
- Acciones de generación en el visor de archivo.
- Texto informativo: “Se usarán todos los archivos compatibles de la carpeta/proyecto”.
- Indicador de etapa y progreso.
- Panel de warnings con archivos omitidos y calidad de extracción.
- Enlace a las fuentes usadas.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Recurso individual de formato diferido | Rechazar con mensaje de fase 2 | `UNSUPPORTED_SOURCE_TYPE` · 415 |
| Formato diferido dentro de carpeta/proyecto | Omitir y advertir | `200` con warning |
| Archivo corrupto o ilegible | Warning; si es la única fuente, fallar | `SOURCE_EXTRACTION_FAILED` · 422 |
| Fuente vacía | Warning; si todas están vacías, fallar | `EMPTY_SOURCE` · 422 |
| OCR sin texto | Warning de calidad; si no hay contenido, omitir | `SOURCE_EMPTY` · 422 |
| ASR caído | Warning; si no hay otra fuente, fallar | `ASR_SERVICE_ERROR` · 502 |
| Visión no configurada | Usar solo OCR | `200` con warning |
| Demasiadas fuentes | Rechazar antes de crear el job | `TOO_MANY_SOURCES` · 422 |
| Contexto demasiado grande | Resumir/recortar con warning | `200` con warning |
| Sin permisos | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Proyecto archivado | Rechazar generación | `PROJECT_ARCHIVED` · 423 |
| Proveedor LLM caído | Job `FAILED` con código | `AGENT_PROVIDER_ERROR` · 502 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Un extractor por familia de formato, no uno por extensión. | Cerrada |
| D-02 | Parseo determinista; LLM solo para visión, resumen y generación. | Cerrada |
| D-03 | Orquestador LangGraph determinista con fan-out, no un supervisor LLM. | Cerrada |
| D-04 | Caché `ResourceExtraction` por checksum y versión de extractor. | Cerrada |
| D-05 | Contenido extraído en PostgreSQL con límite; migrar a MinIO si el volumen crece. | Cerrada |
| D-06 | Formatos legacy/ODF quedan para fase 2. | Cerrada |
| D-07 | Generación solo web en esta fase. | Cerrada |
| D-08 | `QUIZ` y `MINDMAP` generados se excluyen como fuentes. | Cerrada |
| D-09 | Fallo parcial en carpeta/proyecto; fallo total en recurso individual. | Cerrada |
| D-10 | Video usa audio/ASR primero; frames como fallback opcional. | Cerrada |
| D-11 | Acciones de generación desde archivo individual en el visor. | Cerrada |
| D-12 | La extracción queda reutilizable para búsqueda y estructuración en specs posteriores. | Cerrada |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Formatos legacy/ODF no soportados en esta fase. | Algunos archivos antiguos no se pueden usar como fuente. | `T-090` |
| G-02 | Sin generación desde la app móvil. | La función queda limitada a la web. | `T-093` |
| G-03 | La extracción no se conecta aún con búsqueda semántica. | PDFs, imágenes y videos no son buscables. | `T-091` |
| G-04 | “Estructurar con IA” sigue limitado a Markdown. | Los apuntes estructurados no usan la nueva extracción. | `T-092` |
| G-05 | OCR/visión no garantizan manuscritos ni diagramas complejos. | La calidad depende del archivo y del proveedor. | `T-095` |
| G-06 | Las preguntas citan recursos, no páginas/diapositivas. | La trazabilidad es a nivel de archivo. | `T-094` |
| G-07 | Sin fuentes web. | No se pueden usar URLs como material. | `T-096` |
| G-08 | Contenido extraído en PostgreSQL con límite de tamaño. | El crecimiento futuro puede requerir MinIO. | `T-097` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01 | PDF de 4 páginas extraído y usado en un cuestionario y en un mapa mental de un solo recurso. | 2026-11-18 |
| CA-02 | PDF escaneado de 2 páginas procesado con OCR; warnings de página 1 y 2; mapa mental `DONE`. | 2026-11-18 |
| CA-03 | DOCX con párrafos y tablas incluido en la generación de carpeta. | 2026-11-18 |
| CA-04 | XLSX usado como fuente junto con el resto de la carpeta. | 2026-11-18 |
| CA-05 | PPTX con título y notas incluido en la generación de carpeta. | 2026-11-18 |
| CA-06 | Seis PNG procesados con OCR y usados en la generación. | 2026-11-18 |
| CA-07 | `jfk.wav` transcrito por Whisper y usado para un mapa mental. | 2026-11-18 |
| CA-08 | `jfk.mp4` con audio convertido con ffmpeg y transcrito; mapa mental `DONE`. | 2026-11-18 |
| CA-09 | Carpeta con PDF, DOCX, XLSX, PPTX y seis imágenes: 10 fuentes usadas. | 2026-11-18 |
| CA-10 | Mapa mental desde `material.pdf` con `source.type=RESOURCE`; botones visibles en el visor. | 2026-11-18 |
| CA-11 | Carpeta con `viejo.doc`: job `DONE` y warning de formato diferido. | 2026-11-18 |
| CA-12 | La ruta sin fuentes produce `EMPTY_SOURCE`; validado en el primer intento de integración. | 2026-11-18 |
| CA-13 | Los endpoints siguen protegidos por `ProjectAccessGuard` con rol Editor+. | 2026-11-18 |
| CA-14 | Segunda generación usó la caché: 0 llamadas a `/v1/sources/extract`. | 2026-11-18 |
| CA-15 | Test unitario del orquestador con presupuesto reducido y warning de recorte. | 2026-11-18 |
| CA-16 | Tests existentes del backend/agentes y flujo Markdown siguen pasando. | 2026-11-18 |
| CA-17 | La carpeta contenía cuestionarios y mapas generados; no aparecieron entre las fuentes. | 2026-11-18 |
| CA-18 | `.doc` individual devuelve `UNSUPPORTED_SOURCE_TYPE` 415; en carpeta se omite con warning. | 2026-11-18 |
| CA-19 | El prompt del sistema mantiene el contenido como datos; no se observó ejecución de instrucciones. | 2026-11-18 |
| CA-20 | La cola y el diálogo muestran etapa, progreso y warnings; verificado en navegador. | 2026-11-18 |
| RNF-01–RNF-12 | `ruff`, `pytest` (31), `pyright`, lint/test/build backend y lint/build frontend correctos. | 2026-11-18 |
