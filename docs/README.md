# Infinipaper

> **Proceso de desarrollo:** este proyecto usa **SDD ligero** (Spec-Driven Development). Antes de implementar un cambio, consulta el [proceso SDD](./sdd/README.md) y la [constitución](./sdd/constitucion.md).

## Desarrollo guiado por especificaciones (SDD)

La especificación es la fuente de verdad del **qué** y el **por qué**; el plan describe el **cómo**; las tareas describen los pasos verificables. El código se implementa después.

```
spec.md  →  plan.md  →  tasks.md  →  implementación  →  verificación  →  spec actualizada
```

- **Constitución:** principios no negociables y puertas de calidad → [`sdd/constitucion.md`](./sdd/constitucion.md).
- **Proceso:** flujo, estados, nomenclatura y checklists → [`sdd/README.md`](./sdd/README.md).
- **Plantillas:** `spec.md`, `plan.md` y `tasks.md` → [`sdd/plantillas/`](./sdd/plantillas/).
- **Specs vigentes:** 11 specs que cubren todo el producto → [`sdd/specs/README.md`](./sdd/specs/README.md).
- **Referencia transversal:** infraestructura, librerías, modelo de datos, decisiones y API → [`sdd/referencia/README.md`](./sdd/referencia/README.md).
- **Diagramas:** casos de uso, clases, paquetes, C4 y una secuencia por spec → [`sdd/diagramas/README.md`](./sdd/diagramas/README.md).
- **Scaffold:** `./docs/sdd/nueva-spec.sh <slug>` crea una spec nueva con las tres plantillas.

Cada cambio de producto debe tener una spec con requisitos `RF-*`/`RNF-*` y criterios `CA-*`, un plan con decisiones y rollback, y tareas trazables. Los cambios triviales (typos, formato) están exentos; los hotfix deben registrar una spec retroactiva.

`docs/sdd/specs/` es la única fuente vigente del comportamiento. No hay documentación de producto duplicada fuera de SDD.

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



## Especificaciones

| ID | Spec | Estado |
|---|---|---|
| `001` | [Usuarios, autenticación y sesiones](./sdd/specs/001-usuarios/spec.md) | Implementada con brechas |
| `002` | [Proyectos](./sdd/specs/002-proyectos/spec.md) | Implementada con brechas |
| `003` | [Carpetas](./sdd/specs/003-carpetas/spec.md) | Implementada con brechas |
| `004` | [Aviso en el listado de carpeta](./sdd/specs/004-aviso/spec.md) | Implementada con brechas |
| `005` | [Gestión de archivos](./sdd/specs/005-archivos/spec.md) | Implementada con brechas |
| `006` | [Visualización multimedia](./sdd/specs/006-visualizacion/spec.md) | Implementada con brechas |
| `007` | [Participantes](./sdd/specs/007-participantes/spec.md) | Implementada con brechas |
| `008` | [Permisos y roles de proyecto](./sdd/specs/008-permisos/spec.md) | Implementada con brechas |
| `009` | [Apuntes Markdown con editor WYSIWYG y autoguardado](./sdd/specs/009-apuntes/spec.md) | Implementada con brechas |
| `010` | [Transcripción de audio](./sdd/specs/010-transcripcion/spec.md) | Implementada con brechas |
| `011` | [Dashboard personal](./sdd/specs/011-dashboard/spec.md) | Implementada con brechas |

## Referencia transversal

| Documento | Contenido |
|---|---|
| [`sdd/README.md`](./sdd/README.md) | Proceso SDD: flujo, estados, nomenclatura y checklists |
| [`sdd/constitucion.md`](./sdd/constitucion.md) | Principios no negociables y puertas de calidad |
| [`sdd/plantillas/`](./sdd/plantillas/) | Plantillas de `spec.md`, `plan.md` y `tasks.md` |
| [`sdd/referencia/infraestructura.md`](./sdd/referencia/infraestructura.md) | Servicios, Docker Compose, rewrites, variables de entorno, S3, cola y auth |
| [`sdd/referencia/librerias.md`](./sdd/referencia/librerias.md) | Dependencias de backend y frontend |
| [`sdd/referencia/modelo-datos.md`](./sdd/referencia/modelo-datos.md) | Esquema Prisma vigente y notas de diseño |
| [`sdd/referencia/decisiones.md`](./sdd/referencia/decisiones.md) | Decisiones cerradas de arquitectura y producto |
| [`sdd/referencia/api.md`](./sdd/referencia/api.md) | Convenciones de API, errores y paginación |
| [`sdd/diagramas/README.md`](./sdd/diagramas/README.md) | Casos de uso, clases, paquetes, C4 y secuencias por spec |
| [`sdd/ea/README.md`](./sdd/ea/README.md) | Modelo formal y script de importación para Enterprise Architect |

## Estado del proyecto

Las 11 specs están implementadas y el proyecto compila y pasa lint. Cada spec registra sus brechas funcionales en `G-*`; la deuda transversal principal es la ausencia de tests automatizados específicos, que se irá cerrando con nuevas tareas.

**Verificado en este entorno:**

- Backend: `npm run build`, `npm run lint` y `npm test`.
- Frontend: `npm run build` y `npm run lint`.
- Flujo end-to-end a través del proxy same-origin: registro/login con cookie `httpOnly` first-party, sesión, proyectos, carpetas, participantes, permisos y dashboard.

**Limitaciones conocidas:**

- MinIO y Whisper requieren Docker; en entornos sin acceso a las imágenes no se pueden probar subidas ni transcripciones de extremo a extremo.
- Las brechas `G-*` de cada spec están documentadas y priorizadas, no ocultas.
