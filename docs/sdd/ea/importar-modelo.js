// ARCHIVO GENERADO POR docs/sdd/ea/generar.mjs
// No editar a mano. Modifica modelo.json y vuelve a ejecutar el generador.
// Ejecutar en Enterprise Architect: Develop > Scripting > crear script JScript.
// El script crea el paquete raíz "Infinipaper SDD" y aborta si ya existe.

var MODEL = {
  "rootPackage": "Infinipaper SDD",
  "diagramPackages": {
    "useCases": "01 · Casos de uso",
    "packages": "02 · Paquetes",
    "c4": "03 · Arquitectura C4",
    "sequences": "04 · Secuencias",
    "classes": "05 · Clases"
  },
  "actors": [
    {
      "name": "Visitante",
      "notes": "Usuario no autenticado. Solo accede a proyectos públicos y a registro/login."
    },
    {
      "name": "Usuario",
      "notes": "Usuario autenticado. Puede crear proyectos y consultar su dashboard."
    },
    {
      "name": "Owner",
      "notes": "Propietario del proyecto. Control total y gestión de participantes."
    },
    {
      "name": "Editor",
      "notes": "Participante con permiso de escritura sobre el contenido del proyecto."
    },
    {
      "name": "Viewer",
      "notes": "Participante con permiso de solo lectura."
    },
    {
      "name": "Whisper ASR",
      "notes": "Sistema externo de reconocimiento automático del habla."
    },
    {
      "name": "MinIO",
      "notes": "Sistema externo de almacenamiento de objetos compatible con S3."
    },
    {
      "name": "LLM",
      "notes": "Proveedor de modelo de lenguaje configurable usado por el servicio de agentes."
    },
    {
      "name": "Administrador",
      "notes": "Rol global ADMIN. Revisa verificaciones docentes, revoca docentes y puede ejecutar purgas."
    },
    {
      "name": "Docente",
      "notes": "Rol global TEACHER verificado. Crea cursos, cuestionarios y tareas."
    },
    {
      "name": "Estudiante",
      "notes": "Rol global STUDENT. Consulta cursos, responde tareas y ve solo sus resultados."
    },
    {
      "name": "Mailpit",
      "notes": "Sistema SMTP de desarrollo que captura los correos de confirmación y verificación."
    },
    {
      "name": "Cliente MCP",
      "notes": "Cliente externo compatible con MCP autorizado con token de solo lectura."
    }
  ],
  "useCases": [
    {
      "id": "UC-01",
      "name": "Gestión de usuarios",
      "spec": "001",
      "actors": [
        "Visitante",
        "Usuario"
      ],
      "notes": "Registro, login, logout, perfil, avatar, cambio de contraseña y archivado de cuenta."
    },
    {
      "id": "UC-02",
      "name": "Gestión de proyectos",
      "spec": "002",
      "actors": [
        "Visitante",
        "Usuario",
        "Owner",
        "Viewer"
      ],
      "notes": "Crear, listar, ver, editar y eliminar proyectos; proyectos públicos y carpeta raíz."
    },
    {
      "id": "UC-03",
      "name": "Gestión de carpetas",
      "spec": "003",
      "actors": [
        "Owner",
        "Editor",
        "Viewer"
      ],
      "notes": "Árbol de carpetas, creación, renombrado, movimiento, borrado en cascada y orden."
    },
    {
      "id": "UC-04",
      "name": "Aviso en carpeta",
      "spec": "004",
      "actors": [
        "Owner",
        "Editor",
        "Viewer",
        "MinIO"
      ],
      "notes": "Aviso Markdown configurable, visible y renderizado al tope de la carpeta."
    },
    {
      "id": "UC-05",
      "name": "Gestión de archivos",
      "spec": "005",
      "actors": [
        "Owner",
        "Editor",
        "Viewer",
        "MinIO"
      ],
      "notes": "Subida, listado, descarga, renombrado y borrado de archivos con límite configurable."
    },
    {
      "id": "UC-06",
      "name": "Visualización multimedia",
      "spec": "006",
      "actors": [
        "Visitante",
        "Usuario",
        "Viewer",
        "MinIO"
      ],
      "notes": "Visores de imagen, PDF, audio, video y Markdown; descarga para ofimáticos."
    },
    {
      "id": "UC-07",
      "name": "Gestión de participantes",
      "spec": "007",
      "actors": [
        "Owner"
      ],
      "notes": "Buscar, añadir, listar y retirar participantes de un proyecto."
    },
    {
      "id": "UC-08",
      "name": "Gestión de permisos",
      "spec": "008",
      "actors": [
        "Owner",
        "Editor",
        "Viewer"
      ],
      "notes": "Roles Owner, Editor y Viewer; autorización en servidor y acceso público de lectura."
    },
    {
      "id": "UC-09",
      "name": "Gestión de apuntes",
      "spec": "009",
      "actors": [
        "Owner",
        "Editor",
        "Viewer",
        "MinIO"
      ],
      "notes": "Apuntes Markdown con MDXEditor, autoguardado, sanitización y permisos."
    },
    {
      "id": "UC-10",
      "name": "Transcripción de audio",
      "spec": "010",
      "actors": [
        "Usuario",
        "Owner",
        "Editor",
        "Whisper ASR"
      ],
      "notes": "Job asíncrono de transcripción, polling y guardado como apunte."
    },
    {
      "id": "UC-11",
      "name": "Dashboard personal",
      "spec": "011",
      "actors": [
        "Usuario",
        "Owner",
        "Editor",
        "Viewer"
      ],
      "notes": "Resumen de proyectos propios, participados y públicos en carruseles."
    },
    {
      "id": "UC-12",
      "name": "Estructuración de apuntes con IA",
      "spec": "012",
      "actors": [
        "Owner",
        "Editor",
        "LLM"
      ],
      "notes": "Job asíncrono que estructura un apunte Markdown con LangGraph y devuelve un nuevo apunte."
    },
    {
      "id": "UC-15",
      "name": "Perfil docente y verificación",
      "spec": "015",
      "actors": [
        "Usuario",
        "Docente",
        "Administrador",
        "Mailpit"
      ],
      "notes": "Confirmación de email, solicitud docente, verificación automática o manual, aprobación, rechazo y revocación con auditoría."
    },
    {
      "id": "UC-16",
      "name": "Proyectos académicos y archivado",
      "spec": "016",
      "actors": [
        "Docente",
        "Owner",
        "Editor",
        "Viewer",
        "Estudiante",
        "Administrador"
      ],
      "notes": "Cursos creados por docentes verificados, estudiantes en ProjectMember, archivado de 30 días, extensión, restauración y purga."
    },
    {
      "id": "UC-17",
      "name": "Cuestionarios como recursos",
      "spec": "017",
      "actors": [
        "Docente",
        "Owner",
        "Editor",
        "Viewer",
        "Estudiante",
        "MinIO"
      ],
      "notes": "Cuestionario como Resource(kind=QUIZ), preguntas MC/VF/corta, snapshot JSON, publicación y visibilidad solo para estudiantes asignados."
    },
    {
      "id": "UC-18",
      "name": "Tareas, intentos y revisión",
      "spec": "018",
      "actors": [
        "Docente",
        "Owner",
        "Editor",
        "Estudiante"
      ],
      "notes": "Asignación de quizzes, intentos, guardado de respuestas, autocorrección MC/VF, calificación manual de respuesta corta y publicación de resultados."
    },
    {
      "id": "UC-19",
      "name": "Panel docente y progreso",
      "spec": "019",
      "actors": [
        "Docente",
        "Owner",
        "Editor",
        "Estudiante"
      ],
      "notes": "Panel agregado por proyecto, riesgo, completitud, dificultad y exportación CSV; progreso personal del estudiante."
    },
    {
      "id": "UC-20",
      "name": "Trazabilidad y validación",
      "spec": "020",
      "actors": [
        "Docente",
        "Owner",
        "Editor",
        "Viewer",
        "Estudiante"
      ],
      "notes": "Origen, fuentes, validación docente, badges, filtros y auditoría."
    },
    {
      "id": "UC-21",
      "name": "Mapas mentales con IA",
      "spec": "021",
      "actors": [
        "Docente",
        "Owner",
        "Editor"
      ],
      "notes": "Job asíncrono desde apunte/carpeta/proyecto, JSON canónico y recurso MINDMAP."
    },
    {
      "id": "UC-22",
      "name": "Cuestionarios con IA",
      "spec": "022",
      "actors": [
        "Docente",
        "Owner",
        "Editor"
      ],
      "notes": "Job asíncrono que produce un QUIZ DRAFT con preguntas y fuentes para revisión humana."
    },
    {
      "id": "UC-23",
      "name": "Métricas de uso",
      "spec": "023",
      "actors": [
        "Docente",
        "Owner",
        "Editor"
      ],
      "notes": "Eventos de vista, descarga, búsqueda y uso en quiz; agregados por proyecto y CSV."
    },
    {
      "id": "UC-24",
      "name": "Búsqueda semántica",
      "spec": "024",
      "actors": [
        "Usuario",
        "Viewer",
        "Estudiante"
      ],
      "notes": "Chunks, embeddings pgvector, búsqueda híbrida, filtros y fallback léxico."
    },
    {
      "id": "UC-25",
      "name": "MCP de desempeño",
      "spec": "025",
      "actors": [
        "Docente",
        "Owner",
        "Editor",
        "Cliente MCP"
      ],
      "notes": "Tokens scoped, FastMCP de solo lectura, rate limit, revocación y auditoría."
    }
  ],
  "packageModel": {
    "name": "Sistema",
    "notes": "Vista de paquetes del sistema Infinipaper.",
    "children": [
      {
        "name": "infinipaper-frontend",
        "notes": "Aplicación Next.js 16 con App Router.",
        "children": [
          {
            "name": "app",
            "notes": "Rutas, layouts, panel, uso, búsqueda y MCP (specs 001–012 y 015–025)."
          },
          {
            "name": "components",
            "notes": "UI y dominio, incluidos quiz, mindmap, procedencia, uso y MCP (specs 002–012 y 015–025)."
          },
          {
            "name": "lib",
            "notes": "Cliente API, hooks, tipos y utilidades (specs 001–012 y 015–018)."
          }
        ]
      },
      {
        "name": "infinipaper-backend",
        "notes": "API NestJS 12 con Prisma 7.",
        "children": [
          {
            "name": "modules",
            "notes": "auth, users, projects, folders, resources, members, transcriptions, note-structure, dashboard, teacher, quizzes, quiz-assignments, analytics, provenance, content-generation, usage, search y mcp."
          },
          {
            "name": "common",
            "notes": "guards, permissions, email/SMTP, storage, prisma, config y errores."
          },
          {
            "name": "prisma",
            "notes": "Esquema, migraciones y cliente generado."
          }
        ]
      },
      {
        "name": "infinipaper-agents",
        "notes": "Servicio FastAPI + LangGraph para estructuración de apuntes.",
        "children": [
          {
            "name": "api",
            "notes": "Endpoints FastAPI y autenticación interna."
          },
          {
            "name": "graph",
            "notes": "Grafo LangGraph y nodos de extracción y estructuración."
          },
          {
            "name": "tools",
            "notes": "Descarga presignada y utilidades de Markdown."
          }
        ]
      },
      {
        "name": "Infraestructura",
        "notes": "Servicios externos y persistencia.",
        "children": [
          {
            "name": "PostgreSQL",
            "notes": "Base de datos relacional con extensión pgvector."
          },
          {
            "name": "MinIO",
            "notes": "Almacenamiento de objetos compatible con S3."
          },
          {
            "name": "Whisper ASR",
            "notes": "Servicio autoalojado de transcripción."
          },
          {
            "name": "pg-boss",
            "notes": "Cola de trabajos respaldada por PostgreSQL."
          },
          {
            "name": "LLM",
            "notes": "Proveedor de modelo de lenguaje: AWS Bedrock, OpenCode Go u OpenAI-compatible."
          },
          {
            "name": "Mailpit",
            "notes": "SMTP de desarrollo y bandeja de correo."
          }
        ]
      }
    ]
  },
  "packageDependencies": [
    {
      "from": "Sistema/infinipaper-frontend/app",
      "to": "Sistema/infinipaper-frontend/components",
      "label": "usa"
    },
    {
      "from": "Sistema/infinipaper-frontend/app",
      "to": "Sistema/infinipaper-frontend/lib",
      "label": "usa"
    },
    {
      "from": "Sistema/infinipaper-frontend/components",
      "to": "Sistema/infinipaper-frontend/lib",
      "label": "usa"
    },
    {
      "from": "Sistema/infinipaper-frontend/lib",
      "to": "Sistema/infinipaper-backend/modules",
      "label": "/api/v1 (rewrites)"
    },
    {
      "from": "Sistema/infinipaper-backend/modules",
      "to": "Sistema/infinipaper-backend/common",
      "label": "usa"
    },
    {
      "from": "Sistema/infinipaper-backend/modules",
      "to": "Sistema/infinipaper-backend/prisma",
      "label": "usa"
    },
    {
      "from": "Sistema/infinipaper-backend/prisma",
      "to": "Sistema/Infraestructura/PostgreSQL",
      "label": "SQL"
    },
    {
      "from": "Sistema/infinipaper-backend/modules",
      "to": "Sistema/Infraestructura/MinIO",
      "label": "S3"
    },
    {
      "from": "Sistema/infinipaper-backend/modules",
      "to": "Sistema/Infraestructura/Whisper ASR",
      "label": "HTTP"
    },
    {
      "from": "Sistema/infinipaper-backend/modules",
      "to": "Sistema/Infraestructura/pg-boss",
      "label": "jobs"
    },
    {
      "from": "Sistema/Infraestructura/pg-boss",
      "to": "Sistema/Infraestructura/PostgreSQL",
      "label": "persistencia"
    },
    {
      "from": "Sistema/infinipaper-backend/modules",
      "to": "Sistema/infinipaper-agents/api",
      "label": "HTTP interno"
    },
    {
      "from": "Sistema/infinipaper-agents/api",
      "to": "Sistema/infinipaper-agents/graph",
      "label": "invoca"
    },
    {
      "from": "Sistema/infinipaper-agents/graph",
      "to": "Sistema/infinipaper-agents/tools",
      "label": "usa"
    },
    {
      "from": "Sistema/infinipaper-agents/tools",
      "to": "Sistema/Infraestructura/MinIO",
      "label": "GET presignado"
    },
    {
      "from": "Sistema/infinipaper-agents/graph",
      "to": "Sistema/Infraestructura/LLM",
      "label": "prompts"
    },
    {
      "from": "Sistema/infinipaper-backend/common",
      "to": "Sistema/Infraestructura/Mailpit",
      "label": "SMTP"
    }
  ],
  "c4": {
    "context": {
      "name": "C4 · Contexto",
      "elements": [
        {
          "name": "Visitante",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Usuario no autenticado que consulta proyectos públicos."
        },
        {
          "name": "Usuario",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Estudiante o docente autenticado."
        },
        {
          "name": "Infinipaper",
          "type": "Component",
          "stereotype": "system",
          "notes": "Sistema de organización de material de estudio."
        },
        {
          "name": "PostgreSQL",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Base de datos relacional."
        },
        {
          "name": "MinIO",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Almacenamiento de objetos S3."
        },
        {
          "name": "Whisper ASR",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Reconocimiento automático del habla."
        },
        {
          "name": "LLM",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Proveedor de modelo de lenguaje."
        },
        {
          "name": "Administrador",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Rol global ADMIN."
        },
        {
          "name": "Docente",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Rol global TEACHER verificado."
        },
        {
          "name": "Estudiante",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Rol global STUDENT."
        },
        {
          "name": "SMTP / Mailpit",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Correo de confirmación y verificación."
        }
      ],
      "relationships": [
        {
          "from": "Visitante",
          "to": "Infinipaper",
          "label": "Consulta proyectos públicos",
          "notes": "HTTPS"
        },
        {
          "from": "Usuario",
          "to": "Infinipaper",
          "label": "Gestiona su material",
          "notes": "HTTPS"
        },
        {
          "from": "Infinipaper",
          "to": "PostgreSQL",
          "label": "Persiste datos",
          "notes": "SQL"
        },
        {
          "from": "Infinipaper",
          "to": "MinIO",
          "label": "Guarda y sirve objetos",
          "notes": "S3"
        },
        {
          "from": "Infinipaper",
          "to": "Whisper ASR",
          "label": "Transcribe audio",
          "notes": "HTTP"
        },
        {
          "from": "Infinipaper",
          "to": "LLM",
          "label": "Estructura apuntes",
          "notes": "HTTPS"
        },
        {
          "from": "Administrador",
          "to": "Infinipaper",
          "label": "Verifica docentes y purga",
          "notes": "HTTPS"
        },
        {
          "from": "Docente",
          "to": "Infinipaper",
          "label": "Crea cursos y evalúa",
          "notes": "HTTPS"
        },
        {
          "from": "Estudiante",
          "to": "Infinipaper",
          "label": "Responde tareas",
          "notes": "HTTPS"
        },
        {
          "from": "Infinipaper",
          "to": "SMTP / Mailpit",
          "label": "Envía correos",
          "notes": "SMTP"
        }
      ]
    },
    "containers": {
      "name": "C4 · Contenedores",
      "elements": [
        {
          "name": "Visitante",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Consulta proyectos públicos."
        },
        {
          "name": "Usuario",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Usa la aplicación."
        },
        {
          "name": "Frontend",
          "type": "Component",
          "stereotype": "container",
          "notes": "Next.js 16 · React 19. UI y proxy /api/*."
        },
        {
          "name": "Backend",
          "type": "Component",
          "stereotype": "container",
          "notes": "NestJS 12 · Prisma 7. API REST y lógica de negocio."
        },
        {
          "name": "PostgreSQL",
          "type": "Component",
          "stereotype": "container_db",
          "notes": "PostgreSQL 17. Datos relacionales."
        },
        {
          "name": "MinIO",
          "type": "Component",
          "stereotype": "container",
          "notes": "Almacenamiento de archivos y avatares."
        },
        {
          "name": "Whisper ASR",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "faster-whisper."
        },
        {
          "name": "LLM",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Proveedor AWS Bedrock / OpenCode Go / OpenAI-compatible."
        },
        {
          "name": "Agents",
          "type": "Component",
          "stereotype": "container",
          "notes": "FastAPI + LangGraph. Grafo de agentes."
        },
        {
          "name": "pg-boss",
          "type": "Component",
          "stereotype": "container",
          "notes": "Cola de trabajos sobre PostgreSQL."
        },
        {
          "name": "Administrador",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Rol global ADMIN."
        },
        {
          "name": "Docente",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Rol global TEACHER verificado."
        },
        {
          "name": "Estudiante",
          "type": "Actor",
          "stereotype": "person",
          "notes": "Rol global STUDENT."
        },
        {
          "name": "SMTP / Mailpit",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Correo de confirmación y verificación."
        }
      ],
      "relationships": [
        {
          "from": "Visitante",
          "to": "Frontend",
          "label": "Consulta",
          "notes": "HTTPS"
        },
        {
          "from": "Usuario",
          "to": "Frontend",
          "label": "Usa",
          "notes": "HTTPS"
        },
        {
          "from": "Frontend",
          "to": "Backend",
          "label": "Reescribe /api/*",
          "notes": "HTTP"
        },
        {
          "from": "Backend",
          "to": "PostgreSQL",
          "label": "Lee y escribe",
          "notes": "SQL · Prisma"
        },
        {
          "from": "Backend",
          "to": "MinIO",
          "label": "Objetos",
          "notes": "S3"
        },
        {
          "from": "Backend",
          "to": "pg-boss",
          "label": "Encola jobs",
          "notes": "SQL"
        },
        {
          "from": "pg-boss",
          "to": "Backend",
          "label": "Worker",
          "notes": "SQL"
        },
        {
          "from": "Backend",
          "to": "Whisper ASR",
          "label": "Audio",
          "notes": "HTTP"
        },
        {
          "from": "Backend",
          "to": "Agents",
          "label": "Estructura apuntes",
          "notes": "HTTP interno"
        },
        {
          "from": "Agents",
          "to": "MinIO",
          "label": "GET presignado",
          "notes": "HTTP"
        },
        {
          "from": "Agents",
          "to": "LLM",
          "label": "Prompts",
          "notes": "HTTPS"
        },
        {
          "from": "Administrador",
          "to": "Frontend",
          "label": "Administra",
          "notes": "HTTPS"
        },
        {
          "from": "Docente",
          "to": "Frontend",
          "label": "Crea y evalúa",
          "notes": "HTTPS"
        },
        {
          "from": "Estudiante",
          "to": "Frontend",
          "label": "Responde",
          "notes": "HTTPS"
        },
        {
          "from": "Backend",
          "to": "SMTP / Mailpit",
          "label": "Envía correos",
          "notes": "SMTP"
        }
      ]
    },
    "components": {
      "name": "C4 · Componentes del backend",
      "elements": [
        {
          "name": "Auth",
          "type": "Component",
          "stereotype": "component",
          "notes": "Registro, login, logout y sesiones."
        },
        {
          "name": "Users",
          "type": "Component",
          "stereotype": "component",
          "notes": "Perfil, avatar, búsqueda y archivado."
        },
        {
          "name": "Projects",
          "type": "Component",
          "stereotype": "component",
          "notes": "CRUD de proyectos y carpeta raíz."
        },
        {
          "name": "Folders",
          "type": "Component",
          "stereotype": "component",
          "notes": "Árbol, movimiento y borrado en cascada."
        },
        {
          "name": "Resources",
          "type": "Component",
          "stereotype": "component",
          "notes": "Archivos, avisos, apuntes y contenido."
        },
        {
          "name": "Members",
          "type": "Component",
          "stereotype": "component",
          "notes": "Participantes y roles."
        },
        {
          "name": "Permissions",
          "type": "Component",
          "stereotype": "component",
          "notes": "Resolución del rol efectivo."
        },
        {
          "name": "Transcriptions",
          "type": "Component",
          "stereotype": "component",
          "notes": "Jobs ASR, worker y guardado como apunte."
        },
        {
          "name": "NoteStructure",
          "type": "Component",
          "stereotype": "component",
          "notes": "Jobs de estructuración y cliente de agentes."
        },
        {
          "name": "Dashboard",
          "type": "Component",
          "stereotype": "component",
          "notes": "Agregado de proyectos por categoría."
        },
        {
          "name": "Storage",
          "type": "Component",
          "stereotype": "component",
          "notes": "Adaptador de MinIO."
        },
        {
          "name": "Prisma",
          "type": "Component",
          "stereotype": "component",
          "notes": "Acceso a PostgreSQL."
        },
        {
          "name": "Agents",
          "type": "Component",
          "stereotype": "container",
          "notes": "FastAPI + LangGraph."
        },
        {
          "name": "LLM",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Proveedor AWS Bedrock / OpenCode Go / OpenAI-compatible."
        },
        {
          "name": "PostgreSQL",
          "type": "Component",
          "stereotype": "container_db",
          "notes": "PostgreSQL 17."
        },
        {
          "name": "MinIO",
          "type": "Component",
          "stereotype": "container",
          "notes": "Almacenamiento S3."
        },
        {
          "name": "Whisper ASR",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Transcripción."
        },
        {
          "name": "pg-boss",
          "type": "Component",
          "stereotype": "container",
          "notes": "Cola de trabajos."
        },
        {
          "name": "Email",
          "type": "Component",
          "stereotype": "component",
          "notes": "Envío SMTP con Nodemailer."
        },
        {
          "name": "Teacher",
          "type": "Component",
          "stereotype": "component",
          "notes": "Verificación docente y auditoría."
        },
        {
          "name": "Quizzes",
          "type": "Component",
          "stereotype": "component",
          "notes": "Cuestionarios, preguntas y snapshots."
        },
        {
          "name": "QuizAssignments",
          "type": "Component",
          "stereotype": "component",
          "notes": "Tareas, intentos, calificación y resultados."
        },
        {
          "name": "SMTP / Mailpit",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Correo de desarrollo."
        },
        {
          "name": "Analytics",
          "type": "Component",
          "stereotype": "component",
          "notes": "Panel docente y progreso personal."
        },
        {
          "name": "Provenance",
          "type": "Component",
          "stereotype": "component",
          "notes": "Origen, fuentes y validación."
        },
        {
          "name": "ContentGeneration",
          "type": "Component",
          "stereotype": "component",
          "notes": "Jobs de mapas mentales y quiz IA."
        },
        {
          "name": "Usage",
          "type": "Component",
          "stereotype": "component",
          "notes": "Eventos y agregados de uso."
        },
        {
          "name": "Search",
          "type": "Component",
          "stereotype": "component",
          "notes": "Chunks, embeddings y búsqueda híbrida."
        },
        {
          "name": "MCP",
          "type": "Component",
          "stereotype": "component",
          "notes": "Tokens y API de solo lectura."
        },
        {
          "name": "Embeddings",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Proveedor local u OpenAI-compatible."
        },
        {
          "name": "FastMCP",
          "type": "Component",
          "stereotype": "component",
          "notes": "Servidor MCP en agentes."
        }
      ],
      "relationships": [
        {
          "from": "Auth",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Users",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Projects",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Folders",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Resources",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Resources",
          "to": "Storage",
          "label": "Sube y lee"
        },
        {
          "from": "Members",
          "to": "Permissions",
          "label": "Resuelve rol"
        },
        {
          "from": "Permissions",
          "to": "Prisma",
          "label": "Consulta membresías"
        },
        {
          "from": "Transcriptions",
          "to": "pg-boss",
          "label": "Encola"
        },
        {
          "from": "Transcriptions",
          "to": "Storage",
          "label": "Descarga audio"
        },
        {
          "from": "Transcriptions",
          "to": "Whisper ASR",
          "label": "Transcribe"
        },
        {
          "from": "Transcriptions",
          "to": "Resources",
          "label": "Guarda apunte"
        },
        {
          "from": "NoteStructure",
          "to": "Prisma",
          "label": "Lee y escribe jobs"
        },
        {
          "from": "NoteStructure",
          "to": "Agents",
          "label": "Solicita estructuración"
        },
        {
          "from": "Agents",
          "to": "LLM",
          "label": "Prompts"
        },
        {
          "from": "Dashboard",
          "to": "Prisma",
          "label": "Consulta"
        },
        {
          "from": "Prisma",
          "to": "PostgreSQL",
          "label": "SQL"
        },
        {
          "from": "Storage",
          "to": "MinIO",
          "label": "S3"
        },
        {
          "from": "Auth",
          "to": "Email",
          "label": "Solicita correo"
        },
        {
          "from": "Teacher",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Teacher",
          "to": "Email",
          "label": "Notifica"
        },
        {
          "from": "Quizzes",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Quizzes",
          "to": "Storage",
          "label": "Snapshot"
        },
        {
          "from": "QuizAssignments",
          "to": "Prisma",
          "label": "Usa"
        },
        {
          "from": "Projects",
          "to": "pg-boss",
          "label": "Programa purga"
        },
        {
          "from": "Email",
          "to": "SMTP / Mailpit",
          "label": "SMTP"
        },
        {
          "from": "Analytics",
          "to": "Prisma",
          "label": "Agrega"
        },
        {
          "from": "Analytics",
          "to": "Permissions",
          "label": "Autoriza"
        },
        {
          "from": "Provenance",
          "to": "Prisma",
          "label": "Valida"
        },
        {
          "from": "Provenance",
          "to": "Permissions",
          "label": "Autoriza"
        },
        {
          "from": "ContentGeneration",
          "to": "Prisma",
          "label": "Jobs"
        },
        {
          "from": "ContentGeneration",
          "to": "pg-boss",
          "label": "Encola"
        },
        {
          "from": "ContentGeneration",
          "to": "Agents",
          "label": "Genera"
        },
        {
          "from": "ContentGeneration",
          "to": "Resources",
          "label": "Guarda"
        },
        {
          "from": "Usage",
          "to": "Prisma",
          "label": "Eventos"
        },
        {
          "from": "Search",
          "to": "Prisma",
          "label": "Chunks"
        },
        {
          "from": "Search",
          "to": "Embeddings",
          "label": "Embeddings"
        },
        {
          "from": "Search",
          "to": "Usage",
          "label": "SEARCH_HIT"
        },
        {
          "from": "MCP",
          "to": "Prisma",
          "label": "Tokens"
        },
        {
          "from": "Agents",
          "to": "FastMCP",
          "label": "Expone"
        },
        {
          "from": "FastMCP",
          "to": "MCP",
          "label": "API interna"
        }
      ]
    },
    "agents": {
      "name": "C4 · Componentes de agentes",
      "elements": [
        {
          "name": "Agents API",
          "type": "Component",
          "stereotype": "component",
          "notes": "Endpoint FastAPI y autenticación interna."
        },
        {
          "name": "LangGraph",
          "type": "Component",
          "stereotype": "component",
          "notes": "Orquesta router, extracción, estructuración y validación."
        },
        {
          "name": "MarkdownExtractor",
          "type": "Component",
          "stereotype": "component",
          "notes": "Descarga presignada y extrae el Markdown."
        },
        {
          "name": "OutlinePlanner",
          "type": "Component",
          "stereotype": "component",
          "notes": "Propone el esquema de secciones."
        },
        {
          "name": "NoteStructurer",
          "type": "Component",
          "stereotype": "component",
          "notes": "Genera el Markdown estructurado."
        },
        {
          "name": "Validator",
          "type": "Component",
          "stereotype": "component",
          "notes": "Valida estructura, enlaces y cobertura."
        },
        {
          "name": "LLM",
          "type": "Component",
          "stereotype": "external_system",
          "notes": "Proveedor AWS Bedrock / OpenCode Go / OpenAI-compatible."
        },
        {
          "name": "MinIO",
          "type": "Component",
          "stereotype": "container",
          "notes": "Almacenamiento S3."
        }
      ],
      "relationships": [
        {
          "from": "Agents API",
          "to": "LangGraph",
          "label": "Invoca"
        },
        {
          "from": "LangGraph",
          "to": "MarkdownExtractor",
          "label": "route_sources"
        },
        {
          "from": "LangGraph",
          "to": "OutlinePlanner",
          "label": "plan_outline"
        },
        {
          "from": "LangGraph",
          "to": "NoteStructurer",
          "label": "structure_note"
        },
        {
          "from": "LangGraph",
          "to": "Validator",
          "label": "validate"
        },
        {
          "from": "MarkdownExtractor",
          "to": "MinIO",
          "label": "GET presignado"
        },
        {
          "from": "OutlinePlanner",
          "to": "LLM",
          "label": "Prompt"
        },
        {
          "from": "NoteStructurer",
          "to": "LLM",
          "label": "Prompt"
        }
      ]
    }
  },
  "classModel": {
    "name": "Clases · Modelo de dominio",
    "classes": [
      {
        "name": "User",
        "stereotype": "entity",
        "notes": "avatarUrl, bio y emailVerifiedAt son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "username",
            "type": "String"
          },
          {
            "name": "email",
            "type": "String"
          },
          {
            "name": "passwordHash",
            "type": "String"
          },
          {
            "name": "displayName",
            "type": "String"
          },
          {
            "name": "avatarUrl",
            "type": "String"
          },
          {
            "name": "bio",
            "type": "String"
          },
          {
            "name": "role",
            "type": "GlobalRole"
          },
          {
            "name": "emailVerifiedAt",
            "type": "DateTime"
          },
          {
            "name": "status",
            "type": "UserStatus"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "Session",
        "stereotype": "entity",
        "notes": "tokenHash guarda el SHA-256 del token.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "userId",
            "type": "String"
          },
          {
            "name": "tokenHash",
            "type": "String"
          },
          {
            "name": "expiresAt",
            "type": "DateTime"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "Project",
        "stereotype": "entity",
        "notes": "description, institution, period, subject, code, archivedAt y archiveAccessUntil son opcionales. ownerId es la fuente del rol Owner.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "ownerId",
            "type": "String"
          },
          {
            "name": "name",
            "type": "String"
          },
          {
            "name": "description",
            "type": "String"
          },
          {
            "name": "visibility",
            "type": "ProjectVisibility"
          },
          {
            "name": "type",
            "type": "ProjectType"
          },
          {
            "name": "status",
            "type": "ProjectStatus"
          },
          {
            "name": "institution",
            "type": "String"
          },
          {
            "name": "period",
            "type": "String"
          },
          {
            "name": "subject",
            "type": "String"
          },
          {
            "name": "code",
            "type": "String"
          },
          {
            "name": "archivedAt",
            "type": "DateTime"
          },
          {
            "name": "archiveAccessUntil",
            "type": "DateTime"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "ProjectMember",
        "stereotype": "entity",
        "notes": "role admite EDITOR, VIEWER o STUDENT; el Owner no se guarda aquí.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "projectId",
            "type": "String"
          },
          {
            "name": "userId",
            "type": "String"
          },
          {
            "name": "role",
            "type": "ProjectRole"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "Folder",
        "stereotype": "entity",
        "notes": "parentId es opcional; la raíz tiene isRoot=true.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "projectId",
            "type": "String"
          },
          {
            "name": "parentId",
            "type": "String"
          },
          {
            "name": "name",
            "type": "String"
          },
          {
            "name": "isRoot",
            "type": "Boolean"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "Resource",
        "stereotype": "entity",
        "notes": "checksum es opcional; s3Key es único. Representa archivos, avisos, apuntes y cuestionarios.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "folderId",
            "type": "String"
          },
          {
            "name": "authorId",
            "type": "String"
          },
          {
            "name": "name",
            "type": "String"
          },
          {
            "name": "kind",
            "type": "ResourceKind"
          },
          {
            "name": "origin",
            "type": "ResourceOrigin"
          },
          {
            "name": "validationStatus",
            "type": "ValidationStatus"
          },
          {
            "name": "validatedById",
            "type": "String"
          },
          {
            "name": "validatedAt",
            "type": "DateTime"
          },
          {
            "name": "validationNote",
            "type": "String"
          },
          {
            "name": "mimeType",
            "type": "String"
          },
          {
            "name": "size",
            "type": "Int"
          },
          {
            "name": "s3Key",
            "type": "String"
          },
          {
            "name": "checksum",
            "type": "String"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "TranscriptionJob",
        "stereotype": "entity",
        "notes": "text y error son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "resourceId",
            "type": "String"
          },
          {
            "name": "requestedById",
            "type": "String"
          },
          {
            "name": "status",
            "type": "TranscriptionStatus"
          },
          {
            "name": "language",
            "type": "String"
          },
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "error",
            "type": "String"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "NoteStructureJob",
        "stereotype": "entity",
        "notes": "resultMarkdown, outline, warnings, error y usage son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "resourceId",
            "type": "String"
          },
          {
            "name": "requestedById",
            "type": "String"
          },
          {
            "name": "status",
            "type": "AgentJobStatus"
          },
          {
            "name": "language",
            "type": "String"
          },
          {
            "name": "instructions",
            "type": "String"
          },
          {
            "name": "sourceChecksum",
            "type": "String"
          },
          {
            "name": "resultMarkdown",
            "type": "String"
          },
          {
            "name": "resultResourceId",
            "type": "String"
          },
          {
            "name": "outline",
            "type": "Json"
          },
          {
            "name": "warnings",
            "type": "Json"
          },
          {
            "name": "error",
            "type": "String"
          },
          {
            "name": "model",
            "type": "String"
          },
          {
            "name": "promptVersion",
            "type": "String"
          },
          {
            "name": "inputTokens",
            "type": "Int"
          },
          {
            "name": "outputTokens",
            "type": "Int"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "EmailVerificationToken",
        "stereotype": "entity",
        "notes": "usedAt es opcional; tokenHash es único.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "userId",
            "type": "String"
          },
          {
            "name": "tokenHash",
            "type": "String"
          },
          {
            "name": "expiresAt",
            "type": "DateTime"
          },
          {
            "name": "usedAt",
            "type": "DateTime"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "TeacherProfile",
        "stereotype": "entity",
        "notes": "reviewerId, reviewedAt, rejectionReason y campos académicos son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "userId",
            "type": "String"
          },
          {
            "name": "status",
            "type": "TeacherStatus"
          },
          {
            "name": "method",
            "type": "TeacherVerificationMethod"
          },
          {
            "name": "institution",
            "type": "String"
          },
          {
            "name": "area",
            "type": "String"
          },
          {
            "name": "position",
            "type": "String"
          },
          {
            "name": "evidenceUrl",
            "type": "String"
          },
          {
            "name": "reviewerId",
            "type": "String"
          },
          {
            "name": "reviewedAt",
            "type": "DateTime"
          },
          {
            "name": "rejectionReason",
            "type": "String"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "AuditEvent",
        "stereotype": "entity",
        "notes": "actorId, entityId y metadata son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "actorId",
            "type": "String"
          },
          {
            "name": "action",
            "type": "String"
          },
          {
            "name": "entityType",
            "type": "String"
          },
          {
            "name": "entityId",
            "type": "String"
          },
          {
            "name": "metadata",
            "type": "Json"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "Quiz",
        "stereotype": "entity",
        "notes": "instructions y settings son opcionales; el snapshot JSON vive en MinIO.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "resourceId",
            "type": "String"
          },
          {
            "name": "title",
            "type": "String"
          },
          {
            "name": "instructions",
            "type": "String"
          },
          {
            "name": "status",
            "type": "QuizStatus"
          },
          {
            "name": "settings",
            "type": "Json"
          },
          {
            "name": "createdById",
            "type": "String"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "QuizQuestion",
        "stereotype": "entity",
        "notes": "correctText es opcional; las opciones solo aplican a MC/VF.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "quizId",
            "type": "String"
          },
          {
            "name": "type",
            "type": "QuizQuestionType"
          },
          {
            "name": "prompt",
            "type": "String"
          },
          {
            "name": "points",
            "type": "Int"
          },
          {
            "name": "order",
            "type": "Int"
          },
          {
            "name": "correctText",
            "type": "String"
          },
          {
            "name": "caseSensitive",
            "type": "Boolean"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "QuizOption",
        "stereotype": "entity",
        "notes": "isCorrect solo aplica a MC/VF.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "questionId",
            "type": "String"
          },
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "isCorrect",
            "type": "Boolean"
          },
          {
            "name": "order",
            "type": "Int"
          }
        ]
      },
      {
        "name": "QuizAssignment",
        "stereotype": "entity",
        "notes": "startsAt, dueAt y resultsPublishedAt son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "quizId",
            "type": "String"
          },
          {
            "name": "projectId",
            "type": "String"
          },
          {
            "name": "createdById",
            "type": "String"
          },
          {
            "name": "startsAt",
            "type": "DateTime"
          },
          {
            "name": "dueAt",
            "type": "DateTime"
          },
          {
            "name": "attemptsAllowed",
            "type": "Int"
          },
          {
            "name": "status",
            "type": "QuizAssignmentStatus"
          },
          {
            "name": "resultsPublishedAt",
            "type": "DateTime"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "QuizAssignmentStudent",
        "stereotype": "entity",
        "notes": "Tabla puente entre tarea y estudiantes asignados.",
        "attributes": [
          {
            "name": "assignmentId",
            "type": "String"
          },
          {
            "name": "studentId",
            "type": "String"
          }
        ]
      },
      {
        "name": "QuizAttempt",
        "stereotype": "entity",
        "notes": "submittedAt y gradedAt son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "assignmentId",
            "type": "String"
          },
          {
            "name": "studentId",
            "type": "String"
          },
          {
            "name": "attemptNumber",
            "type": "Int"
          },
          {
            "name": "status",
            "type": "QuizAttemptStatus"
          },
          {
            "name": "score",
            "type": "Float"
          },
          {
            "name": "maxScore",
            "type": "Float"
          },
          {
            "name": "startedAt",
            "type": "DateTime"
          },
          {
            "name": "submittedAt",
            "type": "DateTime"
          },
          {
            "name": "gradedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "QuizAnswer",
        "stereotype": "entity",
        "notes": "optionId, text, isCorrect, pointsAwarded y feedback son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "attemptId",
            "type": "String"
          },
          {
            "name": "questionId",
            "type": "String"
          },
          {
            "name": "optionId",
            "type": "String"
          },
          {
            "name": "text",
            "type": "String"
          },
          {
            "name": "isCorrect",
            "type": "Boolean"
          },
          {
            "name": "pointsAwarded",
            "type": "Float"
          },
          {
            "name": "feedback",
            "type": "String"
          }
        ]
      },
      {
        "name": "ResourceSource",
        "stereotype": "entity",
        "notes": "sourceResourceId se vuelve null si la fuente se elimina.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "resourceId",
            "type": "String"
          },
          {
            "name": "sourceResourceId",
            "type": "String"
          },
          {
            "name": "relation",
            "type": "ResourceSourceRelation"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "ContentGenerationJob",
        "stereotype": "entity",
        "notes": "sources, config, resultJson, warnings y usage son opcionales.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "type",
            "type": "ContentGenerationType"
          },
          {
            "name": "folderId",
            "type": "String"
          },
          {
            "name": "requestedById",
            "type": "String"
          },
          {
            "name": "status",
            "type": "AgentJobStatus"
          },
          {
            "name": "sources",
            "type": "Json"
          },
          {
            "name": "config",
            "type": "Json"
          },
          {
            "name": "resultJson",
            "type": "Json"
          },
          {
            "name": "resultResourceId",
            "type": "String"
          },
          {
            "name": "warnings",
            "type": "Json"
          },
          {
            "name": "error",
            "type": "String"
          },
          {
            "name": "model",
            "type": "String"
          },
          {
            "name": "promptVersion",
            "type": "String"
          },
          {
            "name": "inputTokens",
            "type": "Int"
          },
          {
            "name": "outputTokens",
            "type": "Int"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "ResourceEvent",
        "stereotype": "entity",
        "notes": "resourceId y userId pueden quedar null si se elimina el recurso o usuario.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "projectId",
            "type": "String"
          },
          {
            "name": "resourceId",
            "type": "String"
          },
          {
            "name": "userId",
            "type": "String"
          },
          {
            "name": "type",
            "type": "ResourceEventType"
          },
          {
            "name": "metadata",
            "type": "Json"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "ResourceChunk",
        "stereotype": "entity",
        "notes": "embedding es vector(1536); content no se usa en métricas.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "resourceId",
            "type": "String"
          },
          {
            "name": "chunkIndex",
            "type": "Int"
          },
          {
            "name": "content",
            "type": "String"
          },
          {
            "name": "embedding",
            "type": "Unsupported(\"vector(1536)\")"
          },
          {
            "name": "tokens",
            "type": "Int"
          },
          {
            "name": "metadata",
            "type": "Json"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "ContentIndexJob",
        "stereotype": "entity",
        "notes": "resourceId puede ser null para reindexar un proyecto completo.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "projectId",
            "type": "String"
          },
          {
            "name": "resourceId",
            "type": "String"
          },
          {
            "name": "status",
            "type": "AgentJobStatus"
          },
          {
            "name": "error",
            "type": "String"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          },
          {
            "name": "updatedAt",
            "type": "DateTime"
          }
        ]
      },
      {
        "name": "McpToken",
        "stereotype": "entity",
        "notes": "tokenHash es único; scopes y fechas son metadatos.",
        "attributes": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "ownerId",
            "type": "String"
          },
          {
            "name": "projectId",
            "type": "String"
          },
          {
            "name": "name",
            "type": "String"
          },
          {
            "name": "tokenHash",
            "type": "String"
          },
          {
            "name": "scopes",
            "type": "Json"
          },
          {
            "name": "expiresAt",
            "type": "DateTime"
          },
          {
            "name": "revokedAt",
            "type": "DateTime"
          },
          {
            "name": "lastUsedAt",
            "type": "DateTime"
          },
          {
            "name": "createdAt",
            "type": "DateTime"
          }
        ]
      }
    ],
    "enums": [
      {
        "name": "UserStatus",
        "values": [
          "ACTIVE",
          "ARCHIVED"
        ]
      },
      {
        "name": "ProjectVisibility",
        "values": [
          "PUBLIC",
          "PRIVATE"
        ]
      },
      {
        "name": "ProjectRole",
        "values": [
          "EDITOR",
          "VIEWER",
          "STUDENT"
        ]
      },
      {
        "name": "ResourceKind",
        "values": [
          "DOCUMENT",
          "IMAGE",
          "AUDIO",
          "VIDEO",
          "MARKDOWN",
          "QUIZ"
        ]
      },
      {
        "name": "TranscriptionStatus",
        "values": [
          "QUEUED",
          "PROCESSING",
          "DONE",
          "FAILED"
        ]
      },
      {
        "name": "AgentJobStatus",
        "values": [
          "QUEUED",
          "PROCESSING",
          "DONE",
          "FAILED"
        ]
      },
      {
        "name": "GlobalRole",
        "values": [
          "ADMIN",
          "TEACHER",
          "STUDENT"
        ]
      },
      {
        "name": "TeacherStatus",
        "values": [
          "PENDING",
          "VERIFIED",
          "REJECTED",
          "REVOKED"
        ]
      },
      {
        "name": "TeacherVerificationMethod",
        "values": [
          "INSTITUTIONAL_EMAIL",
          "MANUAL"
        ]
      },
      {
        "name": "ProjectType",
        "values": [
          "PERSONAL",
          "COURSE"
        ]
      },
      {
        "name": "ProjectStatus",
        "values": [
          "ACTIVE",
          "ARCHIVED"
        ]
      },
      {
        "name": "QuizStatus",
        "values": [
          "DRAFT",
          "PUBLISHED",
          "ARCHIVED"
        ]
      },
      {
        "name": "QuizQuestionType",
        "values": [
          "MULTIPLE_CHOICE",
          "TRUE_FALSE",
          "SHORT_ANSWER"
        ]
      },
      {
        "name": "QuizAssignmentStatus",
        "values": [
          "DRAFT",
          "PUBLISHED",
          "CLOSED"
        ]
      },
      {
        "name": "QuizAttemptStatus",
        "values": [
          "IN_PROGRESS",
          "SUBMITTED",
          "GRADED",
          "EXPIRED"
        ]
      },
      {
        "name": "ResourceOrigin",
        "values": [
          "UPLOAD",
          "NOTE",
          "TRANSCRIPTION",
          "AI_STRUCTURE",
          "AI_MINDMAP",
          "AI_QUIZ",
          "QUIZ",
          "IMPORT"
        ]
      },
      {
        "name": "ValidationStatus",
        "values": [
          "UNVERIFIED",
          "PENDING",
          "VERIFIED",
          "REJECTED"
        ]
      },
      {
        "name": "ResourceSourceRelation",
        "values": [
          "DERIVED_FROM",
          "CITES",
          "USES"
        ]
      },
      {
        "name": "ContentGenerationType",
        "values": [
          "MINDMAP",
          "QUIZ"
        ]
      },
      {
        "name": "ResourceEventType",
        "values": [
          "VIEW",
          "DOWNLOAD",
          "SEARCH_HIT",
          "QUIZ_USE"
        ]
      }
    ],
    "relations": [
      {
        "from": "User",
        "to": "Session",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "sessions"
      },
      {
        "from": "User",
        "to": "Project",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "owner"
      },
      {
        "from": "User",
        "to": "ProjectMember",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "memberships"
      },
      {
        "from": "User",
        "to": "Resource",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "author"
      },
      {
        "from": "User",
        "to": "TranscriptionJob",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "requestedBy"
      },
      {
        "from": "User",
        "to": "NoteStructureJob",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "requestedBy"
      },
      {
        "from": "Project",
        "to": "ProjectMember",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "members"
      },
      {
        "from": "Project",
        "to": "Folder",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "folders"
      },
      {
        "from": "Folder",
        "to": "Folder",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "parent / children"
      },
      {
        "from": "Folder",
        "to": "Resource",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "resources"
      },
      {
        "from": "Resource",
        "to": "TranscriptionJob",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "transcriptions"
      },
      {
        "from": "Resource",
        "to": "NoteStructureJob",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "structureJobs"
      },
      {
        "from": "NoteStructureJob",
        "to": "Resource",
        "type": "Association",
        "fromMultiplicity": "0..1",
        "toMultiplicity": "0..1",
        "label": "resultResource"
      },
      {
        "from": "User",
        "to": "UserStatus",
        "type": "Dependency",
        "label": "status"
      },
      {
        "from": "Project",
        "to": "ProjectVisibility",
        "type": "Dependency",
        "label": "visibility"
      },
      {
        "from": "ProjectMember",
        "to": "ProjectRole",
        "type": "Dependency",
        "label": "role"
      },
      {
        "from": "Resource",
        "to": "ResourceKind",
        "type": "Dependency",
        "label": "kind"
      },
      {
        "from": "TranscriptionJob",
        "to": "TranscriptionStatus",
        "type": "Dependency",
        "label": "status"
      },
      {
        "from": "NoteStructureJob",
        "to": "AgentJobStatus",
        "type": "Dependency",
        "label": "status"
      },
      {
        "from": "User",
        "to": "EmailVerificationToken",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "emailVerificationTokens"
      },
      {
        "from": "User",
        "to": "TeacherProfile",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..1",
        "label": "teacherProfile"
      },
      {
        "from": "User",
        "to": "AuditEvent",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "auditEvents"
      },
      {
        "from": "User",
        "to": "Quiz",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "createdQuizzes"
      },
      {
        "from": "User",
        "to": "QuizAssignment",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "createdQuizAssignments"
      },
      {
        "from": "User",
        "to": "QuizAssignmentStudent",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "quizAssignments"
      },
      {
        "from": "User",
        "to": "QuizAttempt",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "quizAttempts"
      },
      {
        "from": "Project",
        "to": "QuizAssignment",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "quizAssignments"
      },
      {
        "from": "Resource",
        "to": "Quiz",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..1",
        "label": "quiz"
      },
      {
        "from": "Quiz",
        "to": "QuizQuestion",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "questions"
      },
      {
        "from": "QuizQuestion",
        "to": "QuizOption",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "options"
      },
      {
        "from": "Quiz",
        "to": "QuizAssignment",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "assignments"
      },
      {
        "from": "QuizAssignment",
        "to": "QuizAssignmentStudent",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "students"
      },
      {
        "from": "QuizAssignment",
        "to": "QuizAttempt",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "attempts"
      },
      {
        "from": "QuizAttempt",
        "to": "QuizAnswer",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "answers"
      },
      {
        "from": "QuizQuestion",
        "to": "QuizAnswer",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "answers"
      },
      {
        "from": "QuizOption",
        "to": "QuizAnswer",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "selectedBy"
      },
      {
        "from": "User",
        "to": "GlobalRole",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "role"
      },
      {
        "from": "Project",
        "to": "ProjectType",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "type"
      },
      {
        "from": "Project",
        "to": "ProjectStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "status"
      },
      {
        "from": "TeacherProfile",
        "to": "TeacherStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "status"
      },
      {
        "from": "TeacherProfile",
        "to": "TeacherVerificationMethod",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "method"
      },
      {
        "from": "Quiz",
        "to": "QuizStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "status"
      },
      {
        "from": "QuizQuestion",
        "to": "QuizQuestionType",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "type"
      },
      {
        "from": "QuizAssignment",
        "to": "QuizAssignmentStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "status"
      },
      {
        "from": "QuizAttempt",
        "to": "QuizAttemptStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "status"
      },
      {
        "from": "Resource",
        "to": "ResourceSource",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "sources"
      },
      {
        "from": "ResourceSource",
        "to": "Resource",
        "type": "Association",
        "fromMultiplicity": "0..1",
        "toMultiplicity": "0..1",
        "label": "sourceResource"
      },
      {
        "from": "Folder",
        "to": "ContentGenerationJob",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "generationJobs"
      },
      {
        "from": "User",
        "to": "ContentGenerationJob",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "requestedBy"
      },
      {
        "from": "ContentGenerationJob",
        "to": "Resource",
        "type": "Association",
        "fromMultiplicity": "0..1",
        "toMultiplicity": "0..1",
        "label": "resultResource"
      },
      {
        "from": "Resource",
        "to": "ResourceOrigin",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "origin"
      },
      {
        "from": "Resource",
        "to": "ValidationStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "validationStatus"
      },
      {
        "from": "ResourceSource",
        "to": "ResourceSourceRelation",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "relation"
      },
      {
        "from": "ContentGenerationJob",
        "to": "ContentGenerationType",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "type"
      },
      {
        "from": "ContentGenerationJob",
        "to": "AgentJobStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "status"
      },
      {
        "from": "Project",
        "to": "ResourceEvent",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "resourceEvents"
      },
      {
        "from": "Project",
        "to": "ContentIndexJob",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "contentIndexJobs"
      },
      {
        "from": "Project",
        "to": "McpToken",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "mcpTokens"
      },
      {
        "from": "Resource",
        "to": "ResourceEvent",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "events"
      },
      {
        "from": "Resource",
        "to": "ResourceChunk",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "chunks"
      },
      {
        "from": "Resource",
        "to": "ContentIndexJob",
        "type": "Composition",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "indexJobs"
      },
      {
        "from": "User",
        "to": "ResourceEvent",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "resourceEvents"
      },
      {
        "from": "User",
        "to": "McpToken",
        "type": "Association",
        "fromMultiplicity": "1",
        "toMultiplicity": "0..*",
        "label": "mcpTokens"
      },
      {
        "from": "ResourceEvent",
        "to": "ResourceEventType",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "type"
      },
      {
        "from": "ContentIndexJob",
        "to": "AgentJobStatus",
        "type": "Dependency",
        "fromMultiplicity": "",
        "toMultiplicity": "",
        "label": "status"
      }
    ]
  },
  "sequenceDiagrams": [
    {
      "id": "001",
      "name": "001 · Usuarios",
      "participants": [
        {
          "alias": "U",
          "name": "Usuario",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "U",
          "to": "FE",
          "name": "Completa registro o login"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /auth/register o /auth/login"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Verifica y crea User + Session"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Set-Cookie httpOnly + User",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "U",
          "name": "Redirige a /"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Edita perfil o avatar"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PATCH /users/me o POST /users/me/avatar"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda avatar"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Actualiza perfil"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Perfil actualizado",
          "notes": "respuesta"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Archiva cuenta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "DELETE /users/me"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Borra privados y sesiones, marca ARCHIVED"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Borra avatar y objetos"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "204",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "002",
      "name": "002 · Proyectos",
      "participants": [
        {
          "alias": "U",
          "name": "Usuario",
          "type": "Actor"
        },
        {
          "alias": "V",
          "name": "Visitante",
          "type": "Actor"
        },
        {
          "alias": "O",
          "name": "Owner",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "U",
          "to": "FE",
          "name": "Crea proyecto"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea Project + Folder raíz"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Project",
          "notes": "respuesta"
        },
        {
          "from": "V",
          "to": "FE",
          "name": "Abre /projects?scope=public"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects/public"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta públicos"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Lista paginada",
          "notes": "respuesta"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Elimina proyecto"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "DELETE /projects/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Borra en cascada"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Borra objetos"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "204",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "003",
      "name": "003 · Carpetas",
      "participants": [
        {
          "alias": "O",
          "name": "Owner",
          "type": "Actor"
        },
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "O",
          "to": "FE",
          "name": "Crea carpeta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects/:id/folders"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Valida padre y crea Folder"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Folder",
          "notes": "respuesta"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Mueve carpeta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PATCH /folders/:id/move"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Valida ciclo y actualiza parentId"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Folder movida o FOLDER_CYCLE",
          "notes": "respuesta"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Elimina carpeta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "DELETE /folders/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Borra subárbol"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Borra objetos"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "204",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "004",
      "name": "004 · Aviso",
      "participants": [
        {
          "alias": "V",
          "name": "Viewer",
          "type": "Actor"
        },
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "V",
          "to": "FE",
          "name": "Abre una carpeta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /folders/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta noticeResourceId"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Folder",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id/text"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Lee aviso.md"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "{ content }",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "V",
          "name": "Render sanitizado al tope"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Crea o edita aviso"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /notice o PUT /content"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda aviso.md"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea o actualiza Resource"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Recurso actualizado",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "005",
      "name": "005 · Archivos",
      "participants": [
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "V",
          "name": "Viewer",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "E",
          "to": "FE",
          "name": "Selecciona un archivo"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /folders/:id/files"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Valida nombre y metadatos"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda objeto"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea Resource"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Resource o error",
          "notes": "respuesta"
        },
        {
          "from": "V",
          "to": "FE",
          "name": "Descarga archivo"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id/content (Range)"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Lee objeto"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "206 Partial Content",
          "notes": "respuesta"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Elimina archivo"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "DELETE /files/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Borra Resource"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Borra objeto"
        }
      ]
    },
    {
      "id": "006",
      "name": "006 · Visualización",
      "participants": [
        {
          "alias": "V",
          "name": "Viewer",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "V",
          "to": "FE",
          "name": "Abre un recurso"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta metadatos"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Resource (kind, mimeType)",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id/content (Range)"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Lee objeto"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Binario o 206",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "V",
          "name": "Visor nativo o descarga"
        },
        {
          "from": "V",
          "to": "FE",
          "name": "Vuelve a la carpeta"
        }
      ]
    },
    {
      "id": "007",
      "name": "007 · Participantes",
      "participants": [
        {
          "alias": "O",
          "name": "Owner",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "O",
          "to": "FE",
          "name": "Busca usuario"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /users?query"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Busca usuarios activos"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Lista",
          "notes": "respuesta"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Añade participante"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects/:id/members"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea ProjectMember VIEWER"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Miembro",
          "notes": "respuesta"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Cambia rol"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PATCH /members/:userId"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Actualiza role"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Miembro actualizado",
          "notes": "respuesta"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Retira participante"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "DELETE /members/:userId"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Borra membresía"
        }
      ]
    },
    {
      "id": "008",
      "name": "008 · Permisos",
      "participants": [
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "O",
          "name": "Owner",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "Guard",
          "name": "ProjectAccessGuard",
          "type": "Object"
        },
        {
          "alias": "Perm",
          "name": "PermissionsService",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "E",
          "to": "FE",
          "name": "Solicita escritura"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PATCH /folders/:id"
        },
        {
          "from": "API",
          "to": "Guard",
          "name": "Valida acceso"
        },
        {
          "from": "Guard",
          "to": "Perm",
          "name": "resolveRole"
        },
        {
          "from": "Perm",
          "to": "DB",
          "name": "Consulta owner/member/visibility"
        },
        {
          "from": "Perm",
          "to": "Guard",
          "name": "Rol",
          "notes": "respuesta"
        },
        {
          "from": "Guard",
          "to": "API",
          "name": "Permitir o denegar",
          "notes": "respuesta"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "200 o 403",
          "notes": "respuesta"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Cambia rol"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PATCH /members/:userId"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Actualiza role"
        }
      ]
    },
    {
      "id": "009",
      "name": "009 · Apuntes",
      "participants": [
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "E",
          "to": "FE",
          "name": "Abre un apunte .md"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id/text"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Lee contenido"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "{ content }",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "E",
          "name": "Vista sanitizada"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Edita contenido"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PUT /files/:id/content"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda Markdown"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Actualiza size y checksum"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Resource o error",
          "notes": "respuesta"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Crea apunte"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /folders/:id/notes"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda .md"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea Resource MARKDOWN"
        }
      ]
    },
    {
      "id": "010",
      "name": "010 · Transcripción",
      "participants": [
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "Q",
          "name": "pg-boss",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        },
        {
          "alias": "ASR",
          "name": "Whisper ASR",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "E",
          "to": "FE",
          "name": "Pulsa Transcribir"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /files/:id/transcriptions"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea job QUEUED"
        },
        {
          "from": "API",
          "to": "Q",
          "name": "Encola job"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Job",
          "notes": "respuesta"
        },
        {
          "from": "Q",
          "to": "API",
          "name": "Worker toma job"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Marca PROCESSING"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Descarga audio"
        },
        {
          "from": "API",
          "to": "ASR",
          "name": "POST /v1/audio/transcriptions"
        },
        {
          "from": "ASR",
          "to": "API",
          "name": "Texto",
          "notes": "respuesta"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Guarda text y DONE"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /transcriptions/:id"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Estado DONE",
          "notes": "respuesta"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Edita y guarda apunte"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /transcriptions/:id/note"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda .md"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea Resource"
        }
      ]
    },
    {
      "id": "011",
      "name": "011 · Dashboard",
      "participants": [
        {
          "alias": "U",
          "name": "Usuario",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "U",
          "to": "FE",
          "name": "Abre /"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /dashboard?limit=12"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta owned/participating/public"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Calcula counts"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "{ categorías, counts }",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "U",
          "name": "Tres carruseles"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Ver todos"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects?scope"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta paginada"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Lista",
          "notes": "respuesta"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Reintenta si hay error"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /dashboard?limit=12"
        }
      ]
    },
    {
      "id": "012",
      "name": "012 · Estructuración IA",
      "participants": [
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "Q",
          "name": "pg-boss",
          "type": "Object"
        },
        {
          "alias": "AG",
          "name": "Agents LangGraph",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        },
        {
          "alias": "LLM",
          "name": "Proveedor LLM",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "E",
          "to": "FE",
          "name": "Pulsa Estructurar con IA"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /files/:fileId/structure"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea NoteStructureJob QUEUED"
        },
        {
          "from": "API",
          "to": "Q",
          "name": "Encola el job"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "202 job",
          "notes": "respuesta"
        },
        {
          "from": "Q",
          "to": "API",
          "name": "Worker toma el job"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Marca PROCESSING"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Genera URL presignada"
        },
        {
          "from": "API",
          "to": "AG",
          "name": "POST /v1/notes/structure"
        },
        {
          "from": "AG",
          "to": "S3",
          "name": "GET del .md presignado"
        },
        {
          "from": "AG",
          "to": "LLM",
          "name": "plan_outline"
        },
        {
          "from": "LLM",
          "to": "AG",
          "name": "Outline",
          "notes": "respuesta"
        },
        {
          "from": "AG",
          "to": "LLM",
          "name": "structure_note"
        },
        {
          "from": "LLM",
          "to": "AG",
          "name": "Markdown estructurado",
          "notes": "respuesta"
        },
        {
          "from": "AG",
          "to": "API",
          "name": "Resultado con warnings",
          "notes": "respuesta"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Job DONE"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /structure-jobs/:jobId"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Estado y resultado",
          "notes": "respuesta"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Revisa preview y diff"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /structure-jobs/:jobId/apply"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea Resource MARKDOWN"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Apunte estructurado",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "015",
      "name": "015 · Perfil docente y email",
      "participants": [
        {
          "alias": "U",
          "name": "Usuario",
          "type": "Actor"
        },
        {
          "alias": "AD",
          "name": "Administrador",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "MAIL",
          "name": "Mailpit / SMTP",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "U",
          "to": "FE",
          "name": "Completa el registro"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /auth/register"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea User STUDENT + EmailVerificationToken"
        },
        {
          "from": "API",
          "to": "MAIL",
          "name": "Envía enlace de confirmación"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "201 User",
          "notes": "respuesta"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Abre /verify-email?token"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /auth/email/verify/confirm"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Marca emailVerifiedAt"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Solicita verificación docente"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /teacher/verification"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea TeacherProfile PENDING o VERIFIED"
        },
        {
          "from": "AD",
          "to": "FE",
          "name": "Revisa la cola admin"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /admin/teacher-verifications"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /admin/teacher-verifications/:id/approve"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "TeacherProfile VERIFIED + User.role TEACHER + AuditEvent"
        },
        {
          "from": "API",
          "to": "MAIL",
          "name": "Notifica la decisión"
        }
      ]
    },
    {
      "id": "016",
      "name": "016 · Proyectos académicos",
      "participants": [
        {
          "alias": "D",
          "name": "Docente",
          "type": "Actor"
        },
        {
          "alias": "O",
          "name": "Owner",
          "type": "Actor"
        },
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        },
        {
          "alias": "Q",
          "name": "pg-boss",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "D",
          "to": "FE",
          "name": "Crea un proyecto de curso"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects (type=COURSE)"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Verifica TeacherProfile VERIFIED y crea Project + Folder raíz"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Project académico",
          "notes": "respuesta"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Añade estudiantes"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects/:id/members (role=STUDENT)"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea ProjectMember STUDENT"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Archiva el proyecto"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects/:id/archive"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "status=ARCHIVED + archiveAccessUntil (+30 días)"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Intenta escribir"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /folders/:id/notes"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "PermissionsService detecta archivado"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "423 PROJECT_ARCHIVED",
          "notes": "respuesta"
        },
        {
          "from": "O",
          "to": "FE",
          "name": "Extiende o restaura"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects/:id/archive/extend o /restore"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Actualiza fechas o status=ACTIVE"
        },
        {
          "from": "Q",
          "to": "API",
          "name": "Job project-purge"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Busca proyectos vencidos"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Borra objetos"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Borra Project en cascada"
        }
      ]
    },
    {
      "id": "017",
      "name": "017 · Cuestionarios como recursos",
      "participants": [
        {
          "alias": "D",
          "name": "Docente / Editor",
          "type": "Actor"
        },
        {
          "alias": "S",
          "name": "Estudiante",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "D",
          "to": "FE",
          "name": "Crea un cuestionario"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /folders/:folderId/quizzes"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea Resource QUIZ + Quiz DRAFT"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda snapshot JSON"
        },
        {
          "from": "D",
          "to": "FE",
          "name": "Edita preguntas"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PUT /quizzes/:id/questions"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Reemplaza preguntas y opciones"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Regenera snapshot"
        },
        {
          "from": "D",
          "to": "FE",
          "name": "Publica el cuestionario"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /quizzes/:id/publish"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "status=PUBLISHED"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Abre la carpeta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /folders/:id/files"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Filtra quizzes por asignación"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Abre el cuestionario"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /quizzes/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Valida STUDENT, asignación y PUBLISHED"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Quiz sin isCorrect ni correctText",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "018",
      "name": "018 · Tareas, intentos y revisión",
      "participants": [
        {
          "alias": "D",
          "name": "Docente / Editor",
          "type": "Actor"
        },
        {
          "alias": "S",
          "name": "Estudiante",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "D",
          "to": "FE",
          "name": "Asigna el cuestionario"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /quizzes/:id/assignments"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea QuizAssignment + estudiantes"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /assignments/:id/publish"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "status=PUBLISHED"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Abre Mis tareas"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /assignments/mine"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta tareas publicadas del estudiante"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Inicia un intento"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /assignments/:id/attempts"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea QuizAttempt IN_PROGRESS"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Responde"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PATCH /attempts/:id/answers"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Upsert QuizAnswer"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Envía la tarea"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /attempts/:id/submit"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Autocorrige MC/VF y deja short pendiente"
        },
        {
          "from": "D",
          "to": "FE",
          "name": "Revisa resultados"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /assignments/:id/results"
        },
        {
          "from": "D",
          "to": "FE",
          "name": "Califica respuesta corta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PATCH /attempts/:id/answers/:answerId/grade"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "pointsAwarded + feedback + recálculo"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /assignments/:id/publish-results"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "resultsPublishedAt"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Consulta su intento"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /attempts/:id"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Resultado visible",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "019",
      "name": "019 · Panel docente",
      "participants": [
        {
          "alias": "D",
          "name": "Docente / Owner",
          "type": "Actor"
        },
        {
          "alias": "S",
          "name": "Estudiante",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "D",
          "to": "FE",
          "name": "Abre el panel"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects/:id/analytics"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Agrega assignments, intentos y respuestas"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Resumen, tareas, estudiantes y preguntas",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects/:id/analytics/export"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "CSV",
          "notes": "respuesta"
        },
        {
          "from": "S",
          "to": "FE",
          "name": "Abre Mi progreso"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects/:id/my-progress"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta solo intentos propios"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Progreso personal",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "020",
      "name": "020 · Trazabilidad",
      "participants": [
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "E",
          "to": "FE",
          "name": "Abre un recurso"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id/provenance"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Consulta origen, validación y fuentes"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Procedencia",
          "notes": "respuesta"
        },
        {
          "from": "E",
          "to": "FE",
          "name": "Verifica el recurso"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /files/:id/validate"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Valida rol y actualiza estado"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea AuditEvent"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Recurso validado",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "021",
      "name": "021 · Mapas mentales",
      "participants": [
        {
          "alias": "E",
          "name": "Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "Q",
          "name": "pg-boss",
          "type": "Object"
        },
        {
          "alias": "AG",
          "name": "Agents",
          "type": "Object"
        },
        {
          "alias": "LLM",
          "name": "LLM",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "E",
          "to": "FE",
          "name": "Genera mapa mental"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /folders/:id/mindmaps"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea ContentGenerationJob MINDMAP"
        },
        {
          "from": "API",
          "to": "Q",
          "name": "Encola job"
        },
        {
          "from": "Q",
          "to": "API",
          "name": "Worker PROCESSING"
        },
        {
          "from": "API",
          "to": "AG",
          "name": "POST /v1/mindmaps/generate"
        },
        {
          "from": "AG",
          "to": "LLM",
          "name": "Prompt de mapa"
        },
        {
          "from": "AG",
          "to": "API",
          "name": "JSON validado + usage",
          "notes": "respuesta"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Guarda JSON"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Resource MINDMAP + fuentes + DONE"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id/content"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Mapa renderizable",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "022",
      "name": "022 · Cuestionarios IA",
      "participants": [
        {
          "alias": "D",
          "name": "Docente / Editor",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "Q",
          "name": "pg-boss",
          "type": "Object"
        },
        {
          "alias": "AG",
          "name": "Agents",
          "type": "Object"
        },
        {
          "alias": "LLM",
          "name": "LLM",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "D",
          "to": "FE",
          "name": "Genera cuestionario IA"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /folders/:id/quizzes/generate"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea ContentGenerationJob QUIZ"
        },
        {
          "from": "API",
          "to": "Q",
          "name": "Encola job"
        },
        {
          "from": "Q",
          "to": "API",
          "name": "Worker PROCESSING"
        },
        {
          "from": "API",
          "to": "AG",
          "name": "POST /v1/quizzes/generate"
        },
        {
          "from": "AG",
          "to": "LLM",
          "name": "Prompt de preguntas"
        },
        {
          "from": "AG",
          "to": "API",
          "name": "JSON validado + usage",
          "notes": "respuesta"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Resource QUIZ + Quiz DRAFT + sourceRefs"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Job DONE"
        },
        {
          "from": "D",
          "to": "FE",
          "name": "Revisa y publica"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "PUT /quizzes/:id/questions + POST /publish"
        }
      ]
    },
    {
      "id": "023",
      "name": "023 · Métricas de uso",
      "participants": [
        {
          "alias": "U",
          "name": "Usuario",
          "type": "Actor"
        },
        {
          "alias": "D",
          "name": "Docente / Owner",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "U",
          "to": "FE",
          "name": "Abre un recurso"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Registra VIEW"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Descarga archivo"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /files/:id/content?download=1"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Registra DOWNLOAD"
        },
        {
          "from": "D",
          "to": "FE",
          "name": "Abre Uso de recursos"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects/:id/usage"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Agrega eventos"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Vistas, descargas y únicos",
          "notes": "respuesta"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects/:id/usage/export"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "CSV",
          "notes": "respuesta"
        }
      ]
    },
    {
      "id": "024",
      "name": "024 · Búsqueda semántica",
      "participants": [
        {
          "alias": "U",
          "name": "Participante",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        },
        {
          "alias": "Q",
          "name": "pg-boss",
          "type": "Object"
        },
        {
          "alias": "S3",
          "name": "MinIO",
          "type": "Object"
        },
        {
          "alias": "EMB",
          "name": "Embeddings",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects/:id/search/reindex"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Crea ContentIndexJob"
        },
        {
          "from": "API",
          "to": "Q",
          "name": "Encola"
        },
        {
          "from": "Q",
          "to": "API",
          "name": "Worker PROCESSING"
        },
        {
          "from": "API",
          "to": "S3",
          "name": "Lee texto"
        },
        {
          "from": "API",
          "to": "EMB",
          "name": "Embeddings"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "ResourceChunk vector(1536)"
        },
        {
          "from": "U",
          "to": "FE",
          "name": "Busca en lenguaje natural"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "GET /projects/:id/search?q=..."
        },
        {
          "from": "API",
          "to": "DB",
          "name": "pgvector + texto completo"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Resultados con fragmento",
          "notes": "respuesta"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Registra SEARCH_HIT"
        }
      ]
    },
    {
      "id": "025",
      "name": "025 · MCP de desempeño",
      "participants": [
        {
          "alias": "D",
          "name": "Docente / Owner",
          "type": "Actor"
        },
        {
          "alias": "C",
          "name": "Cliente MCP",
          "type": "Actor"
        },
        {
          "alias": "FE",
          "name": "Frontend",
          "type": "Object"
        },
        {
          "alias": "API",
          "name": "API NestJS",
          "type": "Object"
        },
        {
          "alias": "MCP",
          "name": "FastMCP",
          "type": "Object"
        },
        {
          "alias": "DB",
          "name": "PostgreSQL",
          "type": "Object"
        }
      ],
      "messages": [
        {
          "from": "D",
          "to": "FE",
          "name": "Crea token MCP"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "POST /projects/:id/mcp-tokens"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Guarda hash y scopes"
        },
        {
          "from": "API",
          "to": "FE",
          "name": "Token en claro una vez",
          "notes": "respuesta"
        },
        {
          "from": "C",
          "to": "MCP",
          "name": "tools/call"
        },
        {
          "from": "MCP",
          "to": "API",
          "name": "GET /mcp-tools/..."
        },
        {
          "from": "API",
          "to": "DB",
          "name": "Valida token, scope y rate limit"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "AuditEvent"
        },
        {
          "from": "API",
          "to": "MCP",
          "name": "Datos de solo lectura",
          "notes": "respuesta"
        },
        {
          "from": "D",
          "to": "FE",
          "name": "Revoca token"
        },
        {
          "from": "FE",
          "to": "API",
          "name": "DELETE /mcp-tokens/:id"
        },
        {
          "from": "API",
          "to": "DB",
          "name": "revokedAt"
        }
      ]
    }
  ]
};

function out(message) {
  if (typeof Session !== "undefined" && Session.Output) {
    Session.Output("[SDD] " + message);
  }
}

function findByName(collection, name) {
  try {
    return collection.GetByName(name);
  } catch (e) {
    return null;
  }
}

function ensurePackage(parent, name, notes) {
  var pkg = findByName(parent.Packages, name);
  if (!pkg) {
    pkg = parent.Packages.AddNew(name, "");
  }
  if (notes) pkg.Notes = notes;
  pkg.Update();
  return pkg;
}

function ensureElement(pkg, name, type, stereotype, notes) {
  var element = findByName(pkg.Elements, name);
  if (!element) {
    element = pkg.Elements.AddNew(name, type);
  }
  if (stereotype) element.Stereotype = stereotype;
  if (notes) element.Notes = notes;
  element.Update();
  return element;
}

function ensureAttribute(element, name, type, notes) {
  var attribute = findByName(element.Attributes, name);
  if (!attribute) {
    attribute = element.Attributes.AddNew(name, type || "");
  }
  if (type) attribute.Type = type;
  if (notes) attribute.Notes = notes;
  attribute.Update();
  return attribute;
}

function ensureDiagram(pkg, name, type, notes) {
  var diagram = findByName(pkg.Diagrams, name);
  if (!diagram) {
    diagram = pkg.Diagrams.AddNew(name, type);
  }
  if (notes) diagram.Notes = notes;
  diagram.Update();
  return diagram;
}

function addToDiagram(diagram, element, left, top, width, height) {
  var right = left + width;
  var bottom = top + height;
  var geometry = "l=" + left + ";r=" + right + ";t=" + top + ";b=" + bottom;
  var object = diagram.DiagramObjects.AddNew(geometry, "");
  object.ElementID = element.ElementID;
  object.Update();
}

function connect(source, target, type, name, notes) {
  var connector = source.Connectors.AddNew(name || "", type);
  connector.SupplierID = target.ElementID;
  if (notes) connector.Notes = notes;
  connector.Update();
  return connector;
}

function connectSequence(source, target, name, notes, sequenceNo) {
  var connector = connect(source, target, "Sequence", name, notes);
  connector.SequenceNo = sequenceNo;
  connector.Update();
  return connector;
}

function createUseCaseModel(root) {
  var pkg = ensurePackage(root, MODEL.diagramPackages.useCases, "Actores y casos de uso de Infinipaper.");
  var actors = {};
  var useCases = {};
  var i;
  var j;

  for (i = 0; i < MODEL.actors.length; i++) {
    var actor = MODEL.actors[i];
    actors[actor.name] = ensureElement(pkg, actor.name, "Actor", "actor", actor.notes);
  }

  for (i = 0; i < MODEL.useCases.length; i++) {
    var uc = MODEL.useCases[i];
    useCases[uc.id] = ensureElement(pkg, uc.id + " · " + uc.name, "UseCase", "usecase", uc.notes);
  }

  var diagram = ensureDiagram(pkg, "Casos de uso · Infinipaper", "Use Case", "Cada caso de uso corresponde a una spec SDD.");

  for (i = 0; i < MODEL.actors.length; i++) {
    addToDiagram(diagram, actors[MODEL.actors[i].name], 40, 40 + i * 90, 130, 60);
  }
  for (i = 0; i < MODEL.useCases.length; i++) {
    addToDiagram(diagram, useCases[MODEL.useCases[i].id], 320, 40 + i * 72, 260, 55);
  }
  for (i = 0; i < MODEL.useCases.length; i++) {
    var current = MODEL.useCases[i];
    for (j = 0; j < current.actors.length; j++) {
      var linkedActor = actors[current.actors[j]];
      if (linkedActor) {
        connect(linkedActor, useCases[current.id], "UseCase", "", "Asociación de caso de uso");
      }
    }
  }

  diagram.Update();
  Repository.ReloadDiagram(diagram.DiagramID);
  out("Casos de uso: " + MODEL.useCases.length + " casos, " + MODEL.actors.length + " actores.");
}

function createPackageChildren(parent, children, parentPath, map) {
  if (!children) return;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    var childPath = parentPath + "/" + child.name;
    var pkg = ensurePackage(parent, child.name, child.notes);
    map[childPath] = pkg;
    if (child.children) createPackageChildren(pkg, child.children, childPath, map);
  }
}

function createPackageModel(root) {
  var base = ensurePackage(root, MODEL.diagramPackages.packages, "Paquetes del repositorio y dependencias.");
  var rootPkg = ensurePackage(base, MODEL.packageModel.name, MODEL.packageModel.notes);
  var map = {};
  map[MODEL.packageModel.name] = rootPkg;
  createPackageChildren(rootPkg, MODEL.packageModel.children, MODEL.packageModel.name, map);

  var diagram = ensureDiagram(base, "Paquetes · Infinipaper", "Logical", "Vista de paquetes y dependencias.");
  var index = 0;
  for (var key in map) {
    if (!map.hasOwnProperty(key)) continue;
    if (key === MODEL.packageModel.name) continue;
    addToDiagram(diagram, map[key].Element, 40 + (index % 3) * 300, 40 + Math.floor(index / 3) * 140, 240, 90);
    index++;
  }
  for (var i = 0; i < MODEL.packageDependencies.length; i++) {
    var dep = MODEL.packageDependencies[i];
    var from = map[dep.from];
    var to = map[dep.to];
    if (from && to) connect(from.Element, to.Element, "Dependency", dep.label, dep.notes);
  }

  diagram.Update();
  Repository.ReloadDiagram(diagram.DiagramID);
  out("Paquetes: " + index + " paquetes y " + MODEL.packageDependencies.length + " dependencias.");
}

function createC4Model(root) {
  var base = ensurePackage(root, MODEL.diagramPackages.c4, "Arquitectura C4 de Infinipaper.");
  var keys = ["context", "containers", "components", "agents"];
  for (var k = 0; k < keys.length; k++) {
    var cfg = MODEL.c4[keys[k]];
    var elements = {};
    var i;
    for (i = 0; i < cfg.elements.length; i++) {
      var e = cfg.elements[i];
      elements[e.name] = ensureElement(base, e.name, e.type, e.stereotype, e.notes);
    }
    var diagram = ensureDiagram(base, cfg.name, "Component", "Vista C4 generada desde modelo.json.");
    for (i = 0; i < cfg.elements.length; i++) {
      addToDiagram(diagram, elements[cfg.elements[i].name], 40 + (i % 3) * 300, 40 + Math.floor(i / 3) * 120, 230, 80);
    }
    for (i = 0; i < cfg.relationships.length; i++) {
      var rel = cfg.relationships[i];
      if (elements[rel.from] && elements[rel.to]) {
        connect(elements[rel.from], elements[rel.to], "Dependency", rel.label, rel.notes);
      }
    }
    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
  }
  out("C4: contexto, contenedores, componentes y agentes.");
}

function createClassModel(root) {
  var pkg = ensurePackage(root, MODEL.diagramPackages.classes, "Modelo de dominio y clases de implementación.");
  var elements = {};
  var i;
  var j;

  for (i = 0; i < MODEL.classModel.classes.length; i++) {
    var cls = MODEL.classModel.classes[i];
    var element = ensureElement(pkg, cls.name, "Class", cls.stereotype || "entity", cls.notes);
    elements[cls.name] = element;
    for (j = 0; j < cls.attributes.length; j++) {
      var attribute = cls.attributes[j];
      ensureAttribute(element, attribute.name, attribute.type, attribute.notes);
    }
  }

  for (i = 0; i < MODEL.classModel.enums.length; i++) {
    var enumDef = MODEL.classModel.enums[i];
    var enumElement = ensureElement(pkg, enumDef.name, "Enumeration", "enumeration", enumDef.notes);
    elements[enumDef.name] = enumElement;
    for (j = 0; j < enumDef.values.length; j++) {
      ensureAttribute(enumElement, enumDef.values[j], "", "");
    }
  }

  var diagram = ensureDiagram(pkg, MODEL.classModel.name, "Logical", "Diagrama de clases del modelo de dominio.");
  var index = 0;
  for (var key in elements) {
    if (!elements.hasOwnProperty(key)) continue;
    addToDiagram(diagram, elements[key], 40 + (index % 4) * 260, 40 + Math.floor(index / 4) * 180, 220, 140);
    index++;
  }

  for (i = 0; i < MODEL.classModel.relations.length; i++) {
    var rel = MODEL.classModel.relations[i];
    if (!elements[rel.from] || !elements[rel.to]) continue;
    var connector = connect(
      elements[rel.from],
      elements[rel.to],
      rel.type === "Dependency" ? "Dependency" : "Association",
      rel.label,
      rel.notes
    );
    if (rel.type !== "Dependency") {
      connector.ClientEnd.Cardinality = rel.fromMultiplicity || "";
      connector.SupplierEnd.Cardinality = rel.toMultiplicity || "";
      if (rel.type === "Composition") connector.ClientEnd.Aggregation = 2;
      if (rel.type === "Aggregation") connector.ClientEnd.Aggregation = 1;
      connector.Update();
    }
  }

  diagram.Update();
  Repository.ReloadDiagram(diagram.DiagramID);
  out("Clases: " + MODEL.classModel.classes.length + " clases, " + MODEL.classModel.enums.length + " enums.");
}

function createSequenceModel(root) {
  var base = ensurePackage(root, MODEL.diagramPackages.sequences, "Un diagrama de secuencia por spec.");
  for (var s = 0; s < MODEL.sequenceDiagrams.length; s++) {
    var seq = MODEL.sequenceDiagrams[s];
    var diagram = ensureDiagram(base, seq.name, "Sequence", "Secuencia de la spec " + seq.id + ".");
    var map = {};
    var i;
    for (i = 0; i < seq.participants.length; i++) {
      var participant = seq.participants[i];
      map[participant.alias] = ensureElement(
        base,
        seq.id + " · " + participant.name,
        participant.type || "Object",
        "",
        participant.notes
      );
      addToDiagram(diagram, map[participant.alias], 40 + i * 170, 40, 130, 55);
    }
    for (i = 0; i < seq.messages.length; i++) {
      var message = seq.messages[i];
      if (map[message.from] && map[message.to]) {
        connectSequence(map[message.from], map[message.to], message.name, message.notes, i + 1);
      }
    }
    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
  }
  out("Secuencias: " + MODEL.sequenceDiagrams.length + " diagramas.");
}

function main() {
  var existing = findByName(Repository.Models, MODEL.rootPackage);
  if (existing) {
    out("Ya existe el paquete raíz '" + MODEL.rootPackage + "'. Elimínalo antes de volver a importar.");
    return;
  }

  var root = Repository.Models.AddNew(MODEL.rootPackage, "");
  root.Update();

  createUseCaseModel(root);
  createPackageModel(root);
  createC4Model(root);
  createClassModel(root);
  createSequenceModel(root);

  out("Modelo importado correctamente en '" + MODEL.rootPackage + "'.");
}

try {
  main();
} catch (e) {
  out("ERROR: " + (e && e.message ? e.message : e));
}
