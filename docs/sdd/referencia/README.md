# Documentos de referencia

Documentación transversal que no describe un cambio concreto pero que las specs deben respetar.

| Documento | Contenido |
|---|---|
| [`infraestructura.md`](./infraestructura.md) | Servicios, Docker Compose, rewrites, variables de entorno, S3, cola y auth |
| [`librerias.md`](./librerias.md) | Dependencias de backend y frontend, propósito y estado |
| [`modelo-datos.md`](./modelo-datos.md) | Esquema Prisma vigente y notas de diseño |
| [`decisiones.md`](./decisiones.md) | Decisiones cerradas de arquitectura y producto |
| [`api.md`](./api.md) | Convenciones de API, errores y paginación |

## Regla de mantenimiento

- Si una spec cambia una decisión transversal, primero se actualiza el documento de referencia y luego la spec.
- Las specs enlazan a estos documentos en lugar de duplicar su contenido.
- Los documentos de referencia no sustituyen a una spec: describen el contexto estable, no un cambio pendiente.
