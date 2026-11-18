# Plan 006 · Visualización multimedia

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-18 |

## 1. Resumen de la solución

La página de archivo obtiene los metadatos del recurso y delega en un visor especializado. Todos comparten `ViewerShell` para alinear la UI con Paper & Ink / Midnight Study. Imagen, PDF, audio y video usan componentes propios; DOCX/XLSX/PPTX se renderizan en cliente con carga diferida; los formatos legacy ofrecen descarga. La fuente binaria sigue en MinIO y el render queda desacoplado para futuros editores colaborativos.

## 2. Contexto técnico actual

- `app/projects/[projectId]/(workspace)/files/[fileId]/page.tsx`.
- `fileContentUrl` en `lib/api.ts`.
- `resources.controller.ts` con `Range`.
- `MarkdownView` para `.md`.
- `AudioViewer` incluye la transcripción de la spec 010.
- `components/viewers/*`: `ViewerShell`, `ImageViewer`, `PdfViewer`, `VideoViewer`, `OfficeViewer`.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | `<iframe>` para PDF | PDF.js con worker | Menos configuración y same-origin |
| D-02 | Elementos nativos para audio/video | Librería externa | `Range` y controles del navegador |
| D-03 | Fallback de descarga | Error bloqueante | El usuario siempre puede acceder al archivo |
| D-04 | Vista dedicada | Modal | Permite enlazar y volver a la carpeta |
| D-05 | Render ofimático en cliente y diferido | Conversión en servidor | Menos infraestructura y sin enviar archivos a terceros |
| D-06 | Marco visual común | Estilos nativos por formato | Identidad consistente y accesible |
| D-07 | Render de solo lectura desacoplado del binario | Editar el archivo original desde el visor | Permite sustituir el render por colaboración CRDT en el futuro |

## 4. Cambios por capa

### Datos

- Sin cambios; se usan `kind` y `mimeType` de `Resource`.

### Backend

- Endpoint de contenido con `Accept-Ranges` y `Content-Range`.
- Metadatos del recurso.

### Frontend

- Página dedicada y selector de visor.
- Marco visual `ViewerShell`.
- `ImageViewer` con zoom/paneo.
- `OfficeViewer` para DOCX/XLSX/PPTX con carga diferida.
- `PdfViewer`, `VideoViewer` y audio con streaming.
- Botones de volver y descargar.
- Estados de carga/error y fallback.
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
| Códec de video no soportado | Medio | Fallback de descarga |
| Librería ofimática pesada | Medio | Dynamic import por formato |
| Render ofimático falla | Medio | Estado de error + descarga |
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
| `infinipaper-frontend/components/viewers/*` | Marco y visores especializados |
| `infinipaper-backend/src/modules/resources/resource-kind.util.ts` | Extensiones ofimáticas y de video |
| `infinipaper-frontend/lib/api.ts` | `fileContentUrl` |
| `infinipaper-backend/src/modules/resources/resources.controller.ts` | `Range` |
| `infinipaper-frontend/components/project/markdown-view.tsx` | Markdown |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-010`, `T-011` |
| RF-03 | `T-012` |
| RF-04, RF-05, RF-06, RF-06b, RF-06c, RF-06d | `T-020` |
| RF-12–RF-16 | `T-026` |
| RF-07, RF-08 | `T-021` |
| RF-09 | `T-022` |
| RF-10, RF-11 | `T-013`, `T-023` |
