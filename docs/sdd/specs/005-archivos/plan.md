# Plan 005 · Gestión de archivos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

La subida pasa por el backend: Multer recibe el archivo, el servicio valida tamaño y extensión, calcula checksum y escribe el objeto en MinIO. Se crea un `Resource` con los metadatos y una clave S3 única. La descarga se sirve por el backend con soporte de `Range`. El límite se toma de `MAX_UPLOAD_SIZE_MB`, se aplica en servidor y se expone en `GET /config` para el pre-chequeo del cliente.

## 2. Contexto técnico actual

- `resources.controller.ts` y `resources.service.ts`.
- `StorageService` con `put`, `get` y `delete`.
- `resource-kind.util.ts` para mapear extensión → `kind`/`mimeType`.
- `Resource` en Prisma.
- `resource-list.tsx` para la UI.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Proxy de subida por backend | Subida directa a MinIO | Evita CORS y centraliza validación |
| D-02 | `kind` por extensión | MIME del navegador | Consistencia y seguridad |
| D-03 | Clave S3 con UUID | Nombre del archivo como clave | Evita colisiones y filtra rutas |
| D-04 | `FILE_NAME_TAKEN` con `suggestedName` | Reemplazo automático | Evita pérdida accidental |
| D-05 | Input de archivo en v1 | Drag & drop | Menos superficie y dependencias |

## 4. Cambios por capa

### Datos

- `Resource` con metadatos y `s3Key`.
- Sin migración pendiente.

### Backend

- Endpoint multipart de subida.
- Validación de tamaño, extensión y nombre.
- Cálculo de checksum y escritura S3.
- Listado, metadatos, descarga con `Range`, renombrado y borrado.
- Límite desde configuración.

### Frontend

- Listado con iconos, autor y tamaño.
- Subida con input, estado y errores.
- Acciones de renombrar y eliminar (Editor+).

### Infraestructura

- `MAX_UPLOAD_SIZE_MB` y bucket de MinIO.

## 5. Contratos

```http
POST /api/v1/folders/:folderId/files
Content-Type: multipart/form-data

file=<binario>
```

```http
GET /api/v1/files/:fileId/content
Range: bytes=0-1023
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Subir, listar, descargar y eliminar | Playwright + MinIO |
| Unitario | Validación de tamaño, extensión y duplicados | Vitest (pendiente) |
| Integración | Limpieza S3 al borrar | Vitest + MinIO (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Subida supera el límite | Medio | Validación en backend y Multer |
| Objetos S3 huérfanos | Medio | Borrado conjunto recurso/objeto |
| Colisión de nombres | Bajo | `suggestedName` |
| Descarga de binarios grandes | Medio | `Range` y streaming |

## 8. Rollback

- Revertir código.
- Los recursos existentes conservan sus objetos en MinIO.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/resources/*` | Controlador, servicio, DTOs y utilidad de tipos |
| `infinipaper-backend/src/common/storage/storage.service.ts` | S3 |
| `infinipaper-frontend/components/project/resource-list.tsx` | Listado y subida |
| `infinipaper-backend/src/modules/config/config.controller.ts` | Límite público |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-010`, `T-011` |
| RF-03, RF-05 | `T-012` |
| RF-04 | `T-013` |
| RF-06 | `T-014` |
| RF-07 | `T-015` |
| RF-08, RF-10 | `T-016`, `T-020` |
| RF-09 | `T-017` |
