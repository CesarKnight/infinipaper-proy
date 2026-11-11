# Plan 004 · Aviso en el listado de carpeta

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

El aviso se modela como un `Resource` Markdown más, con nombre configurable `AVISO_FILENAME`. El detalle de carpeta devuelve `noticeResourceId` si existe un recurso con ese nombre. El frontend renderiza el contenido al tope de la carpeta y, si no existe, ofrece crearlo. La edición reutiliza el editor MDXEditor y el hook de autoguardado de la spec 009.

## 2. Contexto técnico actual

- `folders.service.ts` calcula `noticeResourceId`.
- `resources.service.ts` crea el aviso mediante `createMarkdown`.
- `notice-panel.tsx` renderiza, crea y edita.
- `markdown-view.tsx` sanitiza con `rehype-sanitize`.
- `AVISO_FILENAME` en la configuración del backend.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | `Resource` Markdown con nombre fijo | Entidad `Notice` | Reutiliza archivos, visor, permisos y borrado |
| D-02 | `noticeResourceId` en el detalle de carpeta | Buscar por nombre en el cliente | Evita N+1 y centraliza la regla |
| D-03 | Editor compartido con apuntes | Editor específico | Menos duplicación |
| D-04 | Aviso visible en el listado | Ocultarlo | Coherencia con el modelo de archivos |

## 4. Cambios por capa

### Datos

- Sin tablas nuevas.
- `Resource` MARKDOWN con nombre `aviso.md`.

### Backend

- `createNotice` con nombre configurado.
- `noticeResourceId` en `GET /folders/:id`.
- Lectura y guardado mediante las rutas de contenido.

### Frontend

- `notice-panel.tsx` con render, creación, edición y autosave.
- `resource-list.tsx` mantiene el aviso como archivo.
- Sanitización y GFM.

### Infraestructura

- Variable `AVISO_FILENAME`.

## 5. Contratos

```http
GET /api/v1/folders/:folderId
{ "id": "...", "name": "...", "noticeResourceId": "..." }
```

```http
POST /api/v1/folders/:folderId/notice
{ "content": "## Aviso\n..." }
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Crear, renderizar y editar aviso | Playwright |
| Seguridad | Sanitización XSS | Test manual con HTML malicioso |
| Unitario | Detección por `AVISO_FILENAME` | Vitest (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| XSS en el aviso | Alto | `rehype-sanitize` |
| Imágenes relativas rotas | Medio | G-01 documentada; usar URLs de archivo |
| Fallo de carga bloquea la carpeta | Medio | Manejo de error local |
| Nombre mal configurado | Medio | Validación de `AVISO_FILENAME` |

## 8. Rollback

- Revertir código.
- Los avisos existentes siguen siendo archivos `.md` accesibles.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/folders/folders.service.ts` | `noticeResourceId` |
| `infinipaper-backend/src/modules/resources/resources.controller.ts` | Ruta de aviso |
| `infinipaper-backend/src/modules/resources/resources.service.ts` | `createNotice` |
| `infinipaper-frontend/components/project/notice-panel.tsx` | Panel del aviso |
| `infinipaper-frontend/components/project/markdown-view.tsx` | Render sanitizado |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02, RF-11 | `T-010`, `T-011` |
| RF-03, RF-04 | `T-012` |
| RF-05 | `T-013` |
| RF-06, RF-07, RF-09 | `T-020` |
| RF-08 | `T-021` |
| RF-10 | `T-022` |
