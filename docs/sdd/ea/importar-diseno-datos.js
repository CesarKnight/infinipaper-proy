// ARCHIVO GENERADO POR docs/sdd/ea/generar-diseno-datos.mjs
// No editar a mano. Modifica modelo.json y diseno-datos.json, y vuelve a ejecutar el generador.
// Ejecutar en Enterprise Architect: Develop > Scripting > crear script JScript.
// Crea el paquete "Infinipaper · Diseño de datos" y aborta si ya existe.

var MODEL = {
  "rootPackage": "Infinipaper · Diseño de datos",
  "notes": "Vista de diseño de datos de Infinipaper. Se genera desde modelo.json y se importa a Enterprise Architect con un script independiente.",
  "layout": {
    "x": 40,
    "y": 40,
    "columns": 4,
    "gapX": 300,
    "gapY": 260,
    "width": 240,
    "height": 150
  },
  "diagrams": [
    {
      "key": "general",
      "name": "Diseño de datos · Vista general",
      "description": "Entidades centrales de identidad, proyectos, recursos y evaluación.",
      "classes": [
        "User",
        "Session",
        "Project",
        "ProjectMember",
        "Folder",
        "Resource",
        "Quiz",
        "QuizAssignment",
        "QuizAttempt"
      ]
    },
    {
      "key": "identidad",
      "name": "Diseño de datos · Identidad y acceso",
      "description": "Usuarios, sesiones, confirmación de email, perfil docente y auditoría.",
      "classes": [
        "User",
        "Session",
        "EmailVerificationToken",
        "TeacherProfile",
        "AuditEvent"
      ]
    },
    {
      "key": "contenido",
      "name": "Diseño de datos · Proyectos y contenido",
      "description": "Proyectos, carpetas, recursos, extracciones, trabajos y trazabilidad.",
      "classes": [
        "User",
        "Project",
        "ProjectMember",
        "Folder",
        "Resource",
        "ResourceSource",
        "ResourceExtraction",
        "TranscriptionJob",
        "NoteStructureJob",
        "ContentGenerationJob",
        "ResourceEvent",
        "ResourceChunk",
        "ContentIndexJob",
        "McpToken"
      ]
    },
    {
      "key": "evaluacion",
      "name": "Diseño de datos · Evaluación",
      "description": "Cuestionarios, preguntas, asignaciones, intentos y respuestas.",
      "classes": [
        "Project",
        "Resource",
        "Quiz",
        "QuizQuestion",
        "QuizOption",
        "QuizAssignment",
        "QuizAssignmentStudent",
        "QuizAttempt",
        "QuizAnswer"
      ]
    }
  ],
  "classes": [
    {
      "name": "User",
      "notes": "avatarUrl, bio y emailVerifiedAt son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "username",
          "type": "String",
          "notes": ""
        },
        {
          "name": "email",
          "type": "String",
          "notes": ""
        },
        {
          "name": "role",
          "type": "GlobalRole",
          "notes": ""
        },
        {
          "name": "status",
          "type": "UserStatus",
          "notes": ""
        }
      ]
    },
    {
      "name": "Session",
      "notes": "tokenHash guarda el SHA-256 del token.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "userId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "expiresAt",
          "type": "DateTime",
          "notes": ""
        }
      ]
    },
    {
      "name": "Project",
      "notes": "description, institution, period, subject, code, archivedAt y archiveAccessUntil son opcionales. ownerId es la fuente del rol Owner.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "ownerId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "name",
          "type": "String",
          "notes": ""
        },
        {
          "name": "visibility",
          "type": "ProjectVisibility",
          "notes": ""
        },
        {
          "name": "type",
          "type": "ProjectType",
          "notes": ""
        },
        {
          "name": "status",
          "type": "ProjectStatus",
          "notes": ""
        }
      ]
    },
    {
      "name": "ProjectMember",
      "notes": "role admite EDITOR, VIEWER o STUDENT; el Owner no se guarda aquí.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "projectId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "userId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "role",
          "type": "ProjectRole",
          "notes": ""
        }
      ]
    },
    {
      "name": "Folder",
      "notes": "parentId es opcional; la raíz tiene isRoot=true.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "projectId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "parentId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "name",
          "type": "String",
          "notes": ""
        },
        {
          "name": "isRoot",
          "type": "Boolean",
          "notes": ""
        }
      ]
    },
    {
      "name": "Resource",
      "notes": "checksum es opcional; s3Key es único. Representa archivos, avisos, apuntes y cuestionarios.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "folderId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "authorId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "name",
          "type": "String",
          "notes": ""
        },
        {
          "name": "kind",
          "type": "ResourceKind",
          "notes": ""
        },
        {
          "name": "origin",
          "type": "ResourceOrigin",
          "notes": ""
        },
        {
          "name": "validationStatus",
          "type": "ValidationStatus",
          "notes": ""
        }
      ]
    },
    {
      "name": "TranscriptionJob",
      "notes": "text y error son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "requestedById",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "TranscriptionStatus",
          "notes": ""
        },
        {
          "name": "language",
          "type": "String",
          "notes": ""
        }
      ]
    },
    {
      "name": "NoteStructureJob",
      "notes": "resultMarkdown, outline, warnings, error y usage son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "requestedById",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "AgentJobStatus",
          "notes": ""
        },
        {
          "name": "resultResourceId",
          "type": "String",
          "notes": ""
        }
      ]
    },
    {
      "name": "EmailVerificationToken",
      "notes": "usedAt es opcional; tokenHash es único.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "userId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "expiresAt",
          "type": "DateTime",
          "notes": ""
        },
        {
          "name": "usedAt",
          "type": "DateTime",
          "notes": ""
        }
      ]
    },
    {
      "name": "TeacherProfile",
      "notes": "reviewerId, reviewedAt, rejectionReason y campos académicos son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "userId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "TeacherStatus",
          "notes": ""
        },
        {
          "name": "method",
          "type": "TeacherVerificationMethod",
          "notes": ""
        },
        {
          "name": "institution",
          "type": "String",
          "notes": ""
        }
      ]
    },
    {
      "name": "AuditEvent",
      "notes": "actorId, entityId y metadata son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "actorId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "action",
          "type": "String",
          "notes": ""
        },
        {
          "name": "entityType",
          "type": "String",
          "notes": ""
        },
        {
          "name": "createdAt",
          "type": "DateTime",
          "notes": ""
        }
      ]
    },
    {
      "name": "Quiz",
      "notes": "instructions y settings son opcionales; el snapshot JSON vive en MinIO.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "title",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "QuizStatus",
          "notes": ""
        }
      ]
    },
    {
      "name": "QuizQuestion",
      "notes": "correctText es opcional; las opciones solo aplican a MC/VF.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "quizId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "type",
          "type": "QuizQuestionType",
          "notes": ""
        },
        {
          "name": "prompt",
          "type": "String",
          "notes": ""
        },
        {
          "name": "points",
          "type": "Int",
          "notes": ""
        },
        {
          "name": "order",
          "type": "Int",
          "notes": ""
        }
      ]
    },
    {
      "name": "QuizOption",
      "notes": "isCorrect solo aplica a MC/VF.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "questionId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "text",
          "type": "String",
          "notes": ""
        },
        {
          "name": "isCorrect",
          "type": "Boolean",
          "notes": ""
        },
        {
          "name": "order",
          "type": "Int",
          "notes": ""
        }
      ]
    },
    {
      "name": "QuizAssignment",
      "notes": "startsAt, dueAt y resultsPublishedAt son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "quizId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "projectId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "dueAt",
          "type": "DateTime",
          "notes": ""
        },
        {
          "name": "status",
          "type": "QuizAssignmentStatus",
          "notes": ""
        }
      ]
    },
    {
      "name": "QuizAssignmentStudent",
      "notes": "Tabla puente entre tarea y estudiantes asignados.",
      "attributes": [
        {
          "name": "assignmentId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "studentId",
          "type": "String",
          "notes": ""
        }
      ]
    },
    {
      "name": "QuizAttempt",
      "notes": "submittedAt y gradedAt son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "assignmentId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "studentId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "QuizAttemptStatus",
          "notes": ""
        },
        {
          "name": "score",
          "type": "Float",
          "notes": ""
        }
      ]
    },
    {
      "name": "QuizAnswer",
      "notes": "optionId, text, isCorrect, pointsAwarded y feedback son opcionales.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "attemptId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "questionId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "optionId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "isCorrect",
          "type": "Boolean",
          "notes": ""
        },
        {
          "name": "pointsAwarded",
          "type": "Float",
          "notes": ""
        }
      ]
    },
    {
      "name": "ResourceSource",
      "notes": "sourceResourceId se vuelve null si la fuente se elimina.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "sourceResourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "relation",
          "type": "ResourceSourceRelation",
          "notes": ""
        }
      ]
    },
    {
      "name": "ContentGenerationJob",
      "notes": "sources, config, resultJson, warnings, stage, progress y usage son opcionales; activeKey es único mientras el job está activo.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "type",
          "type": "ContentGenerationType",
          "notes": ""
        },
        {
          "name": "folderId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "requestedById",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "AgentJobStatus",
          "notes": ""
        },
        {
          "name": "stage",
          "type": "String",
          "notes": ""
        }
      ]
    },
    {
      "name": "ResourceExtraction",
      "notes": "content, metadata, warnings y error son opcionales; unique por resourceId + checksum + extractorVersion.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "checksum",
          "type": "String",
          "notes": ""
        },
        {
          "name": "extractor",
          "type": "String",
          "notes": ""
        },
        {
          "name": "extractorVersion",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "AgentJobStatus",
          "notes": ""
        }
      ]
    },
    {
      "name": "ResourceEvent",
      "notes": "resourceId y userId pueden quedar null si se elimina el recurso o usuario.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "projectId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "userId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "type",
          "type": "ResourceEventType",
          "notes": ""
        },
        {
          "name": "createdAt",
          "type": "DateTime",
          "notes": ""
        }
      ]
    },
    {
      "name": "ResourceChunk",
      "notes": "embedding es vector(1536); content no se usa en métricas.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "chunkIndex",
          "type": "Int",
          "notes": ""
        },
        {
          "name": "tokens",
          "type": "Int",
          "notes": ""
        }
      ]
    },
    {
      "name": "ContentIndexJob",
      "notes": "resourceId puede ser null para reindexar un proyecto completo.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "projectId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "resourceId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "status",
          "type": "AgentJobStatus",
          "notes": ""
        }
      ]
    },
    {
      "name": "McpToken",
      "notes": "tokenHash es único; scopes y fechas son metadatos.",
      "attributes": [
        {
          "name": "id",
          "type": "String",
          "notes": ""
        },
        {
          "name": "ownerId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "projectId",
          "type": "String",
          "notes": ""
        },
        {
          "name": "name",
          "type": "String",
          "notes": ""
        },
        {
          "name": "expiresAt",
          "type": "DateTime",
          "notes": ""
        },
        {
          "name": "revokedAt",
          "type": "DateTime",
          "notes": ""
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "User",
      "to": "Session",
      "label": "sessions",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "Project",
      "label": "owner",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "ProjectMember",
      "label": "memberships",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "Resource",
      "label": "author",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "TranscriptionJob",
      "label": "requestedBy",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "NoteStructureJob",
      "label": "requestedBy",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Project",
      "to": "ProjectMember",
      "label": "members",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Project",
      "to": "Folder",
      "label": "folders",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Folder",
      "to": "Folder",
      "label": "parent / children",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Folder",
      "to": "Resource",
      "label": "resources",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "TranscriptionJob",
      "label": "transcriptions",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "NoteStructureJob",
      "label": "structureJobs",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "NoteStructureJob",
      "to": "Resource",
      "label": "resultResource",
      "type": "Dependency",
      "fromMultiplicity": "0..1",
      "toMultiplicity": "0..1",
      "notes": ""
    },
    {
      "from": "User",
      "to": "EmailVerificationToken",
      "label": "emailVerificationTokens",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "TeacherProfile",
      "label": "teacherProfile",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..1",
      "notes": ""
    },
    {
      "from": "User",
      "to": "AuditEvent",
      "label": "auditEvents",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "Quiz",
      "label": "createdQuizzes",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "QuizAssignment",
      "label": "createdQuizAssignments",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "QuizAssignmentStudent",
      "label": "quizAssignments",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "QuizAttempt",
      "label": "quizAttempts",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Project",
      "to": "QuizAssignment",
      "label": "quizAssignments",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "Quiz",
      "label": "quiz",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..1",
      "notes": ""
    },
    {
      "from": "Quiz",
      "to": "QuizQuestion",
      "label": "questions",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "QuizQuestion",
      "to": "QuizOption",
      "label": "options",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Quiz",
      "to": "QuizAssignment",
      "label": "assignments",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "QuizAssignment",
      "to": "QuizAssignmentStudent",
      "label": "students",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "QuizAssignment",
      "to": "QuizAttempt",
      "label": "attempts",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "QuizAttempt",
      "to": "QuizAnswer",
      "label": "answers",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "QuizQuestion",
      "to": "QuizAnswer",
      "label": "answers",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "QuizOption",
      "to": "QuizAnswer",
      "label": "selectedBy",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "ResourceSource",
      "label": "sources",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "ResourceSource",
      "to": "Resource",
      "label": "sourceResource",
      "type": "Dependency",
      "fromMultiplicity": "0..1",
      "toMultiplicity": "0..1",
      "notes": ""
    },
    {
      "from": "Folder",
      "to": "ContentGenerationJob",
      "label": "generationJobs",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "ContentGenerationJob",
      "label": "requestedBy",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "ContentGenerationJob",
      "to": "Resource",
      "label": "resultResource",
      "type": "Dependency",
      "fromMultiplicity": "0..1",
      "toMultiplicity": "0..1",
      "notes": ""
    },
    {
      "from": "Project",
      "to": "ResourceEvent",
      "label": "resourceEvents",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Project",
      "to": "ContentIndexJob",
      "label": "contentIndexJobs",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Project",
      "to": "McpToken",
      "label": "mcpTokens",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "ResourceExtraction",
      "label": "extractions",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "ResourceEvent",
      "label": "events",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "ResourceChunk",
      "label": "chunks",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "Resource",
      "to": "ContentIndexJob",
      "label": "indexJobs",
      "type": "Composition",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "ResourceEvent",
      "label": "resourceEvents",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
    },
    {
      "from": "User",
      "to": "McpToken",
      "label": "mcpTokens",
      "type": "Association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*",
      "notes": ""
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
  ]
};

function out(message) {
  if (typeof Session !== "undefined" && Session.Output) {
    Session.Output("[Diseño de datos] " + message);
  }
}

function findByName(collection, name) {
  try {
    return collection.GetByName(name);
  } catch (e) {
    return null;
  }
}

function ensureElement(pkg, name, type, notes) {
  var element = findByName(pkg.Elements, name);
  if (!element) {
    element = pkg.Elements.AddNew(name, type);
  }
  if (notes) element.Notes = notes;
  element.Update();
  return element;
}

function ensureAttribute(element, name, type, notes) {
  var attribute = findByName(element.Attributes, name);
  if (!attribute) {
    attribute = element.Attributes.AddNew(name, type || "");
  }
  attribute.Name = name;
  attribute.Type = type || "";
  attribute.Visibility = "Public";
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
  var geometry = "l=" + left + ";r=" + (left + width) + ";t=" + top + ";b=" + (top + height);
  var object = diagram.DiagramObjects.AddNew(geometry, "");
  object.ElementID = element.ElementID;
  object.Update();
}

function connectRelationship(source, target, rel) {
  var type = rel.type === "Dependency" ? "Dependency" : "Association";
  var connector = source.Connectors.AddNew(rel.label || "", type);
  connector.SupplierID = target.ElementID;
  connector.ClientEnd.Cardinality = rel.fromMultiplicity || "";
  connector.SupplierEnd.Cardinality = rel.toMultiplicity || "";
  if (rel.type === "Composition") connector.ClientEnd.Aggregation = 2;
  if (rel.type === "Aggregation") connector.ClientEnd.Aggregation = 1;
  if (rel.notes) connector.Notes = rel.notes;
  connector.Update();
  return connector;
}

function main() {
  var existing = findByName(Repository.Models, MODEL.rootPackage);
  if (existing) {
    out("Ya existe el paquete '" + MODEL.rootPackage + "'. Elimínalo antes de volver a importar.");
    return;
  }

  var root = Repository.Models.AddNew(MODEL.rootPackage, "");
  root.Notes = MODEL.notes;
  root.Update();

  var elements = {};
  var i;
  var j;

  for (i = 0; i < MODEL.classes.length; i++) {
    var cls = MODEL.classes[i];
    var element = ensureElement(root, cls.name, "Class", cls.notes);
    elements[cls.name] = element;
    for (j = 0; j < cls.attributes.length; j++) {
      ensureAttribute(element, cls.attributes[j].name, cls.attributes[j].type, cls.attributes[j].notes);
    }
  }

  for (i = 0; i < MODEL.relationships.length; i++) {
    var rel = MODEL.relationships[i];
    if (elements[rel.from] && elements[rel.to]) {
      connectRelationship(elements[rel.from], elements[rel.to], rel);
    }
  }

  for (i = 0; i < MODEL.diagrams.length; i++) {
    var spec = MODEL.diagrams[i];
    var diagram = ensureDiagram(root, spec.name, "Logical", spec.description);
    var layout = MODEL.layout || {};
    var columns = layout.columns || 4;
    var x0 = layout.x || 40;
    var y0 = layout.y || 40;
    var gapX = layout.gapX || 300;
    var width = layout.width || 240;
    var rowY = y0;
    var row = 0;

    for (row = 0; row < spec.classes.length; row += columns) {
      var rowClasses = spec.classes.slice(row, row + columns);
      var rowHeight = layout.height || 150;
      var c;
      for (c = 0; c < rowClasses.length; c++) {
        var current = elements[rowClasses[c]];
        var currentHeight = 80 + current.Attributes.Count * 16;
        if (currentHeight < (layout.height || 150)) currentHeight = layout.height || 150;
        if (currentHeight > rowHeight) rowHeight = currentHeight;
      }
      for (c = 0; c < rowClasses.length; c++) {
        var item = elements[rowClasses[c]];
        var itemHeight = 80 + item.Attributes.Count * 16;
        if (itemHeight < (layout.height || 150)) itemHeight = layout.height || 150;
        addToDiagram(diagram, item, x0 + c * gapX, rowY, width, itemHeight);
      }
      rowY += rowHeight + 40;
    }

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    out("Diagrama '" + spec.name + "' con " + spec.classes.length + " clases.");
  }

  out("Diseño de datos importado con " + MODEL.classes.length + " clases, " + MODEL.relationships.length + " relaciones y " + MODEL.diagrams.length + " diagramas.");
}

try {
  main();
} catch (e) {
  out("ERROR: " + (e && e.message ? e.message : e));
}
