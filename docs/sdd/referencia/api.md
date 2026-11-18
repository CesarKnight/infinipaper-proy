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
| [012 Estructuración IA](../specs/012-estructuracion-apuntes-ia/spec.md) | `/files/:id/structure`, `/structure-jobs/:jobId`, `/structure-jobs/:jobId/apply` |
| [015 Perfil docente](../specs/015-perfil-docente/spec.md) | `/auth/email/verify/*`, `/teacher/verification`, `/admin/teacher-verifications/*`, `/admin/users/:id/revoke-teacher` |
| [016 Proyectos académicos](../specs/016-proyectos-academicos/spec.md) | `/projects/:id/archive`, `/projects/:id/archive/extend`, `/projects/:id/restore`, `/admin/projects/purge-expired` |
| [017 Cuestionarios](../specs/017-cuestionarios/spec.md) | `/folders/:id/quizzes`, `/quizzes/:id`, `/quizzes/:id/questions`, `/quizzes/:id/publish` |
| [018 Tareas e intentos](../specs/018-tareas-intentos/spec.md) | `/quizzes/:id/assignments`, `/assignments/*`, `/attempts/*` |
| [019 Panel docente](../specs/019-panel-docente/spec.md) | `/projects/:id/analytics`, `/projects/:id/analytics/tasks`, `/projects/:id/analytics/students`, `/projects/:id/analytics/export`, `/projects/:id/my-progress` |
| [020 Trazabilidad](../specs/020-trazabilidad-recursos/spec.md) | `/files/:id/provenance`, `/files/:id/validate`, filtros `origin` y `validationStatus` |
| [021 Mapas mentales](../specs/021-mapas-mentales/spec.md) | `/folders/:id/mindmaps`, `/generation-jobs/:id`, `/generation-jobs/:id/retry` |
| [022 Cuestionarios IA](../specs/022-cuestionarios-ia/spec.md) | `/folders/:id/quizzes/generate`, `/generation-jobs/:id` |
| [023 Métricas de uso](../specs/023-metricas-recursos/spec.md) | `/projects/:id/usage`, `/projects/:id/usage/export`, `/files/:id/usage` |
| [024 Búsqueda](../specs/024-busqueda-semantica/spec.md) | `/projects/:id/search`, `/projects/:id/search/reindex`, `/projects/:id/search/status` |
| [025 MCP](../specs/025-mcp-desempeno/spec.md) | `/projects/:id/mcp-tokens`, `/mcp-tokens/:id`, `/mcp-tools/*`, `/mcp` |
