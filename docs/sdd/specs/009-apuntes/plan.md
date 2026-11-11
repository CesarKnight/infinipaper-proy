# Plan 009 · Apuntes Markdown con editor WYSIWYG y autoguardado

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Los apuntes se modelan como `Resource` de tipo `MARKDOWN`: el contenido se guarda como objeto en MinIO y la base de datos conserva metadatos (nombre, tamaño, checksum, autor y carpeta). El backend expone creación, lectura de texto, actualización de contenido, renombrado y borrado, siempre protegidos por `ProjectAccessGuard` y el rol del proyecto.

En el frontend, un editor MDXEditor cargado dinámicamente se reutiliza en tres puntos: creación de apunte, edición de un `.md` existente y aviso del proyecto. La edición usa un hook `useAutosave` con *debounce* de 1200 ms que evita guardados redundantes y expone el estado a un indicador visual. La lectura usa `react-markdown` + `rehype-sanitize`.

## 2. Contexto técnico actual

- Modelo `Resource` en `infinipaper-backend/prisma/schema.prisma`, con `kind`, `mimeType`, `s3Key`, `checksum` y `@@unique([folderId, name])`.
- Módulo `resources`: controlador, servicio, DTOs y utilidad de tipos por extensión.
- Guard de proyecto: `ProjectAccessGuard` + `@RequireProjectRole('viewer'|'editor')`.
- Almacenamiento S3: `StorageService` (`put`, `get`, `delete`) sobre MinIO.
- Frontend: cliente `apiFetch`, React Query, componentes shadcn/Base UI y `WorkspaceContext` para `projectId`, carpeta seleccionada y `canEdit`.
- El aviso del proyecto ya usa Markdown, por lo que el editor debe ser compartido.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | MDXEditor como editor WYSIWYG | Textarea, editor Markdown clásico | Toolbar completa, modo fuente, tablas, código y buena integración React |
| D-02 | Carga diferida con `next/dynamic` y `ssr: false` | Import directo | MDXEditor es pesado y depende del DOM; no debe cargar en rutas que no lo usan |
| D-03 | Autoguardado con *debounce* de 1200 ms y comparación contra el último valor guardado | Guardar en cada tecla; guardar por intervalo | Menos peticiones y sin guardados al montar |
| D-04 | Persistir el contenido en MinIO, no en una columna de la base | Columna `content` en `Resource` | Coherencia con el resto de archivos y reutilización de descarga/visor |
| D-05 | *Last-write-wins* sin bloqueo | Bloqueo optimista, CRDT | El alcance v1 no requiere colaboración en tiempo real |
| D-06 | Normalizar el nombre a `.md` en el servidor | Rechazar nombres sin extensión | Menos fricción y evita apuntes sin extensión |
| D-07 | Sanitizar en lectura con `rehype-sanitize` | Confiar en el contenido del editor | Defensa contra XSS almacenado |
| D-08 | Reutilizar editor y hook en el aviso (spec 004) | Componentes separados | Evita duplicar lógica de autoguardado y estilos |

## 4. Cambios por capa

### Datos

- Sin migración nueva: se reutiliza `Resource`.
- `kind = MARKDOWN`, `mimeType = text/markdown`.
- El contenido vive en `s3Key`; `size` y `checksum` se actualizan en cada guardado.
- Rollback: no hay cambios de esquema; revertir código es suficiente. Los objetos de MinIO permanecen y pueden eliminarse con el recurso.

### Backend

- `CreateNoteDto`: `name` 1–255 y `content` hasta 1.000.000 de caracteres.
- `UpdateContentDto`: `content` hasta 1.000.000 de caracteres.
- `ResourcesService.createNote`: normaliza `.md` y delega en `createMarkdown`.
- `createMarkdown`: valida carpeta, comprueba nombre duplicado, sube a MinIO y crea el `Resource`.
- `readText`: lee el objeto Markdown y devuelve `{ content }`.
- `updateContent`: reescribe el objeto y actualiza `size`/`checksum`.
- `rename`: valida extensión soportada y nombre disponible.
- `remove`: elimina el registro y el objeto de MinIO.
- `ResourcesController`: rutas `POST /folders/:folderId/notes`, `GET /files/:fileId/text`, `PUT /files/:fileId/content`, `PATCH /files/:fileId`, `DELETE /files/:fileId`.
- Permisos: `@RequireProjectRole('viewer')` para lectura y `('editor')` para escritura.

### Frontend

- `components/markdown/mdx-editor-inner.tsx`: configuración de MDXEditor y toolbar.
- `components/markdown/markdown-editor.tsx`: wrapper con carga dinámica.
- `lib/use-autosave.ts`: *debounce*, comparación con el último guardado y estados.
- `components/markdown/autosave-status.tsx`: indicador `Guardando…` / `Guardado` / `Error al guardar`.
- `components/project/resource-list.tsx`: botón “Nuevo apunte”, diálogo y creación.
- `app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx`: edición del `.md` existente y vista de lectura.
- `components/project/markdown-view.tsx`: render sanitizado.
- `components/project/notice-panel.tsx`: reutilización del editor para el aviso.
- `app/globals.css`: tokens de tema para MDXEditor.

