# Infraestructura

## 1. Servicios (`docker-compose.yml`)

| Servicio | Imagen | Puerto host | Propósito |
|---|---|---|---|
| `db` | `postgres:17-alpine` | 5433 | Base de datos |
| `backend` | build NestJS | 3001 | API |
| `frontend` | build Next.js | 3000 | App web |
| `minio` | `firstfinger/minio` | 9000 / 9001 / 9002 | Almacenamiento S3 + consola + Admin Console |
| `whisper` | `fedirz/faster-whisper-server` | 8000 | Servicio ASR (API compatible OpenAI) |

Dependencias: `backend` espera a `db` y `minio`; `frontend` espera a `backend`.

> **MinIO:** se usa la imagen [`firstfinger/minio`](https://hub.docker.com/r/firstfinger/minio) (servidor + Admin Console + `mc`), seleccionando `latest-amd64` o `latest-arm64` con `MINIO_IMAGE_TAG`. El bucket lo crea automáticamente el backend (`StorageService.ensureBucket`) al arrancar, por lo que no se necesita un contenedor `mc` aparte.

## 2. Mitigación del cross-origin

**Problema:** con la API en `:3001` y la app en `:3000`, la cookie de sesión sería *cross-site*; `SameSite=Lax` no se envía y `SameSite=None` exige HTTPS.

**Solución:** el navegador siempre llama a rutas relativas `/api/*` en su mismo origen; Next.js reenvía server-side al backend mediante `rewrites`. La cookie es *first-party*.

`infinipaper-frontend/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const api = process.env.API_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
```

- `API_URL` se hornea en build time (ARG/ENV en el stage builder del Dockerfile) y en runtime apunta a `http://backend:3000`.
- En desarrollo, `API_URL=http://localhost:3001` (valor por defecto).
- El fetch del cliente usa rutas relativas (`/api/v1/...`) con `credentials: "include"`.
- **No** se usa `NEXT_PUBLIC_API_URL` para llamadas de API.

**Cookie de sesión** (emitida por el backend):

```
Set-Cookie: session=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800; Secure (solo producción)
```

**CORS** se mantiene solo para clientes directos (Postman/Swagger):

```ts
app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
```

**Archivos multimedia:** se sirven por `GET /api/v1/files/:id/content` (proxy con *range requests*), así MinIO nunca se expone al navegador ni genera otro origen.

## 3. Variables de entorno

### Backend (`infinipaper-backend/.env.example`)

```dotenv
# Base de datos
DATABASE_URL=postgresql://infinipaper:infinipaper@db:5432/infinipaper

# Sesión
SESSION_TTL_DAYS=7                    # duración de la sesión
SESSION_COOKIE_NAME=session
COOKIE_SECURE=false                   # true en producción (HTTPS)

# CORS / origen
FRONTEND_URL=http://localhost:3000

# Almacenamiento S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=infinipaper
S3_SECRET_KEY=infinipaper
S3_BUCKET=infinipaper
S3_FORCE_PATH_STYLE=true
# Imagen de MinIO (firstfinger/minio) y puertos host
MINIO_IMAGE_TAG=latest-amd64
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ADMIN_CONSOLE_PORT=9002

# Subida
MAX_UPLOAD_SIZE_MB=50                 # límite por archivo (única fuente de verdad)

# Transcripción (ASR)
ASR_URL=http://localhost:8000
ASR_API_KEY=                          # vacío si el servicio es local
ASR_DEFAULT_LANGUAGE=es
ASR_MAX_DURATION_MINUTES=120

# Reglas de negocio
AVISO_FILENAME=aviso.md
```

### Frontend (`infinipaper-frontend/.env.example`)

```dotenv
# Backend reachable por el servidor de Next (rewrites). En dev:
API_URL=http://localhost:3001
# Límite solo para pre-chequeo visual en el cliente (fuente de verdad: backend)
NEXT_PUBLIC_MAX_UPLOAD_MB=50
```

### Compose — build args del frontend

```yaml
      args:
        API_URL: http://backend:3000
```

## 4. Config centralizada del límite de subida

Una **única variable** gobierna el límite: `MAX_UPLOAD_SIZE_MB`.

- Backend: `ConfigService.maxUploadSizeBytes` → usado por Multer y por la validación de DTO.
- Endpoint `GET /api/v1/config` expone `{ maxUploadSizeMb }` para que el frontend valide antes de subir.
- Frontend: `NEXT_PUBLIC_MAX_UPLOAD_MB` es solo una pista de UI.

## 5. Almacenamiento de objetos

- Estructura de claves: `projects/{projectId}/folders/{folderId}/{resourceId}/{filename}`.
- Los objetos se escriben/leen con `@aws-sdk/client-s3` con `forcePathStyle: true` (requerido por MinIO).
- La URL nunca se persiste: se sirve a través del backend (`/files/:id/content`).
- Al borrar un `Resource` (o en cascada), se elimina también el objeto en S3.
- El bucket (`S3_BUCKET`) se crea automáticamente al arrancar el backend (`StorageService.ensureBucket`); si MinIO no está disponible, solo se registra una advertencia y la app sigue levantando.

## 6. Cola de trabajos (transcripción)

- **Cola:** `pg-boss` respaldada por PostgreSQL (evita sumar Redis).
- Backend encola el trabajo, un worker lo procesa y actualiza `TranscriptionJob`.
- Flujo ASR: descargar audio desde S3 → `POST {ASR_URL}/v1/audio/transcriptions` (multipart) → guardar `text`.
- El frontend consulta el estado por **polling** (`GET /api/v1/transcriptions/:id`).
- Errores transitorios con reintentos configurables (p. ej. 3 intentos con backoff).

## 7. Auth y sesiones

- Contraseñas con `argon2`.
- Token de sesión = 32 bytes aleatorios; se guarda **solo su hash SHA-256** en `Session.tokenHash`.
- Guard global `AuthGuard`: lee la cookie, valida vigencia y adjunta `request.user`.
- Guard `ProjectAccessGuard`: resuelve el rol efectivo (Owner/Editor/Viewer) y el modo público anónimo.
- Decorador `@RequireProjectRole('editor' | 'viewer')` para declarar requisitos por endpoint.

## 8. Health

- `GET /api/v1/health` verifica DB, MinIO y cola. Reemplaza el `GET /` del scaffold para el healthcheck de compose.

## 9. Migraciones y seed

- `prisma migrate dev` en desarrollo, `prisma migrate deploy` en el contenedor.
- Seed inicial: usuario de prueba y un proyecto público de ejemplo (opcional).
