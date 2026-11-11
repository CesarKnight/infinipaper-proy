# Plan 006 · Visualización multimedia

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

La página de archivo obtiene los metadatos del recurso y delega en un componente que elige el visor según `kind`. Las imágenes, el audio y el video usan elementos nativos; el PDF usa un `<iframe>` al endpoint proxeado; los ofimáticos y formatos sin visor ofrecen descarga. El backend sirve el binario con `Range`.

## 2. Contexto técnico actual

- `app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx`.
- `fileContentUrl` en `lib/api.ts`.
- `resources.controller.ts` con `Range`.
- `MarkdownView` para `.md`.
- `AudioViewer` incluye la transcripción de la spec 010.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | `<iframe>` para PDF | PDF.js con worker | Menos configuración y same-origin |
| D-02 | Elementos nativos para audio/video | Librería externa | `Range` y controles del navegador |
| D-03 | Fallback de descarga | Error bloqueante | El usuario siempre puede acceder al archivo |
| D-04 | Vista dedicada | Modal | Permite enlazar y volver a la carpeta |

## 4. Cambios por capa

### Datos

- Sin cambios; se usan `kind` y `mimeType` de `Resource`.

### Backend

- Endpoint de contenido con `Accept-Ranges` y `Content-Range`.
- Metadatos del recurso.

### Frontend

- Página dedicada y selector de visor.
- Botones de volver y descargar.
- Estados de carga/error.
- Integración de Markdown y transcripción.

### Infraestructura

- Sin cambios.

## 5. Contratos

```http
GET /api/v1/files/:fileId/content
Range: bytes=0-1023
```

Respuesta `206 Partial Content` con `Content-Range` cuando aplica.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual | Cada tipo de visor y fallback | Navegador |
| E2E | Navegación desde la carpeta y vuelta | Playwright |
| Unitario | Selección de visor | Vitest (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| PDF no soportado por el navegador | Medio | Descarga disponible |
| Video grande sin `Range` | Medio | Soporte de `Range` en backend |
| XSS en Markdown | Alto | `rehype-sanitize` |
| Enlaces directos a MinIO | Medio | Solo `/api/v1/files/:id/content` |

## 8. Rollback

- Revertir código.
- Los archivos siguen accesibles por descarga.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx` | Vista y selector |
| `infinipaper-frontend/lib/api.ts` | `fileContentUrl` |
| `infinipaper-backend/src/modules/resources/resources.controller.ts` | `Range` |
| `infinipaper-frontend/components/project/markdown-view.tsx` | Markdown |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-010`, `T-011` |
| RF-03 | `T-012` |
| RF-04, RF-05, RF-06 | `T-020` |
| RF-07, RF-08 | `T-021` |
| RF-09 | `T-022` |
| RF-10, RF-11 | `T-013`, `T-023` |
