# Arquitectura C4

Vistas C4 de Infinipaper: contexto, contenedores y componentes del backend. El detalle de despliegue y variables está en [`referencia/infraestructura.md`](../referencia/infraestructura.md).

## Nivel 1 · Contexto

```mermaid
C4Context
  title Infinipaper · Contexto

  Person(visitante, "Visitante", "Consulta proyectos públicos sin autenticarse")
  Person(usuario, "Usuario", "Estudiante o docente autenticado")

  System(infinipaper, "Infinipaper", "Organiza proyectos, carpetas, archivos, avisos, apuntes y transcripciones")

  System_Ext(whisper, "Whisper ASR", "Servicio autoalojado de reconocimiento de voz")
  System_Ext(minio, "MinIO", "Almacenamiento de objetos compatible con S3")
  System_Ext(postgres, "PostgreSQL", "Base de datos relacional")
  System_Ext(llm, "Proveedor LLM", "AWS Bedrock / OpenCode Go / OpenAI-compatible")

  Rel(visitante, infinipaper, "Consulta proyectos públicos", "HTTPS")
  Rel(usuario, infinipaper, "Gestiona su material de estudio", "HTTPS")
  Rel(infinipaper, postgres, "Persiste usuarios, proyectos y metadatos", "SQL")
  Rel(infinipaper, minio, "Guarda y sirve archivos y avatares", "S3")
  Rel(infinipaper, whisper, "Transcribe audio", "HTTP")
  Rel(infinipaper, llm, "Estructura apuntes", "HTTPS")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## Nivel 2 · Contenedores

```mermaid
C4Container
  title Infinipaper · Contenedores

  Person(usuario, "Usuario", "Estudiante o docente")
  Person(visitante, "Visitante", "Consulta proyectos públicos")

  System_Boundary(sistema, "Infinipaper") {
    Container(frontend, "Frontend", "Next.js 16 · React 19", "UI, rutas y proxy same-origin de /api/*")
    Container(backend, "Backend", "NestJS 12 · Prisma 7", "API REST, auth, permisos, archivos y transcripciones")
    Container(agents, "Agents", "FastAPI · LangGraph", "Grafo de agentes para estructurar apuntes")
    Container(queue, "Cola de trabajos", "pg-boss · PostgreSQL", "Jobs de transcripción y estructuración en background")
  }

  ContainerDb(db, "Base de datos", "PostgreSQL 17", "Usuarios, sesiones, proyectos, carpetas, recursos y jobs")
  Container(minio, "Almacenamiento", "MinIO · S3", "Archivos, avatares y objetos Markdown")
  System_Ext(whisper, "Whisper ASR", "faster-whisper", "Transcripción de audio")
  System_Ext(llm, "Proveedor LLM", "AWS Bedrock / OpenCode Go / OpenAI-compatible", "Modelo de lenguaje configurable")

  Rel(visitante, frontend, "Consulta", "HTTPS")
  Rel(usuario, frontend, "Usa", "HTTPS")
  Rel(frontend, backend, "Reescribe /api/*", "HTTP")
  Rel(backend, db, "Lee y escribe", "SQL · Prisma")
  Rel(backend, minio, "Sube, lee y borra objetos", "S3")
  Rel(backend, queue, "Encola jobs", "SQL")
  Rel(queue, backend, "Worker procesa", "SQL")
  Rel(backend, whisper, "Envía audio", "HTTP")
  Rel(backend, agents, "HTTP interno", "Bearer token")
  Rel(agents, minio, "GET presignado", "HTTP")
  Rel(agents, llm, "Prompts", "HTTPS")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## Nivel 3 · Componentes del backend

