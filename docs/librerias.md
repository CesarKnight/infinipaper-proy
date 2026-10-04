# Librerías

## Backend (`infinipaper-backend`)

El proyecto ya usa ESM (`"type": "module"`), NestJS 12, Vitest, oxlint y Prettier. Se añaden:

### Dependencias de producción

| Librería | Propósito |
|---|---|
| `@prisma/client` | Cliente de base de datos tipado (HU1–HU10) |
| `@nestjs/config` | Carga y validación de variables de entorno |
| `joi` | Validación del esquema de env al arrancar |
| `argon2` | Hash de contraseñas (HU1) |
| `cookie-parser` | Lectura de la cookie de sesión (Auth) |
| `helmet` | Cabeceras de seguridad |
| `@nestjs/throttler` | Rate limiting (login y endpoints sensibles) |
| `class-validator` y `class-transformer` | Validación y transformación de DTOs |
| `@nestjs/mapped-types` | `PartialType`/`PickType` para DTOs de edición |
| `@aws-sdk/client-s3` | Cliente S3 para MinIO (HU5) |
| `@aws-sdk/s3-request-presigner` | URLs firmadas internas si se requieren |
| `pg-boss` | Cola de trabajos respaldada por PostgreSQL (HU10) |
| `@nestjs/swagger` | Documentación OpenAPI (dev) |
| `mime-types` | Inferencia/validación de tipo por extensión (HU5) |

> El cliente HTTP hacia el servicio ASR usa `fetch` nativo (Node 24), sin dependencias extra.

### Dependencias de desarrollo

| Librería | Propósito |
|---|---|
| `prisma` | CLI de migraciones y generación |
| `@nestjs/cli` (ya presente) | Build y generación de módulos |
| `vitest`, `@nestjs/testing`, `supertest` (ya presentes) | Pruebas unitarias y e2e |
| `@vitest/coverage-v8` (ya presente) | Cobertura |

Linter/formato ya presentes: `oxlint`, `oxlint-tsgolint`, `prettier`.

## Frontend (`infinipaper-frontend`)

Ya usa Next.js 16, React 19, shadcn/ui sobre Base UI, Tailwind v4, `lucide-react`, `sonner`, `next-themes`, `cmdk`. Se añaden:

### Dependencias de producción

| Librería | Propósito |
|---|---|
| `@tanstack/react-query` | Estado servidor, caché y **polling** (HU10) |
| `react-hook-form` | Manejo de formularios (HU1, HU2, HU4, HU9) |
| `zod` | Validación de esquemas en cliente |
| `@hookform/resolvers` | Integración zod + react-hook-form |
| `react-markdown` | Render de Markdown (HU4, HU9) |
| `remark-gfm` | Tablas, listas de tareas, etc. (HU4) |
| `rehype-sanitize` | **Sanitización anti-XSS** del Markdown (HU4, HU9) |
| `@mdxeditor/editor` | **Editor Markdown robusto** (WYSIWYG) para avisos y apuntes (HU4, HU9). Carga diferida (`ssr: false`); su CSS se tematiza en `globals.css`. |
| `react-dropzone` | Disponible para arrastrar/soltar (HU5); v1 usa `<input type="file">` |
| `date-fns` | Formato de fechas |

> **PDF (HU6):** se usa el **visor nativo del navegador** mediante `<iframe src="/api/v1/files/:id/content">`, que evita configurar un worker de PDF.js y mantiene el proxy same-origin. `react-pdf` queda como alternativa futura si se necesita control fino de páginas.


> El editor Markdown es **MDXEditor** (WYSIWYG), envuelto en `components/markdown/markdown-editor.tsx` con `next/dynamic` (`ssr: false`). La vista de solo lectura sigue usando `react-markdown` + `rehype-sanitize`; el editor solo produce/consume Markdown y guarda con autoguardado (*debounce*).

### Componentes shadcn ya disponibles y su uso

`button`, `input`, `textarea`, `label`, `select`, `checkbox`, `switch`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `command`, `tabs`, `breadcrumb`, `table`, `avatar`, `badge`, `card`, `alert`, `progress`, `skeleton`, `empty`, `tooltip`, `sonner`, `separator`, `accordion`, `input-group`.

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
