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
| `012` | [Estructuración de apuntes con IA](./012-estructuracion-apuntes-ia/spec.md) | Implementada con brechas | 001, 003, 005, 008, 009 |
| `013` | [Sistema de diseño](./013-sistema-diseno/spec.md) | Implementada con brechas | 011, 012 |
| `014` | [Tema de marca en el frontend](./014-tema-marca-frontend/spec.md) | Implementada con brechas | 013 |
| `015` | [Perfil docente, verificación y confirmación de email](./015-perfil-docente/spec.md) | Implementada con brechas | 001, 008 |
| `016` | [Proyectos académicos y archivado](./016-proyectos-academicos/spec.md) | Implementada con brechas | 001, 002, 008, 015 |
| `017` | [Cuestionarios como recursos](./017-cuestionarios/spec.md) | Implementada con brechas | 003, 005, 008, 009, 016 |
| `018` | [Tareas, intentos y revisión](./018-tareas-intentos/spec.md) | Implementada con brechas | 016, 017 |
| `019` | [Panel docente y estadísticas del proyecto](./019-panel-docente/spec.md) | Implementada con brechas | 016, 017, 018 |
| `020` | [Trazabilidad y validación de recursos](./020-trazabilidad-recursos/spec.md) | Implementada con brechas | 005, 009, 010, 012, 017 |
| `021` | [Mapas mentales a partir del contenido](./021-mapas-mentales/spec.md) | Implementada con brechas | 009, 012, 016, 020 |
| `022` | [Generación de cuestionarios con IA](./022-cuestionarios-ia/spec.md) | Implementada con brechas | 012, 017, 020 |
| `023` | [Métricas de uso de recursos](./023-metricas-recursos/spec.md) | Implementada con brechas | 005, 009, 010, 017, 018, 020 |
| `024` | [Procesamiento semántico y búsqueda](./024-busqueda-semantica/spec.md) | Implementada con brechas | 005, 009, 010, 017, 020 |
| `025` | [MCP para consulta de desempeño](./025-mcp-desempeno/spec.md) | Implementada con brechas | 016, 018, 019, 023 |
| `026` | [App móvil Infinipaper](./026-app-movil/spec.md) | Implementada con brechas | 001, 005, 008, 015, 016, 017, 019, 020 |

## Deuda transversal

La cobertura automatizada es parcial: la spec 012 incluye tests del grafo LangGraph, validadores y servicio NestJS. El resto de specs se apoya en `npm run build`, `npm run lint` y flujos manuales. Cada spec registra sus brechas funcionales en `G-*`; las tareas de pruebas automatizadas se añaden a medida que se abordan.

Las specs `015`–`018` están implementadas con brechas documentadas. Las specs `019`–`022` también están implementadas con brechas. Las specs `023`–`025` están implementadas con brechas. La spec `026` añade la app móvil. Las siguientes historias partirán de `027` cuando se aprueben.

## Cómo añadir una spec

1. Elige el siguiente número secuencial (`026`, `027`, …).
2. Ejecuta `./docs/sdd/nueva-spec.sh <slug>` o copia las plantillas de `docs/sdd/plantillas/`.
3. Completa `spec.md` y añade una fila a esta tabla.
4. Sigue el flujo de [`docs/sdd/README.md`](../README.md).