```mermaid
C4Component
  title Backend NestJS · Componentes

  Container_Boundary(api, "Backend NestJS") {
    Component(auth, "Auth", "NestJS", "Registro, login, logout y sesiones")
    Component(users, "Users", "NestJS", "Perfil, avatar, búsqueda y archivado")
    Component(projects, "Projects", "NestJS", "CRUD de proyectos y carpeta raíz")
    Component(folders, "Folders", "NestJS", "Árbol de carpetas, movimiento y cascada")
    Component(resources, "Resources", "NestJS", "Archivos, avisos, apuntes y contenido")
    Component(members, "Members", "NestJS", "Participantes y roles")
    Component(permissions, "Permissions", "NestJS", "Resolución del rol efectivo")
    Component(transcriptions, "Transcriptions", "NestJS", "Jobs ASR, worker y guardado como apunte")
    Component(noteStructure, "NoteStructure", "NestJS", "Jobs de estructuración y cliente de agentes")
    Component(dashboard, "Dashboard", "NestJS", "Agregado de proyectos por categoría")
    Component(storage, "Storage", "S3 SDK", "Adaptador de MinIO")
    Component(prisma, "Prisma", "Prisma 7", "Acceso a PostgreSQL")
  }

  ContainerDb(db, "PostgreSQL 17", "PostgreSQL", "Datos relacionales")
  Container(minio, "MinIO", "S3", "Objetos")
  Container(agents, "Agents", "FastAPI · LangGraph", "Grafo de agentes")
  System_Ext(whisper, "Whisper ASR", "HTTP", "Transcripción")
  Container(queue, "pg-boss", "PostgreSQL", "Cola de jobs")

  Rel(auth, prisma, "Usa", "Prisma")
  Rel(users, prisma, "Usa", "Prisma")
  Rel(projects, prisma, "Usa", "Prisma")
  Rel(folders, prisma, "Usa", "Prisma")
  Rel(resources, prisma, "Usa", "Prisma")
  Rel(resources, storage, "Sube y lee", "S3")
  Rel(members, permissions, "Resuelve rol", "interno")
  Rel(permissions, prisma, "Consulta membresías", "Prisma")
  Rel(transcriptions, queue, "Encola", "SQL")
  Rel(transcriptions, storage, "Descarga audio", "S3")
  Rel(transcriptions, whisper, "Transcribe", "HTTP")
  Rel(transcriptions, resources, "Guarda apunte", "interno")
  Rel(noteStructure, prisma, "Lee y escribe jobs", "Prisma")
  Rel(noteStructure, agents, "Solicita estructuración", "HTTP interno")
  Rel(dashboard, prisma, "Consulta", "Prisma")
  Rel(prisma, db, "Lee y escribe", "SQL")
  Rel(storage, minio, "Objetos", "S3")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## Nivel 3 · Componentes del servicio de agentes

```mermaid
C4Component
  title Agents FastAPI · Componentes

  Container_Boundary(agents, "infinipaper-agents") {
    Component(api, "API", "FastAPI", "Endpoint /v1/notes/structure y autenticación")
    Component(graph, "Graph", "LangGraph", "Orquesta el flujo de agentes")
    Component(extractor, "MarkdownExtractor", "Python", "Descarga presignada y extrae el Markdown")
    Component(planner, "OutlinePlanner", "LLM", "Propone el esquema de secciones")
    Component(structurer, "NoteStructurer", "LLM", "Genera el Markdown estructurado")
    Component(validator, "Validator", "Python", "Valida estructura, enlaces y cobertura")
  }

  Container(minio, "MinIO", "S3", "Objetos")
  System_Ext(llm, "Proveedor LLM", "AWS Bedrock / OpenCode Go / OpenAI-compatible", "Modelo de lenguaje")

  Rel(api, graph, "Invoca", "interno")
  Rel(graph, extractor, "route_sources → markdown", "interno")
  Rel(graph, planner, "plan_outline", "interno")
  Rel(graph, structurer, "structure_note", "interno")
  Rel(graph, validator, "validate", "interno")
  Rel(extractor, minio, "GET presignado", "HTTP")
  Rel(planner, llm, "Prompt", "HTTPS")
  Rel(structurer, llm, "Prompt", "HTTPS")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## Decisiones representadas

| Vista | Decisión |
|---|---|
| Contexto | El sistema no se integra con servicios de terceros más allá de MinIO y Whisper |
| Contenedores | Un único backend NestJS; sin microservicios |
| Contenedores | La cola vive en PostgreSQL (`pg-boss`), sin Redis |
| Componentes | `PermissionsService` centraliza la autorización |
| Componentes | `ResourcesService` reutiliza MinIO para archivos, avisos y apuntes |
| Componentes | Las transcripciones reutilizan `ResourcesService` para guardar el apunte |
| Componentes | `NoteStructure` delega la estructuración en el servicio de agentes |
| Agentes | LangGraph orquesta router, extractor, planner, structurer y validator |
| Agentes | v1 solo procesa Markdown; el contrato admite múltiples fuentes |
