# Infinipaper · Especificaciones

App de gestión y generación de material de estudio en base a material comunitario.

- **Frontend:** Next.js 16 + React 19 + shadcn/ui (Base UI) + Tailwind v4
- **Backend:** NestJS 12 (ESM) + Prisma + PostgreSQL 17
- **Almacenamiento:** MinIO (S3 compatible)
- **Transcripción:** Whisper autoalojado (job en background + polling)

## Índice

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

