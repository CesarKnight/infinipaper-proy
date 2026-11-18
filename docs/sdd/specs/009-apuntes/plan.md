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

## 11. Iteración de refinamiento UX del editor (2026-11-18)

| Campo | Valor |
|---|---|
| Estado | `Implementado (2026-11-18)` |
| Requisitos | `RF-16`–`RF-20`, `RNF-08`–`RNF-11`, `CA-11`–`CA-15` |
| Alcance | Solo frontend; sin cambios de API, datos ni autoguardado |

### 11.1 Enfoque técnico

1. **Altura estable y scroll interno.** El wrapper `MarkdownEditor` aceptará `className` y `fill`. Cuando `fill` sea `true`, el editor añadirá la clase `mdxeditor-full-height` que ofrece MDXEditor para encadenar flex hasta el `contenteditable`; el contenedor del diálogo definirá la altura con `dvh`.
2. **Diálogo de creación dimensionado por viewport.** El `DialogContent` de “Nuevo apunte” pasará de `sm:max-w-sm` a un layout de tres filas (`header`, `contenido`, `footer`) con altura `min(90dvh, 46rem)`, ancho `calc(100% - 1rem)` en móvil y `sm:max-w-3xl` en escritorio. La fila central tendrá `min-h-0` y el editor `flex-1` para que el scroll ocurra dentro del editor, no en la página.
3. **Toolbar agrupada.** La toolbar se compondrá de grupos semánticos: historial, tipo de bloque, formato en línea, listas, enlaces/insertar y modo de vista. Los grupos se separarán visualmente con contenedores suaves y `aria-label`.
4. **Localización.** Se pasará la prop `translation` de MDXEditor con mensajes en español para tooltips, tipos de bloque, modos de vista, diálogo de enlace, imagen y tablas.
5. **Responsive de la toolbar.** Los grupos podrán pasar a varias filas (`flex-wrap`). En móvil, el selector de modo ocupará su propia fila alineado a la derecha. Se elimina la dependencia de scroll horizontal como única forma de alcanzar controles.
6. **Objetivos táctiles y foco.** Los botones de toolbar tendrán un mínimo de 2rem × 2rem, iconos de 1rem, hover/activo con contraste y `focus-visible` con el token `--ring`.

### 11.2 Cambios por capa

#### Frontend

| Archivo | Cambio |
|---|---|
| `components/markdown/mdx-editor-inner.tsx` | Props `className`/`fill`; `cn`; `translation` en español; toolbar por grupos; `aria-label` en grupos; wrapper del selector de modo |
| `components/markdown/markdown-editor.tsx` | Props `className`/`fill`; contenedor con altura; skeleton con altura estable (`h-full min-h-48`) |
| `components/project/resource-list.tsx` | `DialogContent` con altura máxima, grid de tres filas y ancho responsive; editor con `fill` y `flex-1`; etiqueta accesible para el nombre |
| `app/globals.css` | Tokens de toolbar, grupos, wrap, touch targets, foco, scroll interno y estados activos |

#### Backend, datos e infraestructura

Sin cambios. No se añaden dependencias: se usan APIs existentes de `@mdxeditor/editor` (`mdxeditor-full-height`, `translation`, `Translation`).

### 11.3 Comportamiento responsive esperado

| Ancho | Diálogo | Toolbar | Editor |
|---|---|---|---|
| 320–430 px | Ancho `calc(100% - 1rem)`, alto `min(90dvh, 46rem)` | Varias filas; modo de vista en fila propia | Scroll interno; pie visible |
| 640–1024 px | Hasta `sm:max-w-3xl` | Una o dos filas según espacio | Scroll interno; sin desbordar |
| ≥1024 px | `sm:max-w-3xl` | Una fila con grupos alineados | Altura máxima de 46rem |

### 11.4 Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| La toolbar ocupa demasiado alto en móvil y deja poco espacio de escritura | Media | Medio | Agrupar controles y permitir alto de editor mínimo de 14rem; validar en 320×568 |
| `mdxeditor-full-height` no funciona si falta una altura explícita en el ancestro | Media | Alto | Altura fija en `DialogContent` y `flex-1 min-h-0` en el contenedor del editor |
| La localización cambia textos que dependían de valores por defecto | Baja | Bajo | Traducir solo claves de presentación; no tocar el Markdown |
| El wrap de la toolbar rompe el modo fuente | Baja | Medio | `SourceToolbar` conserva `UndoRedo` y se prueba el cambio de modo |
| El diálogo se desborda en landscape muy bajo | Baja | Medio | `min(90dvh, 46rem)` y scroll del contenido del diálogo como fallback |

### 11.5 Rollback

- Revertir los cuatro archivos frontend devuelve el editor y el diálogo al comportamiento anterior.
- No hay migraciones, variables de entorno ni contratos que revertir.
- Los apuntes existentes no se modifican.

### 11.6 Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-16, RF-17 | `T-070`, `T-071`, `T-072` |
| RF-18 | `T-073`, `T-074` |
| RF-19 | `T-075` |
| RNF-08, RNF-09, RNF-10 | `T-074`, `T-075`, `T-076` |
| CA-11, CA-12 | `T-071`, `T-072`, `T-076` |
| CA-13, CA-14 | `T-073`, `T-074`, `T-075`, `T-076` |
| RF-20, RNF-11, CA-15 | `T-079`, `T-080`, `T-081` |
| G-07 | `T-078` (pendiente) |

### 11.7 Hallazgos durante la verificación

- **G-07:** a 320 px la página de carpeta (cabecera y barra de filtros/acciones) desborda horizontalmente antes de abrir el editor. El diálogo del editor sí cabe en el viewport; la corrección queda como `T-078`, fuera del alcance de esta iteración.

### 11.8 Corrección de capas de los diálogos del editor (2026-11-18)

**Causa raíz:** MDXEditor monta sus diálogos y popovers en `.mdxeditor-popup-container`, un contenedor al final del `body` con `z-index: 2`. El diálogo “Nuevo apunte” y su overlay usan `z-index: 50`, así que el diálogo de imagen, el de enlace y los menús del editor quedaban en una capa inferior y no eran accesibles. Al añadir `overflow: hidden` al editor también se recortaban sus flotantes; se retiró esa restricción.

**Solución:**

- Elevar `.mdxeditor-popup-container` a `z-index: 60`, por encima de los diálogos de la app (`z-50`) y por debajo de los toasts.
- Mantener `pointer-events: none` en el contenedor y `pointer-events: auto` en sus hijos, para que el contenedor vacío (2 px al final del `body`) no intercepte clics.
- No cambiar el portal ni los componentes internos de MDXEditor; la corrección es solo CSS y se aplica a todos los usos del editor (modal, visor y aviso).

**Verificación:** con el diálogo de apunte abierto, imagen, enlace y selector de bloque se muestran encima; `elementFromPoint` en la cabecera del modal devuelve el overlay del diálogo de imagen mientras está abierto.

**Rollback:** revertir las reglas de `.mdxeditor-popup-container` en `globals.css`; no hay cambios de API ni de datos.
