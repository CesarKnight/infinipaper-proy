# Índice de specs

> Fuente vigente del comportamiento del producto. Cada spec describe un cambio acotado y enlaza a su plan y a sus tareas.

| ID | Spec | Estado | Dependencias |
|---|---|---|---|
| `001` | [Usuarios, autenticación y sesiones](./001-usuarios/spec.md) | Implementada con brechas | — |
| `002` | [Proyectos](./002-proyectos/spec.md) | Implementada con brechas | 001 |
| `003` | [Carpetas](./003-carpetas/spec.md) | Implementada con brechas | 001, 002, 008 |
| `004` | [Aviso en el listado de carpeta](./004-aviso/spec.md) | Implementada con brechas | 001, 003, 005, 008, 009 |
| `005` | [Gestión de archivos](./005-archivos/spec.md) | Implementada con brechas | 001, 003, 008 |
| `006` | [Visualización multimedia](./006-visualizacion/spec.md) | Implementada con brechas | 005, 008 |
| `007` | [Participantes](./007-participantes/spec.md) | Implementada con brechas | 001, 002, 008 |
| `008` | [Permisos y roles de proyecto](./008-permisos/spec.md) | Implementada con brechas | 001, 002, 007 |
| `009` | [Apuntes Markdown con editor WYSIWYG y autoguardado](./009-apuntes/spec.md) | Implementada con brechas | 001, 003, 005, 008 |
| `010` | [Transcripción de audio](./010-transcripcion/spec.md) | Implementada con brechas | 001, 003, 005, 006, 008, 009 |
| `011` | [Dashboard personal](./011-dashboard/spec.md) | Implementada con brechas | 001, 002, 007, 008 |

## Deuda transversal

Ninguna spec cuenta todavía con cobertura automatizada específica. La verificación actual se apoya en `npm run build`, `npm run lint` y flujos manuales. Cada spec registra sus brechas funcionales en `G-*`; las tareas de pruebas automatizadas se añaden cuando se aborde la deuda de calidad.

## Cómo añadir una spec

1. Elige el siguiente número secuencial (`012`, `013`, …).
2. Ejecuta `./docs/sdd/nueva-spec.sh <slug>` o copia las plantillas de `docs/sdd/plantillas/`.
3. Completa `spec.md` y añade una fila a esta tabla.
4. Sigue el flujo de [`docs/sdd/README.md`](../README.md).
