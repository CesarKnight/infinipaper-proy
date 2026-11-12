# Spec 012 · Estructuración de apuntes con agentes IA

| Campo | Valor |
|---|---|
| ID | `012` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-12 |
| Dependencias | `spec 001` (usuarios), `spec 003` (carpetas), `spec 005` (archivos), `spec 008` (permisos), `spec 009` (apuntes) |

> **Diagramas:** [Secuencia](../../diagramas/secuencia/012-estructuracion-apuntes.md) · [Casos de uso](../../diagramas/casos-de-uso.md) · [Clases](../../diagramas/clases.md) · [Paquetes](../../diagramas/paquetes.md) · [C4](../../diagramas/arquitectura-c4.md)

## 1. Contexto y problema

Los apuntes se crean con el editor Markdown, pero pueden acabar desorganizados: títulos inconsistentes, ideas mezcladas, listas sin jerarquía, bloques de código sueltos y contenido duplicado. Reorganizarlos manualmente consume tiempo y no siempre se conserva la información original.

Infinipaper necesita un agente de IA capaz de leer un apunte `.md` almacenado en MinIO, analizarlo, proponer una estructura y devolver una versión organizada. El resultado debe revisarse antes de aplicarse y no debe modificar el apunte original. El diseño debe permitir que, en el futuro, el mismo flujo incorpore PDF, imágenes, audio, video y páginas web, y que distintos agentes colaboren en el grafo.

## 2. Objetivo

> Como **estudiante con permisos de edición**, quiero **accionar un agente de IA sobre un apunte Markdown desorganizado** para **obtener una versión estructurada, revisable y sin pérdida del contenido original**.

## 3. Alcance

### Incluye

- Botón "Estructurar con IA" en el visor de apuntes `.md`.
- Job asíncrono con estados `QUEUED`, `PROCESSING`, `DONE`, `FAILED`.
- Servicio FastAPI stateless con LangGraph.
- Router determinista por tipo de fuente; v1 solo Markdown.
- Agente estructurador con herramientas de análisis y validación.
- Acceso al contenido mediante URL presignada de MinIO.
- Preview del resultado, warnings y diff antes de aplicar.
- Aplicación como **nuevo** apunte `<nombre>-estructurado.md`.
- Permisos Owner/Editor; Viewer no ejecuta ni aplica.
- Logs estructurados y trazas OpenTelemetry opcionales.
- Contrato preparado para múltiples fuentes y agentes futuros.

### No incluye

- PDF, imágenes, audio, video o web en v1.
- RAG sobre todo el proyecto.
- Búsqueda de imágenes relacionadas.
- Reemplazo del apunte original o historial de versiones.
- Checkpointing persistente del grafo en v1.
- Aprobación humana dentro del grafo; la confirmación ocurre en la UI antes de aplicar.
- Fine-tuning.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El visor de un `.md` muestra "Estructurar con IA" a Owner/Editor. | Must |
| RF-02 | Al accionar, se crea un `NoteStructureJob` y se encola en pg-boss. | Must |
| RF-03 | Solo puede existir un job activo (`QUEUED`/`PROCESSING`) por recurso. | Must |
| RF-04 | El worker genera una URL presignada y llama al servicio de agentes con token interno. | Must |
| RF-05 | El servicio de agentes descarga el `.md` desde la URL presignada y verifica su checksum. | Must |
| RF-06 | El grafo enruta por tipo de fuente; en v1 rechaza tipos distintos de Markdown con `UNSUPPORTED_SOURCE_TYPE`. | Must |
| RF-07 | El agente analiza el Markdown, propone un outline y genera un Markdown estructurado. | Must |
| RF-08 | El resultado se valida: jerarquía de encabezados, fences cerrados, enlaces y cobertura del original. | Must |
| RF-09 | Si la validación falla, el grafo reintenta una vez con el informe de errores. | Should |
| RF-10 | El job guarda `resultMarkdown`, warnings, modelo y usage de tokens. | Must |
| RF-11 | La UI hace polling del job y muestra progreso, preview, diff y warnings. | Must |
| RF-12 | Aplicar crea un `Resource` MARKDOWN nuevo; el original no se modifica. | Must |
| RF-13 | El nombre del nuevo apunte es `<base>-estructurado.md`; si existe, se devuelve `409 FILE_NAME_TAKEN`. | Must |
| RF-14 | Un Viewer no puede crear jobs ni aplicar resultados. | Must |
| RF-15 | El servicio de agentes exige `Authorization: Bearer <AGENT_SERVICE_TOKEN>`. | Must |
| RF-16 | La función se puede desactivar con `AGENT_STRUCTURING_ENABLED=false`. | Must |
| RF-17 | El contrato acepta `sources: []` para futuros PDF, imágenes, audio, video y web. | Must |
| RF-18 | El grafo debe permitir añadir agentes futuros sin cambiar el contrato HTTP. | Should |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El servicio de agentes es stateless y no accede a la base de datos principal. | Revisión de dependencias y configuración. |
| RNF-02 | El contenido del apunte se trata como datos no confiables; no se ejecuta ni se sigue como instrucción. | Tests de prompt injection y revisión de prompts. |
| RNF-03 | No se registran contenidos completos ni secretos en logs. | Revisión de logging. |
| RNF-04 | Timeout configurable y límite de tokens de entrada/salida. | Variables de entorno y tests. |
| RNF-05 | El backend sigue funcionando si el servicio de agentes está caído. | Feature flag y manejo de error del worker/UI. |
| RNF-06 | El resultado es Markdown válido y renderizable por la vista sanitizada. | Validación + `rehype-sanitize`. |
| RNF-07 | La UI muestra estados de carga, error y éxito sin bloquear el editor. | Revisión visual y Playwright. |
| RNF-08 | El grafo y sus nodos son testeables con modelos falsos. | Tests con `FakeListChatModel`/modelo determinista. |

