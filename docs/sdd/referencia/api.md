# Convenciones de API

## Prefijo y versionado

- Todas las rutas cuelgan de `/api/v1`.
- Swagger está disponible en `/api/v1/docs`.
- Healthcheck: `GET /api/v1/health`.

## Autenticación

- Cookie de sesión `httpOnly`, `SameSite=Lax`, `Path=/`; `Secure` en producción.
- El backend no usa `Authorization: Bearer` para la sesión web.
- El navegador llama a rutas relativas `/api/*`; Next las reenvía al backend y la cookie queda *first-party*.
- `AuthGuard` es global; las rutas públicas se marcan con `@Public()`.

## Formato de error

```json
{
  "statusCode": 409,
  "code": "USER_EMAIL_TAKEN",
  "message": "El correo ya está registrado",
  "details": null
}
```

- `code` es estable y apto para la UI.
- `message` es legible y está en español.
- `details` contiene información adicional opcional (por ejemplo, `suggestedName`).
- Los errores de validación usan `VALIDATION_ERROR` (400).

## Paginación

- Por cursor: `?cursor=<id>&limit=20`.
- Respuesta: `{ "items": [...], "nextCursor": "..." }`.
- `limit` tiene un máximo configurable por endpoint.

## Fechas

- ISO 8601 en UTC.
- La UI formatea en la zona local.

## Archivos y contenido

- La subida usa `multipart/form-data` con el campo `file`.
- Los binarios se leen con `GET /api/v1/files/:id/content` y soportan `Range` para audio/video.
- El límite de subida se configura con `MAX_UPLOAD_SIZE_MB`; `GET /api/v1/config` expone `{ maxUploadSizeMb }`.
- Las URLs de MinIO nunca se exponen al navegador.

## Índice de rutas por spec

| Spec | Rutas principales |
|---|---|
| [001 Usuarios](../specs/001-usuarios/spec.md) | `/auth/*`, `/users/*` |
| [002 Proyectos](../specs/002-proyectos/spec.md) | `/projects`, `/projects/public`, `/projects/:id` |
| [003 Carpetas](../specs/003-carpetas/spec.md) | `/projects/:id/folders`, `/folders/:id` |
| [004 Aviso](../specs/004-aviso/spec.md) | `/folders/:id/notice`, `/folders/:id` |
| [005 Archivos](../specs/005-archivos/spec.md) | `/folders/:id/files`, `/files/:id` |
| [006 Visualización](../specs/006-visualizacion/spec.md) | `/files/:id/content` |
| [007 Participantes](../specs/007-participantes/spec.md) | `/projects/:id/members` |
| [008 Permisos](../specs/008-permisos/spec.md) | `/projects/:id/members/:userId` |
| [009 Apuntes](../specs/009-apuntes/spec.md) | `/folders/:id/notes`, `/files/:id/text`, `/files/:id/content` |
| [010 Transcripción](../specs/010-transcripcion/spec.md) | `/files/:id/transcriptions`, `/transcriptions/:id` |
| [011 Dashboard](../specs/011-dashboard/spec.md) | `/dashboard` |
