# Infinipaper Agents

Servicio FastAPI + **LangGraph** para extraer fuentes académicas y generar material estructurado. Es stateless: recibe una o más fuentes con URLs presignadas de MinIO, extrae su contenido y lo entrega a los generadores de apuntes, mapas mentales y cuestionarios.

## Estructura

```
src/infinipaper_agents/
├── main.py                 # FastAPI + lifespan
├── config.py               # Settings (pydantic-settings)
├── schemas.py              # Contratos Pydantic
├── auth.py                 # Bearer token interno
├── model.py                # Modelo LangChain configurable
├── graph/
│   ├── state.py            # GraphState
│   ├── nodes.py            # Nodos del grafo de apuntes
│   ├── builder.py          # StateGraph de apuntes
│   └── content.py          # Generación de mapas y cuestionarios
├── sources/                # Extractores por familia de formato
│   ├── registry.py         # MIME/extensión → extractor
│   ├── orchestrator.py     # Fan-out, deduplicación y presupuesto
│   └── pdf.py / word.py / spreadsheet.py / slides.py / image.py / audio.py / video.py
├── tools/
│   ├── fetch.py            # Descarga desde URL presignada
│   └── markdown.py         # Análisis y validación
└── api/routes/
    ├── notes.py            # POST /v1/notes/structure
    ├── content.py          # Mapas y cuestionarios
    └── sources.py          # POST /v1/sources/extract
```

## Desarrollo

```bash
cp .env.example .env
uv sync --all-groups
uv run uvicorn infinipaper_agents.main:app --reload --port 8100
```

Health: `curl http://localhost:8100/health`.

## Pruebas

```bash
uv run ruff check src tests
uv run pytest
uv run pyright
```

Los tests del grafo usan `FakeListChatModel`, sin llamadas reales al proveedor.

## Contrato

`POST /v1/notes/structure` requiere `Authorization: Bearer <AGENT_SERVICE_TOKEN>`:

```json
{
  "jobId": "...",
  "sources": [
    {
      "resourceId": "...",
      "kind": "markdown",
      "name": "tema.md",
      "mimeType": "text/markdown",
      "size": 1234,
      "checksum": "...",
      "url": "http://minio:9000/...presigned..."
    }
  ],
  "context": {
    "projectId": "...",
    "folderId": "...",
    "language": "es",
    "instructions": "..."
  }
}
```

Los tipos de fuente admitidos son `markdown`, `pdf`, `word`, `spreadsheet`, `slides`, `image`, `audio` y `video`. Los formatos legacy/ODF (`.doc`, `.odt`, `.xls`, `.xlsb`, `.ods`, `.ppt`, `.odp`) se habilitarán en una segunda fase.

`POST /v1/sources/extract` extrae una sola fuente y devuelve un documento normalizado. `POST /v1/mindmaps/generate` y `POST /v1/quizzes/generate` orquestan varias fuentes y generan el recurso final. Los endpoints requieren `Authorization: Bearer <AGENT_SERVICE_TOKEN>`.

## Configuración de proveedores