## 6. Criterios de aceptación

### CA-01 · Botón visible

- **Dado** un usuario Owner/Editor en un apunte `.md`,
- **cuando** abre el visor,
- **entonces** ve "Estructurar con IA"; un Viewer no lo ve.

### CA-02 · Crear job

- **Dado** un apunte `.md` y un usuario Editor,
- **cuando** pulsa "Estructurar con IA",
- **entonces** se crea un `NoteStructureJob` en `QUEUED` y se encola.

### CA-03 · Job activo

- **Dado** un job `QUEUED` o `PROCESSING` para el mismo recurso,
- **cuando** se intenta crear otro,
- **entonces** responde `409 STRUCTURE_JOB_IN_PROGRESS` con el `jobId` existente.

### CA-04 · Acceso al bucket

- **Dado** un job en proceso,
- **cuando** el worker llama al servicio de agentes,
- **entonces** el agente descarga el `.md` desde una URL presignada y verifica el checksum.

### CA-05 · Estructuración

- **Dado** un apunte desorganizado,
- **cuando** el agente termina,
- **entonces** el resultado contiene un título, resumen, secciones jerárquicas y conserva hechos, enlaces y bloques de código.

### CA-06 · Validación

- **Dado** un resultado con encabezados inválidos o fences abiertos,
- **cuando** se valida,
- **entonces** el grafo reintenta una vez; si sigue inválido, devuelve warnings o falla con `AGENT_INVALID_OUTPUT`.

### CA-07 · Preview y diff

- **Dado** un job `DONE`,
- **cuando** la UI muestra el resultado,
- **entonces** permite comparar original y estructurado y muestra los warnings.

### CA-08 · Aplicar

- **Dado** un job `DONE` y un usuario Editor,
- **cuando** aplica,
- **entonces** se crea `<base>-estructurado.md` en la misma carpeta y el original permanece intacto.

### CA-09 · Permisos

- **Dado** un Viewer,
- **cuando** intenta crear un job o aplicar,
- **entonces** responde `403 PROJECT_FORBIDDEN`.

### CA-10 · Tipos no soportados

- **Dado** un `source.kind` distinto de `markdown`,
- **entonces** el servicio responde `UNSUPPORTED_SOURCE_TYPE` y no llama al LLM.

### CA-11 · Token interno

- **Dado** una petición sin token o con token inválido al servicio de agentes,
- **entonces** responde 401.

### CA-12 · Feature flag

- **Dado** `AGENT_STRUCTURING_ENABLED=false`,
- **entonces** el botón no se muestra y el endpoint responde `AGENT_STRUCTURING_DISABLED` 503.

### CA-13 · Fallo del agente

- **Dado** un timeout o error del proveedor,
- **entonces** el job queda `FAILED` con un código claro y el apunte original no se modifica.

## 7. Contratos e interfaces

