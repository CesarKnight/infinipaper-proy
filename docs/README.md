# Infinipaper
## Guías de ejecución

Índice rápido:

- [Ejecución completa con Docker](#ejecución-completa-con-docker) — un comando levanta db, minio, whisper, backend y frontend.
- [Guía de desarrollo](#guía-de-desarrollo) — entorno, estructura, scripts y convenciones.
- [Backend y frontend en modo dev](#backend-y-frontend-en-modo-dev-hot-reload) — infraestructura en Docker y app en el host con *hot reload*.

### Ejecución completa con Docker

Levanta **todos** los servicios (base de datos, MinIO, Whisper, backend y frontend) en contenedores.

**Requisitos**

- Docker Engine 24+ con Docker Compose v2 (`docker compose`).
- Acceso a Docker Hub para descargar `postgres:17-alpine`, `firstfinger/minio` y `fedirz/faster-whisper-server`.
- ~4 GB de RAM libres. La primera vez, Whisper descarga el modelo ASR (~500 MB–1 GB).

**Pasos**

```bash
cd infinipaper-backend
cp .env.example .env        # ajusta valores si lo necesitas
docker compose build
docker compose up -d
docker compose ps
```

**Servicios y puertos**

| URL | Servicio |
|---|---|
| http://localhost:3000 | Frontend (Next.js) |
| http://localhost:3001 | API NestJS · Swagger en `/api/v1/docs` · health en `/api/v1/health` |
| `localhost:5433` | PostgreSQL |
| http://localhost:9000 | MinIO (API S3) |
| http://localhost:9001 | MinIO consola |
| http://localhost:9002 | MinIO Admin Console |
| http://localhost:8000 | Whisper (ASR) |

**Qué ocurre al arrancar**

- `backend` espera a que `db` esté *healthy* y aplica migraciones (`npx prisma migrate deploy`) antes de escuchar.
- El bucket S3 (`S3_BUCKET`) se crea automáticamente; si MinIO no está listo, solo se registra una advertencia.
- `frontend` espera a `backend`; recibe `API_URL=http://backend:3000` como *build arg* para reescribir `/api/*`.
- **No hay seed**: el primer usuario se crea desde http://localhost:3000/register.

**Configuración**

Se lee desde `infinipaper-backend/.env` (mismo archivo que usa Compose). Claves habituales: `POSTGRES_*`, `S3_*`, `MINIO_IMAGE_TAG` (usa `latest-arm64` en equipos ARM), `MAX_UPLOAD_SIZE_MB`, `WHISPER_MODEL`, `ASR_*`, `AVISO_FILENAME`. Los puertos de host se pueden cambiar con `BACKEND_PORT`, `FRONTEND_PORT`, `POSTGRES_PORT`, `MINIO_*`.

**Comandos útiles**

```bash
docker compose logs -f backend        # logs en vivo
docker compose logs -f frontend
docker compose restart backend
docker compose up -d --build backend  # reconstruir un solo servicio
docker compose down                   # detener (conserva volúmenes)
docker compose down -v                # detener y borrar datos (DB, MinIO, Whisper)
```

> La imagen compila el código, así que **cambios de código requieren rebuild**. Para iterar rápido sin rebuilds usa el [modo dev](#backend-y-frontend-en-modo-dev-hot-reload).

**Solución de problemas**

- **Puerto ocupado:** cambia `POSTGRES_PORT`, `MINIO_*`, `BACKEND_PORT` o `FRONTEND_PORT` en `.env`.
- **Sin acceso a Docker Hub:** no se podrán descargar las imágenes; usa el modo dev sólo si ya tienes las imágenes locales.
- **Whisper lento al inicio:** está descargando el modelo; espera a que el contenedor quede *healthy*.
- **El backend no ve MinIO:** dentro de Compose el endpoint debe ser `S3_ENDPOINT=http://minio:9000`.

### Guía de desarrollo

Entorno local para desarrollar; la infraestructura puede ir en Docker (ver siguiente guía).

**Requisitos**

- Node.js 22+ y npm 10+ (el proyecto se desarrolla con Node 26).
- Docker (solo para `db`, `minio` y `whisper`).

**Estructura**

```
infinipaper-proy/
├── docs/                  # especificaciones y guías
├── infinipaper-backend/   # NestJS + Prisma 7 (API)
│   ├── prisma/            # schema y migraciones
│   └── src/modules/       # auth, users, projects, folders, resources, ...
└── infinipaper-frontend/  # Next.js 16 (App Router)
    ├── app/               # rutas
    ├── components/        # UI (shadcn/Base UI) + dominio
    └── lib/               # cliente API, hooks, tipos
```

**Instalación**

```bash
cd infinipaper-backend   && npm install
cd ../infinipaper-frontend && npm install
```

**Variables de entorno**

```bash
cd infinipaper-backend   && cp .env.example .env
cd ../infinipaper-frontend && cp .env.example .env
```

- Backend: `DATABASE_URL`, `S3_*`, `ASR_URL`, `PORT`.
- Frontend: `API_URL` (destino de los rewrites de `/api/*`).

**Scripts del backend** (`infinipaper-backend/`)

```bash
npm run start:dev     # Nest en watch
npm run build         # compilar a dist/
npm run start:prod    # ejecutar el build
npm run lint          # oxlint
npm test              # tests unitarios (vitest)
npm run test:e2e      # tests e2e
npm run test:cov      # cobertura

npx prisma migrate dev      # crear/aplicar migraciones en desarrollo
npx prisma migrate deploy   # aplicar migraciones existentes
npx prisma generate         # regenerar el cliente Prisma
npx prisma studio           # explorador visual de la base de datos
```

**Scripts del frontend** (`infinipaper-frontend/`)

```bash
npm run dev     # Next en modo desarrollo
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # eslint
```

**Convenciones**

- API con prefijo `/api/v1`; errores uniformes `{ statusCode, code, message, details }`.
- Auth por cookie `httpOnly` + tabla `Session` en BD. El navegador llama a `/api/*` *same-origin* y Next reenvía al backend.
- Paginación por cursor: `?cursor=<id>&limit=20`.
- Roles de proyecto: **Owner** (implícito en `Project.owner`) / **Editor** / **Viewer**.

**Calidad antes de subir cambios**

```bash
cd infinipaper-backend    && npm run lint && npm test && npm run build
cd ../infinipaper-frontend && npm run lint && npm run build
```

### Backend y frontend en modo dev (hot reload)

Objetivo: correr `db`, `minio` y `whisper` en Docker (infraestructura) y **el backend + frontend directamente en el host**, con recarga en caliente y sin reconstruir imágenes.

**1. Levanta solo la infraestructura**

```bash
cd infinipaper-backend
cp .env.example .env        # si aún no existe
docker compose up -d db minio whisper
docker compose ps
```

**2. Backend en el host (`:3001`)**

```bash
cd infinipaper-backend
npm install
```

En `.env`, para el host:

```dotenv
PORT=3001
DATABASE_URL=postgresql://infinipaper:infinipaper@localhost:5433/infinipaper?schema=public
S3_ENDPOINT=http://localhost:9000
ASR_URL=http://localhost:8000
```

```bash
npx prisma generate
npx prisma migrate deploy      # o `npx prisma migrate dev` si cambias el schema
npm run start:dev
```

Comprueba: `curl http://localhost:3001/api/v1/health`.

**3. Frontend en el host (`:3000`)**

```bash
cd infinipaper-frontend
npm install
```

En `.env`:

```dotenv
API_URL=http://localhost:3001
```

```bash
npm run dev
```

Abre http://localhost:3000 y regístrate (no hay seed). El navegador pide `/api/v1/*` al propio frontend y Next reenvía a `http://localhost:3001`; la cookie de sesión queda *first-party*.

**Notas**

- **No hace falta CORS:** gracias a los rewrites todo es *same-origin*.
- MinIO debe estar arriba y accesible en `S3_ENDPOINT=http://localhost:9000` para subir/ver archivos.
- Las transcripciones usan `ASR_URL=http://localhost:8000` (contenedor Whisper).
- Si 3000/3001 están ocupados, cambia `PORT` y arranca Next en otro puerto (`npm run dev -- -p 3002`), actualizando `API_URL` en consecuencia.
- Inspección de la BD: `npx prisma studio` o `psql postgresql://infinipaper:infinipaper@localhost:5433/infinipaper`.



## Especificaciones - Índice

| Documento | Contenido |
|---|---|
| [infraestructura.md](./infraestructura.md) | Servicios, docker-compose, variables de entorno, CORS, auth y almacenamiento |
| [librerias.md](./librerias.md) | Dependencias de frontend y backend, con propósito |
| [modelo-datos.md](./modelo-datos.md) | Esquema Prisma completo |
| [hu/HU01-usuarios.md](./hu/HU01-usuarios.md) | Gestión de usuarios |
| [hu/HU02-proyectos.md](./hu/HU02-proyectos.md) | Gestión de proyectos |
| [hu/HU03-carpetas.md](./hu/HU03-carpetas.md) | Gestión de carpetas |
| [hu/HU04-aviso.md](./hu/HU04-aviso.md) | Aviso en listado de carpeta |
| [hu/HU05-archivos.md](./hu/HU05-archivos.md) | Gestión de archivos |
| [hu/HU06-visualizacion.md](./hu/HU06-visualizacion.md) | Visualización multimedia |
| [hu/HU07-participantes.md](./hu/HU07-participantes.md) | Gestión de participantes |
| [hu/HU08-permisos.md](./hu/HU08-permisos.md) | Gestión de permisos |
| [hu/HU09-apuntes.md](./hu/HU09-apuntes.md) | Gestión de apuntes |
| [hu/HU10-transcripcion.md](./hu/HU10-transcripcion.md) | Transcripción de audio |
| [hu/HU11-dashboard.md](./hu/HU11-dashboard.md) | Dashboard personal |
| [Guías de ejecución](#guías-de-ejecución) | Docker completo, desarrollo local y backend/frontend en modo dev |


## Decisiones cerradas

| Área | Decisión |
|---|---|
| Base de datos | PostgreSQL 17 |
| ORM | Prisma |
| Auth | Cookie `httpOnly` + sesión server-side (token opaco hasheado en DB). Login por email **o** username |
| Roles de plataforma | Ninguno (todos los usuarios son iguales) |
| Roles de proyecto | **Owner** (implícito en `Project.owner`) / **Editor** / **Viewer** |
| Almacenamiento de archivos | MinIO (S3), subida **proxy por el backend** |
| Límite de subida | **50 MB** por archivo, configurable por env var `MAX_UPLOAD_SIZE_MB` |
| Aviso (HU4) | Archivo real `aviso.md` **visible** en el listado; nombre configurable por `AVISO_FILENAME` |
| Apuntes (HU9) | Archivos `.md`; edición mono-usuario; **autoguardado** (*debounce* 1–2 s, last-write-wins); sin historial de versiones |
| Colaboración en tiempo real | Fuera de alcance |
| Carpetas (HU3) | Borrado en **cascada** (con confirmación fuerte) |
| Proyectos públicos | Visibles **para usuarios anónimos** |
| Permisos / participantes | Gestión **solo Owner**; sin cambio de propietario en v1 |
| Transcripción (HU10) | Whisper autoalojado; **job en background**; notificación por **polling** |
| API | Prefijo `/api/v1`, errores uniformes, paginación por cursor |
| Peticiones del navegador | **Same-origin** vía rewrites de Next (`/api/*` → backend); la cookie es *first-party* |

## Matriz de permisos

| Acción | Viewer | Editor | Owner |
|---|:---:|:---:|:---:|
| Ver proyecto, carpetas, archivos y apuntes | ✅ | ✅ | ✅ |
| Crear / editar / eliminar carpetas y archivos | ❌ | ✅ | ✅ |
| Crear / editar / eliminar aviso y apuntes | ❌ | ✅ | ✅ |
| Ejecutar transcripciones (HU10) | ❌ | ✅ | ✅ |
| Gestionar participantes | ❌ | ❌ | ✅ |
| Asignar / modificar permisos | ❌ | ❌ | ✅ |
| Editar / eliminar el proyecto | ❌ | ❌ | ✅ |

> Un proyecto **público** es visible en modo lectura para cualquier usuario (incluso anónimo). El resto de acciones sigue requiriendo rol dentro del proyecto.

## Convenciones de API

- Prefijo: `/api/v1`
- Autenticación: cookie de sesión `httpOnly` (same-origin). El backend no usa `Authorization: Bearer`.
- Formato de error uniforme:

```json
{
  "statusCode": 409,
  "code": "USER_EMAIL_TAKEN",
  "message": "El correo ya está registrado",
  "details": null
}
```

- Paginación por cursor: `?cursor=<id>&limit=20`. Respuesta: `{ "items": [...], "nextCursor": "..." }`.
- Fechas en ISO 8601 (UTC).

## Roadmap

| Fase | Entregable | HUs |
|---|---|---|
| 0 | Fundaciones: Prisma, config, `/health`, manejo de errores, AuthModule + guards; frontend: cliente API, layouts, rutas protegidas | base |
| 1 | Usuarios y proyectos | HU1, HU2 |
| 2 | Carpetas, archivos y visores | HU3, HU5, HU6 |
| 3 | Aviso y apuntes Markdown | HU4, HU9 |
| 4 | Participantes y permisos | HU7, HU8 |
| 5 | Transcripción ASR | HU10 |
| 6 | Dashboard personal | HU11 |

> Los guards y la resolución de permisos se implementan en la **Fase 0** aunque los participantes lleguen en la Fase 4.

## Estado de implementación

**Backend (NestJS):** implementado y compilando.
- Fundaciones: Prisma 7 (`prisma-client` + `@prisma/adapter-pg`), `ConfigModule` con validación Joi, manejo de errores uniforme, `AuthGuard` global, `ProjectAccessGuard` + `@RequireProjectRole`, StorageService (S3), `pg-boss`, Swagger en `/api/v1/docs`.
- HU1 usuarios · HU2 proyectos · HU3 carpetas · HU4 aviso · HU5 archivos · HU6 visor (contenido con *range*) · HU7 participantes · HU8 permisos · HU9 apuntes · HU10 transcripción (cola + worker ASR) · HU11 dashboard (`/dashboard` como ruta raíz `/`).
- Endpoint `GET /api/v1/dashboard` y filtro `?scope=owned|participating|public|all` en `GET /api/v1/projects`.
- El contenedor aplica migraciones al arrancar (`npx prisma migrate deploy`).

**Frontend (Next.js):** implementado y compilando, lint limpio.
- Cliente API same-origin (`lib/api.ts`) + rewrites, React Query, `proxy.ts` para rutas protegidas.
- Páginas: login, registro, proyectos (lista/crear), workspace (árbol de carpetas, aviso, archivos, apuntes), configuración (edición, participantes/permisos, eliminación), visor de archivos (imagen/PDF/audio/video/Markdown + transcripción), usuarios (búsqueda y perfil público), perfil propio.
- Visor PDF con el visor nativo del navegador (`<iframe>` al contenido proxeado).

**Verificado en este entorno:**
- `npm run build`, `npm run lint` y `npm test` (backend) y `npm run build`/`npm run lint` (frontend).
- Flujo end-to-end a través del proxy same-origin: registro/login con cookie `httpOnly` first-party, sesión, proyectos, carpetas, participantes y permisos.

**No verificable en el sandbox de desarrollo:**
- MinIO y Whisper no pudieron levantarse aquí (no hay acceso a Docker Hub). Por eso HU4/HU5/HU6/HU9/HU10 (subida de archivos, avisos, apuntes y transcripción) están implementadas pero no probadas de extremo a extremo. En una máquina con acceso a Docker Hub, `docker compose up -d --build` levanta `minio` y `whisper`.
- Imágenes relativas dentro de avisos/apuntes aún no se resuelven a otros archivos de la carpeta (limitación conocida de v1).