### OpenAI-compatible (por defecto)

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_NAME=gpt-4o-mini
MODEL_BASE_URL=https://api.openai.com/v1
MODEL_API_KEY=...
```

También sirve para DeepSeek, un gateway o un endpoint local compatible con OpenAI.

### OpenCode Go

OpenCode Go expone un endpoint OpenAI-compatible. Usa el ID de modelo **sin** el prefijo `opencode-go/`.

```dotenv
MODEL_PROVIDER=opencode-go
OPENCODE_API_KEY=<api-key-de-opencode-console>
OPENCODE_BASE_URL=https://opencode.ai/inference/go/openai/v1
OPENCODE_MODEL=deepseek-v4.1-flash
AGENT_OPENCODE_SESSION_ID=infinipaper-agents
```

El cliente envía automáticamente:

- `Authorization: Bearer <OPENCODE_API_KEY>`
- `x-opencode-session: <AGENT_OPENCODE_SESSION_ID>`
- `User-Agent: infinipaper-agents/0.1.0`

Crea la API key en <https://opencode.ai/console/account#api-keys>. Si la clave está expirada, el endpoint responde `api_key_expired`; genera una nueva.

Para apuntes largos, el modelo puede agotar el límite de salida antes de cerrar el JSON. Los valores recomendados son `AGENT_MAX_OUTPUT_TOKENS=24000` y `AGENT_TIMEOUT_SECONDS=300`. Si aun así se trunca, el job falla con `AGENT_OUTPUT_TRUNCATED`; reduce el tamaño del apunte o aumenta el límite.

### AWS Bedrock

```dotenv
MODEL_PROVIDER=bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
AWS_REGION=us-east-1
# Credenciales: usa un rol IAM o define estas variables
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
# Alternativa: perfil local
AWS_PROFILE=
```

El modelo se resuelve con esta precedencia: `MODEL_STRUCTURER` → `BEDROCK_MODEL_ID`. `MODEL_NAME` se usa para OpenAI-compatible. Si `MODEL_PROVIDER=bedrock`, es obligatorio definir `BEDROCK_MODEL_ID` o `MODEL_STRUCTURER`.

Requisitos en AWS:

- El rol o usuario necesita permisos `bedrock:InvokeModel` y `bedrock:Converse` sobre el modelo/ARN configurado.
- El modelo debe estar habilitado en la región indicada.
- En Docker, pasa las credenciales por variables de entorno o usa una tarea con rol IAM (sin claves estáticas).

### Docker Compose con perfil AWS

El `docker-compose.yml` monta `${HOME}/.aws` en `/root/.aws` (solo lectura) y usa `AWS_PROFILE=infinipaper`:

```bash
aws configure --profile infinipaper
docker compose -f infinipaper-backend/docker-compose.yml up -d agents
```

Antes de arrancar, define `BEDROCK_MODEL_ID` en `infinipaper-backend/.env` (Compose lo interpola) o en `infinipaper-agents/.env` si ejecutas el servicio en el host. El servicio no arranca con `MODEL_PROVIDER=bedrock` sin un modelo configurado.

Ejemplos de `BEDROCK_MODEL_ID`:

```text
anthropic.claude-3-5-sonnet-20240620-v1:0
amazon.nova-pro-v1:0
openai.gpt-oss-120b-1:0
```

El ID debe existir en la región configurada. Por ejemplo, en `us-east-2` el ID válido es `openai.gpt-oss-120b-1:0`; `openai.gpt-oss-120b` devuelve `ValidationException: The provided model identifier is invalid`. Puedes consultar los IDs disponibles con:

```bash
aws bedrock list-foundation-models --region us-east-2 \
  --query "modelSummaries[?modelLifecycle.status=='ACTIVE'].modelId" \
  --output text
```

## Configuración

| Variable | Uso |
|---|---|
| `AGENT_SERVICE_TOKEN` | Token interno compartido con NestJS |
| `MODEL_PROVIDER` | `openai-compatible`, `bedrock` u `opencode-go` |
| `OPENCODE_API_KEY` | API key de OpenCode Go |
| `OPENCODE_BASE_URL` | Endpoint OpenAI-compatible de OpenCode Go |
| `OPENCODE_MODEL` | Modelo de OpenCode Go sin prefijo |
| `AGENT_OPENCODE_SESSION_ID` | Valor de `x-opencode-session` |
| `MODEL_NAME` | Modelo por defecto para OpenAI-compatible o Bedrock |
| `MODEL_BASE_URL` | Endpoint OpenAI-compatible |
| `MODEL_API_KEY` | Clave del proveedor OpenAI-compatible |
| `MODEL_STRUCTURER` | Modelo específico del nodo estructurador |
| `BEDROCK_MODEL_ID` | ID/ARN del modelo en Bedrock |
| `AWS_REGION` | Región de Bedrock |
| `AWS_PROFILE` | Perfil de credenciales local |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` | Credenciales explícitas opcionales |
| `AGENT_MAX_INPUT_CHARS` | Límite de entrada v1 |
| `AGENT_MAX_OUTPUT_TOKENS` | Límite de salida (por defecto `24000`) |
| `AGENT_TIMEOUT_SECONDS` | Timeout del proveedor (por defecto `300`) |
| `AGENT_MAX_RETRIES` | Reintentos del nodo `repair` |
| `AGENT_PROMPT_VERSION` | Versión de prompt registrada en el job |
| `OTEL_ENABLED` | Reservado para instrumentación OTel |