### API NestJS

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/files/:fileId/structure` | Editor+ | Crea el job y lo encola |
| `GET` | `/api/v1/structure-jobs/:jobId` | Editor+ | Estado, resultado y usage |
| `POST` | `/api/v1/structure-jobs/:jobId/apply` | Editor+ | Crea el apunte estructurado |
| `GET` | `/api/v1/config` | Público | Incluye `agentStructuringEnabled` |

`POST /files/:fileId/structure`:

```json
{ "language": "es", "instructions": "Ordena por temas y añade preguntas de repaso" }
```

Respuesta `202`:

```json
{ "id": "cuid", "status": "QUEUED" }
```

`GET /structure-jobs/:jobId`:

```json
{
  "id": "cuid",
  "resourceId": "cuid",
  "status": "DONE",
  "result": { "markdown": "# ...", "warnings": [], "outline": [] },
  "usage": { "model": "...", "inputTokens": 1234, "outputTokens": 2345 },
  "error": null
}
```

`POST /structure-jobs/:jobId/apply`:

```json
{ "name": "tema-estructurado.md" }
```

### API FastAPI

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/health` | No | Healthcheck |
| `POST` | `/v1/notes/structure` | Bearer | Ejecuta el grafo |

```json
{
  "jobId": "cuid",
  "sources": [
    {
      "resourceId": "cuid",
      "kind": "markdown",
      "name": "tema.md",
      "mimeType": "text/markdown",
      "size": 1234,
      "checksum": "sha256...",
      "url": "http://minio:9000/...presigned..."
    }
  ],
  "context": {
    "projectId": "cuid",
    "folderId": "cuid",
    "language": "es",
    "instructions": "..."
  }
}
```

Respuesta:

```json
{
  "markdown": "# Título...",
  "outline": [{ "heading": "Resumen", "level": 2 }],
  "warnings": [],
  "coverage": 0.93,
  "usage": { "model": "...", "inputTokens": 1234, "outputTokens": 2345 },
  "promptVersion": "note-structurer/v1"
}
```

## 8. Modelo de datos

```prisma
enum AgentJobStatus {
  QUEUED
  PROCESSING
  DONE
  FAILED
}

model NoteStructureJob {
  id               String          @id @default(cuid())
  resourceId       String
  requestedById    String
  status           AgentJobStatus  @default(QUEUED)
  language         String          @default("es")
  instructions     String?
  sourceChecksum   String?
  resultMarkdown   String?
  resultResourceId String?         @unique
  warnings         Json?
  error            String?
  model            String?
  promptVersion    String?
  inputTokens      Int?
  outputTokens     Int?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  resource       Resource @relation("StructureJobs", fields: [resourceId], references: [id], onDelete: Cascade)
  requestedBy    User     @relation(fields: [requestedById], references: [id])
  resultResource Resource? @relation("StructuredResult", fields: [resultResourceId], references: [id], onDelete: SetNull)

  @@index([resourceId])
  @@index([status])
}
```

Relaciones inversas en `User` y `Resource`.

## 9. Grafo LangGraph

### Estado

`GraphState` con `job_id`, `sources`, `extracted`, `outline`, `draft_markdown`, `validation`, `warnings`, `usage`, `retry_count`, `error`.

### Nodos v1

| Nodo | Tipo | Responsabilidad |
|---|---|---|
| `load_request` | Determinista | Validar payload y normalizar fuentes |
| `route_sources` | Determinista | Enrutar por `kind`; v1 solo Markdown |
| `extract_markdown` | Herramienta | Descargar y verificar el `.md` |
| `aggregate_context` | Determinista | Unir documentos y procedencia |
| `plan_outline` | LLM | Proponer secciones |
| `structure_note` | LLM | Generar Markdown estructurado |
| `validate` | Determinista | Validar estructura y cobertura |
| `repair` | LLM | Corregir con el informe de validación |
| `finalize` | Determinista | Devolver resultado |
| `unsupported` | Determinista | Devolver error de tipo no soportado |

### Futuro

`extract_pdf`, `extract_image`, `transcribe_audio`, `extract_video`, `extract_web`, `related_images`; fan-out con `Send`, agregación y posible `PostgresSaver`.

## 10. UI

- `files/[fileId]/page.tsx`: botón para MARKDOWN y `canEdit`.
- `structure-note-dialog.tsx`: instrucciones, progreso, preview, diff, warnings y aplicar.
- Polling cada 2 s hasta `DONE`/`FAILED`.
- El original no se modifica; se informa explícitamente.

## 11. Casos borde y errores

