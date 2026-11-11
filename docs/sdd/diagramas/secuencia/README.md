# Diagramas de secuencia

Un diagrama por spec. Cada archivo incluye el flujo principal y los casos alternativos relevantes.

| Spec | Diagrama | Actores principales |
|---|---|---|
| 001 Usuarios | [001-usuarios.md](./001-usuarios.md) | Usuario, Frontend, API, DB, MinIO |
| 002 Proyectos | [002-proyectos.md](./002-proyectos.md) | Usuario, Visitante, Owner, API, DB, MinIO |
| 003 Carpetas | [003-carpetas.md](./003-carpetas.md) | Owner, Editor, API, DB, MinIO |
| 004 Aviso | [004-aviso.md](./004-aviso.md) | Viewer, Editor, API, DB, MinIO |
| 005 Archivos | [005-archivos.md](./005-archivos.md) | Editor, Viewer, API, DB, MinIO |
| 006 Visualización | [006-visualizacion.md](./006-visualizacion.md) | Viewer, API, DB, MinIO |
| 007 Participantes | [007-participantes.md](./007-participantes.md) | Owner, API, DB |
| 008 Permisos | [008-permisos.md](./008-permisos.md) | Editor, Owner, API, Guard, Permissions, DB |
| 009 Apuntes | [009-apuntes.md](./009-apuntes.md) | Editor, API, DB, MinIO |
| 010 Transcripción | [010-transcripcion.md](./010-transcripcion.md) | Editor, API, DB, pg-boss, MinIO, Whisper |
| 011 Dashboard | [011-dashboard.md](./011-dashboard.md) | Usuario, API, DB |

## Convenciones

- `autonumber` numera los mensajes en orden.
- `alt`/`opt` representan caminos alternativos y opcionales.
- Las respuestas usan flechas discontinuas (`-->>`).
- El modelo formal equivalente está en `docs/sdd/ea/modelo.json`.
