# Decisiones cerradas

> Decisiones de arquitectura y producto que aplican a todo el proyecto. Cada una enlaza a la spec donde se detalla su comportamiento.

| Área | Decisión | Spec |
|---|---|---|
| Base de datos | PostgreSQL 17 | — |
| ORM | Prisma 7 con `prisma-client` y `@prisma/adapter-pg` | — |
| Autenticación | Cookie `httpOnly` + sesión server-side; token opaco hasheado en base de datos; login por email o username | [001](../specs/001-usuarios/spec.md) |
| Roles de plataforma | Ninguno; todos los usuarios son iguales | [001](../specs/001-usuarios/spec.md) |
| Roles de proyecto | Owner implícito en `Project.ownerId`; Editor y Viewer en `ProjectMember` | [008](../specs/008-permisos/spec.md) |
| Proyectos públicos | Visibles en solo lectura para cualquier usuario, incluso anónimo | [002](../specs/002-proyectos/spec.md) |
| Carpetas | Jerarquía por `parentId`; borrado en cascada con confirmación fuerte | [003](../specs/003-carpetas/spec.md) |
| Aviso | Archivo real `aviso.md` visible en el listado; nombre configurable por `AVISO_FILENAME` | [004](../specs/004-aviso/spec.md) |
| Almacenamiento | MinIO (S3); subida proxeada por el backend; URL resuelta por el backend | [005](../specs/005-archivos/spec.md) |
| Límite de subida | 50 MB por archivo, configurable con `MAX_UPLOAD_SIZE_MB` | [005](../specs/005-archivos/spec.md) |
| Visor de PDF | Visor nativo del navegador mediante `<iframe>` al contenido proxeado | [006](../specs/006-visualizacion/spec.md) |
| Participantes | Gestión solo por el Owner; sin cambio de propietario en v1 | [007](../specs/007-participantes/spec.md) |
| Permisos | A nivel de proyecto; el servidor es la única fuente de verdad | [008](../specs/008-permisos/spec.md) |
| Apuntes | Archivos `.md`; edición mono-usuario; autoguardado con *debounce*; *last-write-wins*; sin historial de versiones | [009](../specs/009-apuntes/spec.md) |
| Colaboración en tiempo real | Fuera de alcance en v1 | — |
| Transcripción | Whisper autoalojado; job en background; notificación por polling | [010](../specs/010-transcripcion/spec.md) |
| Dashboard | Es la vista inicial en `/`; `/projects` es el listado completo con filtro `scope` | [011](../specs/011-dashboard/spec.md) |
| Agentes IA | LangGraph orquesta el grafo; router determinista por tipo de fuente; v1 solo Markdown | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| Servicio de agentes | FastAPI stateless; no accede a la base ni a S3; usa URLs presignadas | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| Jobs de IA | NestJS + pg-boss conservan el estado; sin checkpointer en v1 | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| Resultado IA | Se crea un apunte nuevo; el original no se modifica | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| Observabilidad IA | Logs estructurados + OTel opcional; sin SaaS obligatorio | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| Modelo LLM | Proveedor OpenAI-compatible configurable por entorno y por nodo | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| Proveedor LLM | Soporta AWS Bedrock (`langchain-aws`) y endpoints OpenAI-compatible | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| OpenCode Go | Proveedor OpenAI-compatible con `x-opencode-session`; modelo configurable | [012](../specs/012-estructuracion-apuntes-ia/spec.md) |
| Peticiones del navegador | Same-origin mediante rewrites de Next (`/api/*` → `API_URL`); cookie *first-party* | [referencia/api.md](./api.md) |
| API | Prefijo `/api/v1`, errores uniformes, paginación por cursor | [referencia/api.md](./api.md) |