| Situación | Comportamiento | Código/HTTP |
|---|---|---|
| Servicio desactivado | Rechazar | `AGENT_STRUCTURING_DISABLED` · 503 |
| Recurso no Markdown | Rechazar | `UNSUPPORTED_SOURCE_TYPE` · 415 |
| Job activo | Rechazar con jobId | `STRUCTURE_JOB_IN_PROGRESS` · 409 |
| Job inexistente | Rechazar | `STRUCTURE_JOB_NOT_FOUND` · 404 |
| Job no terminado | Rechazar apply | `STRUCTURE_JOB_NOT_READY` · 409 |
| Resultado vacío | Rechazar apply | `STRUCTURE_RESULT_EMPTY` · 422 |
| Nombre duplicado | Rechazar | `FILE_NAME_TAKEN` · 409 |
| Timeout del agente | Job `FAILED` | `AGENT_TIMEOUT` |
| Límite del proveedor | Job `FAILED` | `AGENT_RATE_LIMITED` · 429 |
| Error del proveedor | Job `FAILED` | `AGENT_PROVIDER_ERROR` |
| Salida inválida | Job `FAILED` o warnings | `AGENT_INVALID_OUTPUT` |
| Checksum distinto | Job `FAILED` | `SOURCE_CHANGED` |
| Token interno inválido | Rechazar | `AGENT_UNAUTHORIZED` · 401 |

## 12. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | LangGraph como orquestador, con router determinista en v1. | Cerrada |
| D-02 | FastAPI stateless; NestJS + pg-boss conservan el estado del job. | Cerrada |
| D-03 | Sin checkpointer persistente en v1. | Cerrada |
| D-04 | Aplicar crea un apunte nuevo; el original no se modifica. | Cerrada |
| D-05 | Observabilidad con logs estructurados + OTel opcional. | Cerrada |
| D-06 | Modelo configurable por entorno y por nodo; soporta OpenAI-compatible, AWS Bedrock y OpenCode Go. | Cerrada |
| Q-01 | ¿Cuándo se añaden los extractores PDF/imagen/audio/video/web? | Abierta (futuro) |
| Q-02 | ¿Se añadirá PostgresSaver y `interrupt()` para aprobación dentro del grafo? | Abierta (futuro) |
| Q-03 | ¿Se añadirá búsqueda semántica de imágenes relacionadas? | Abierta (futuro) |

## 13. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | v1 solo soporta Markdown. | PDF, imágenes, audio, video y web quedan para fases posteriores. | `T-070` |
| G-02 | Sin checkpointer persistente. | Un reinicio del servicio pierde el estado interno del grafo; NestJS reintenta el job. | `T-071` |
| G-03 | Sin búsqueda de imágenes relacionadas. | El contexto se limita a las fuentes entregadas. | `T-072` |
| G-04 | Bedrock devuelve `ThrottlingException` porque la cuota diaria de tokens es `0`; la clave local de OpenCode Go está expirada. | La estructuración real no puede completarse hasta aprovisionar cuota o una clave válida. | `T-057` |

## 14. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02 | Botón visible y job creado desde la UI con Playwright. | 2026-11-12 |
| CA-03 | Job activo rechazado con `STRUCTURE_JOB_IN_PROGRESS`. | 2026-11-12 |
| CA-04, CA-05 | Flujo backend con agente mock: presigned URL, job `DONE` y resultado estructurado. | 2026-11-12 |
| CA-06 | Validación y reparación cubiertas por tests del grafo. | 2026-11-12 |
| CA-07, CA-08 | Preview/diff y creación de `tema-estructurado.md` verificados en la UI. | 2026-11-12 |
| CA-09, CA-10 | Permisos Editor+ y rechazo de fuentes no Markdown revisados. | 2026-11-12 |
| CA-11 | Token Bearer inválido devuelve 401 en tests FastAPI. | 2026-11-12 |
| CA-12 | E2E con `AGENT_STRUCTURING_ENABLED=false`: `/config` devuelve `false` y `POST /files/:id/structure` responde 503 `AGENT_STRUCTURING_DISABLED`. | 2026-11-12 |
| CA-13 | Timeout cubierto por test unitario: `AGENT_TIMEOUT` con HTTP 504. | 2026-11-12 |
| CA-13 / RNF-05 | E2E real con Bedrock: job `FAILED` con `AGENT_RATE_LIMITED`, original intacto y sin recurso resultado. | 2026-11-12 |
| RNF-04 | Factory de proveedor validada con tests para OpenAI-compatible, AWS Bedrock y OpenCode Go. | 2026-11-12 |