### Infraestructura

- Sin cambios de servicios ni variables de entorno nuevas.
- MinIO debe estar disponible para crear/leer/guardar apuntes.
- No se añaden dependencias de backend; en frontend se añaden `@mdxeditor/editor`, `react-markdown`, `remark-gfm` y `rehype-sanitize`.

## 5. Contratos

```http
POST /api/v1/folders/:folderId/notes
Content-Type: application/json

{ "name": "tema", "content": "# Tema\n\nContenido" }
```

```json
{
  "id": "cuid",
  "folderId": "cuid",
  "authorId": "cuid",
  "name": "tema.md",
  "kind": "MARKDOWN",
  "mimeType": "text/markdown",
  "size": 27,
  "s3Key": "projects/.../tema.md",
  "createdAt": "2026-11-11T00:00:00.000Z",
  "updatedAt": "2026-11-11T00:00:00.000Z",
  "author": { "id": "cuid", "username": "...", "displayName": "..." }
}
```

```http
PUT /api/v1/files/:fileId/content
Content-Type: application/json

{ "content": "# Tema actualizado" }
```

```http
GET /api/v1/files/:fileId/text

{ "content": "# Tema actualizado" }
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Unitario | `useAutosave` (debounce, sin guardado inicial, estados) | Vitest + Testing Library (pendiente) |
| Unitario backend | `createNote` (normalización), `updateContent`, permisos | Vitest (pendiente) |
| E2E | Crear apunte, editar, autoguardar, reabrir, borrar | Playwright |
| Manual | Sanitización XSS, Viewer sin permisos, tema claro/oscuro | Navegador |

Verificación ya realizada: flujo de creación, autoguardado, persistencia y cero errores de consola con Playwright (2026-11-05). Faltan tests automatizados específicos y pruebas de límite/XSS.

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Pérdida de la última edición al salir antes del *debounce* | Media | Medio | G-06: indicar cambios pendientes o forzar guardado al desmontar |
| XSS almacenado en Markdown | Baja | Alto | `rehype-sanitize` en lectura; nunca renderizar HTML crudo |
| Guardados fuera de orden | Baja | Medio | *Last-write-wins* aceptado en v1; el *debounce* reduce ráfagas |
| Contenido grande en memoria | Baja | Medio | Límite de 1.000.000 de caracteres; revisar límite en bytes (G-04) |
| MinIO no disponible | Media | Alto | Error visible al usuario; no crear el recurso si falla la subida |
| Regresiones sin tests | Alta | Medio | G-05: añadir tests de servicio y hook |

## 8. Rollback

- No hay migración de base de datos que revertir.
- Revertir los cambios de código elimina las rutas y componentes; los `Resource` existentes seguirán siendo accesibles como archivos Markdown.
- Si se elimina la funcionalidad, decidir si se borran los objetos de MinIO o se conservan para descarga.
- Las variables de entorno no cambian.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/resources/dto/create-note.dto.ts` | Crear |
| `infinipaper-backend/src/modules/resources/dto/update-content.dto.ts` | Crear |
| `infinipaper-backend/src/modules/resources/resources.controller.ts` | Modificar |
| `infinipaper-backend/src/modules/resources/resources.service.ts` | Modificar |
| `infinipaper-backend/src/modules/resources/resource-kind.util.ts` | Modificar |
| `infinipaper-frontend/components/markdown/mdx-editor-inner.tsx` | Crear |
| `infinipaper-frontend/components/markdown/markdown-editor.tsx` | Crear |
| `infinipaper-frontend/components/markdown/autosave-status.tsx` | Crear |
| `infinipaper-frontend/lib/use-autosave.ts` | Crear |
| `infinipaper-frontend/components/project/resource-list.tsx` | Modificar |
| `infinipaper-frontend/components/project/notice-panel.tsx` | Modificar |
| `infinipaper-frontend/components/project/markdown-view.tsx` | Modificar |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx` | Modificar |
| `infinipaper-frontend/app/globals.css` | Modificar |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-11 | `T-022`, `T-023` |
| RF-02 | `T-020`, `T-030` |
| RF-03 | `T-031`, `T-032` |
| RF-04, RF-05, RF-06 | `T-033`, `T-034` |
| RF-07 | `T-036` |
| RF-08, RF-09 | `T-026`, `T-037` |
| RF-10 | `T-021`, `T-035` |
| RF-12 | `T-025`, `T-042` |
| RF-13 | `T-024`, `T-051` |
| RF-14 | `T-027`, `T-050` |
| RF-15 | `T-036`, `T-041` |
| RNF-01 | `T-030` |
| RNF-02 | `T-036`, `T-043` |
| RNF-03 | `T-033` |
| RNF-04 | `T-038` |
| RNF-05 | `T-038`, `T-043` |
| RNF-06 | `T-021`, `T-053` |
| RNF-07 | `T-025` |
