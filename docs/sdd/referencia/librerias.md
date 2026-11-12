# Librerías

## Backend (`infinipaper-backend`)

El proyecto usa ESM (`"type": "module"`), NestJS 12, Vitest, oxlint y Prettier.

### Dependencias de producción

| Librería | Propósito |
|---|---|
| `@prisma/client` | Cliente de base de datos tipado |
| `@prisma/adapter-pg` | Adaptador de Prisma para PostgreSQL |
| `@nestjs/config` | Carga y validación de variables de entorno |
| `joi` | Validación del esquema de entorno al arrancar |
| `@node-rs/argon2` | Hash de contraseñas (spec 001) |
| `pg` | Driver PostgreSQL usado por Prisma |
| `prisma` | CLI de migraciones y generación (incluido para el contenedor) |
| `cookie-parser` | Lectura de la cookie de sesión |
| `helmet` | Cabeceras de seguridad |
| `@nestjs/throttler` | Rate limiting en login y endpoints sensibles |
| `class-validator` y `class-transformer` | Validación y transformación de DTOs |
| `@nestjs/mapped-types` | `PartialType`/`PickType` para DTOs de edición |
| `@aws-sdk/client-s3` | Cliente S3 para MinIO (spec 005) |
| `@aws-sdk/s3-request-presigner` | URLs firmadas internas si se requieren |
| `pg-boss` | Cola de trabajos respaldada por PostgreSQL (spec 010) |
| `@nestjs/swagger` | Documentación OpenAPI |
| `mime-types` | Inferencia y validación de tipo por extensión (spec 005) |

> El cliente HTTP hacia el servicio ASR usa `fetch` nativo de Node, sin dependencias extra.

### Dependencias de desarrollo

| Librería | Propósito |
|---|---|
| `@nestjs/cli` | Build y generación de módulos |
| `vitest`, `@nestjs/testing`, `supertest` | Pruebas unitarias y e2e |
| `@vitest/coverage-v8` | Cobertura |

Linter/formato: `oxlint`, `oxlint-tsgolint`, `prettier`.

## Frontend (`infinipaper-frontend`)

Usa Next.js 16, React 19, shadcn/ui sobre Base UI, Tailwind v4, `lucide-react`, `sonner`, `next-themes` y `cmdk`.

### Dependencias de producción

| Librería | Propósito |
|---|---|
| `@tanstack/react-query` | Estado servidor, caché y polling (spec 010) |
| `embla-carousel-react` | Carrusel del dashboard (spec 011) |
| `react-hook-form` | Manejo de formularios (specs 001, 002, 004, 009) |
| `zod` | Validación de esquemas en cliente |
| `@hookform/resolvers` | Integración zod + react-hook-form |
| `react-markdown` | Render de Markdown (specs 004, 009) |
| `remark-gfm` | Tablas, listas de tareas y GFM (spec 004) |
| `rehype-sanitize` | Sanitización anti-XSS del Markdown (specs 004, 009) |
| `@mdxeditor/editor` | Editor Markdown WYSIWYG para avisos y apuntes (specs 004, 009); carga diferida con `ssr: false` |
| `react-dropzone` | Disponible para arrastrar y soltar (spec 005); v1 usa `<input type="file">` |
| `date-fns` | Formato de fechas |
| `diff` | Diff de líneas para el preview de estructuración IA (spec 012) |

> **PDF (spec 006):** se usa el visor nativo del navegador mediante `<iframe src="/api/v1/files/:id/content">`, que evita configurar un worker de PDF.js y mantiene el proxy same-origin.

> El editor Markdown es **MDXEditor**, envuelto en `components/markdown/markdown-editor.tsx` con `next/dynamic` (`ssr: false`). La vista de solo lectura usa `react-markdown` + `rehype-sanitize`; el editor produce/consume Markdown y guarda con autoguardado (*debounce*).

### Componentes shadcn disponibles

`button`, `input`, `textarea`, `label`, `select`, `checkbox`, `switch`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `command`, `tabs`, `breadcrumb`, `table`, `avatar`, `badge`, `card`, `alert`, `progress`, `skeleton`, `empty`, `tooltip`, `sonner`, `separator`, `accordion`, `input-group`, `carousel`.

## Servicio de agentes (`infinipaper-agents`)

Python 3.12+ con `uv`.

| Librería | Propósito |
|---|---|
| `fastapi` | API HTTP interna |
| `uvicorn[standard]` | Servidor ASGI |
| `httpx` | Descarga de URLs presignadas |
| `pydantic` / `pydantic-settings` | Schemas y configuración |
| `langgraph` | Grafo de agentes |
| `langchain-core` | Mensajes, modelos y utilidades |
| `langchain-openai` | Cliente OpenAI-compatible configurable |
| `langchain-aws` / `boto3` | Cliente AWS Bedrock y cadena de credenciales AWS |
| `pytest` / `pytest-asyncio` | Tests |
| `ruff` | Lint y formato |
| `pyright` | Tipado estático |

## Comandos útiles

```bash
# Backend
cd infinipaper-backend
npm run start:dev
npx prisma migrate dev
npx prisma studio

# Frontend
cd infinipaper-frontend
npm run dev

# Stack completo
cd infinipaper-backend
docker compose up -d --build
```
