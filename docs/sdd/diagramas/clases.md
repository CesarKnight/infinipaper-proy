# Diagrama de clases

Dos vistas complementarias:

1. **Modelo de dominio**: entidades y enums de Prisma, con sus relaciones y multiplicidades.
2. **Clases de implementación**: controladores, servicios y dependencias del backend NestJS.

> Las entidades son clases de datos: el comportamiento vive en los servicios. Los atributos marcados como opcionales en Prisma (`String?`) se documentan en las notas de cada clase para no recargar el diagrama.

## 1. Modelo de dominio (Base de datos)

```mermaid
classDiagram
  direction LR

  class User {
    <<entity>>
    +String id
    +String username
    +String email
    +String passwordHash
    +String displayName
    +String avatarUrl
    +String bio
    +GlobalRole role
    +DateTime emailVerifiedAt
    +UserStatus status
    +DateTime createdAt
    +DateTime updatedAt
  }

  class Session {
    <<entity>>
    +String id
    +String userId
    +String tokenHash
    +DateTime expiresAt
    +DateTime createdAt
  }

  class Project {
    <<entity>>
    +String id
    +String ownerId
    +String name
    +String description
    +ProjectVisibility visibility
    +ProjectType type
    +ProjectStatus status
    +String institution
    +String period
    +String subject
    +String code
    +DateTime archivedAt
    +DateTime archiveAccessUntil
    +DateTime createdAt
    +DateTime updatedAt
  }

  class ProjectMember {
    <<entity>>
    +String id
    +String projectId
    +String userId
    +ProjectRole role
    +DateTime createdAt
    +DateTime updatedAt
  }

  class Folder {
    <<entity>>
    +String id
    +String projectId
    +String parentId
    +String name
    +Boolean isRoot
    +DateTime createdAt
    +DateTime updatedAt
  }

  class Resource {
    <<entity>>
    +String id
    +String folderId
    +String authorId
    +String name
    +ResourceKind kind
    +String mimeType
    +Int size
    +String s3Key
    +String checksum
    +DateTime createdAt
    +DateTime updatedAt
  }

  class TranscriptionJob {
    <<entity>>
    +String id
    +String resourceId
    +String requestedById
    +TranscriptionStatus status
    +String language
    +String text
    +String error
    +DateTime createdAt
    +DateTime updatedAt
  }

  class NoteStructureJob {
    <<entity>>
    +String id
    +String resourceId
    +String requestedById
    +AgentJobStatus status
    +String language
    +String instructions
    +String sourceChecksum
    +String resultMarkdown
    +String resultResourceId
    +Json outline
    +Json warnings
    +String error
    +String model
    +String promptVersion
    +Int inputTokens
    +Int outputTokens
    +DateTime createdAt
    +DateTime updatedAt
  }

  class EmailVerificationToken {
    <<entity>>
    +String id
    +String userId
    +String tokenHash
    +DateTime expiresAt
    +DateTime usedAt
    +DateTime createdAt
  }

  class TeacherProfile {
    <<entity>>
    +String id
    +String userId
    +TeacherStatus status
    +TeacherVerificationMethod method
    +String institution
    +String area
    +String position
    +String evidenceUrl
    +String reviewerId
    +DateTime reviewedAt
    +String rejectionReason
    +DateTime createdAt
    +DateTime updatedAt
  }

  class AuditEvent {
    <<entity>>
    +String id
    +String actorId
    +String action
    +String entityType
    +String entityId
    +Json metadata
    +DateTime createdAt
  }

  class Quiz {
    <<entity>>
    +String id
    +String resourceId
    +String title
    +String instructions
    +QuizStatus status
    +Json settings
    +String createdById
    +DateTime createdAt
    +DateTime updatedAt
  }

  class QuizQuestion {
    <<entity>>
    +String id
    +String quizId
    +QuizQuestionType type
    +String prompt
    +Int points
    +Int order
    +String correctText
    +Boolean caseSensitive
    +DateTime createdAt
    +DateTime updatedAt
  }

  class QuizOption {
    <<entity>>
    +String id
    +String questionId
    +String text
    +Boolean isCorrect
    +Int order
  }

  class QuizAssignment {
    <<entity>>
    +String id
    +String quizId
    +String projectId
    +String createdById
    +DateTime startsAt
    +DateTime dueAt
    +Int attemptsAllowed
    +QuizAssignmentStatus status
    +DateTime resultsPublishedAt
    +DateTime createdAt
    +DateTime updatedAt
  }

  class QuizAssignmentStudent {
    <<entity>>
    +String assignmentId
    +String studentId
  }

  class QuizAttempt {
    <<entity>>
    +String id
    +String assignmentId
    +String studentId
    +Int attemptNumber
    +QuizAttemptStatus status
    +Float score
    +Float maxScore
    +DateTime startedAt
    +DateTime submittedAt
    +DateTime gradedAt
  }

  class QuizAnswer {
    <<entity>>
    +String id
    +String attemptId
    +String questionId
    +String optionId
    +String text
    +Boolean isCorrect
    +Float pointsAwarded
    +String feedback
  }

  class UserStatus {
    <<enumeration>>
    ACTIVE
    ARCHIVED
  }

  class GlobalRole {
    <<enumeration>>
    ADMIN
    TEACHER
    STUDENT
  }

  class TeacherStatus {
    <<enumeration>>
    PENDING
    VERIFIED
    REJECTED
    REVOKED
  }

  class TeacherVerificationMethod {
    <<enumeration>>
    INSTITUTIONAL_EMAIL
    MANUAL
  }

  class ProjectVisibility {
    <<enumeration>>
    PUBLIC
    PRIVATE
  }

  class ProjectType {
    <<enumeration>>
    PERSONAL
    COURSE
  }

  class ProjectStatus {
    <<enumeration>>
    ACTIVE
    ARCHIVED
  }

  class ProjectRole {
    <<enumeration>>
    EDITOR
    VIEWER
    STUDENT
  }

  class ResourceKind {
    <<enumeration>>
    DOCUMENT
    IMAGE
    AUDIO
    VIDEO
    MARKDOWN
    QUIZ
  }

  class QuizStatus {
    <<enumeration>>
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  class QuizQuestionType {
    <<enumeration>>
    MULTIPLE_CHOICE
    TRUE_FALSE
    SHORT_ANSWER
  }

  class QuizAssignmentStatus {
    <<enumeration>>
    DRAFT
    PUBLISHED
    CLOSED
  }

  class QuizAttemptStatus {
    <<enumeration>>
    IN_PROGRESS
    SUBMITTED
    GRADED
    EXPIRED
  }

  class TranscriptionStatus {
    <<enumeration>>
    QUEUED
    PROCESSING
    DONE
    FAILED
  }

  class AgentJobStatus {
    <<enumeration>>
    QUEUED
    PROCESSING
    DONE
    FAILED
  }

  User "1" --> "0..*" Session : sessions
  User "1" --> "0..*" Project : owner
  User "1" --> "0..*" ProjectMember : memberships
  User "1" --> "0..*" Resource : author
  User "1" --> "0..*" TranscriptionJob : requestedBy
  User "1" --> "0..*" NoteStructureJob : requestedBy

  Project "1" *-- "0..*" ProjectMember : members
  Project "1" *-- "0..*" Folder : folders

  Folder "1" --> "0..*" Folder : parent / children
  Folder "1" *-- "0..*" Resource : resources

  Resource "1" *-- "0..*" TranscriptionJob : transcriptions
  Resource "1" --> "0..*" NoteStructureJob : structureJobs
  NoteStructureJob "0..1" --> "0..1" Resource : resultResource
  Resource "1" *-- "0..1" Quiz : quiz

  User "1" *-- "0..*" EmailVerificationToken : emailVerificationTokens
  User "1" --> "0..1" TeacherProfile : teacherProfile
  User "1" --> "0..*" AuditEvent : auditEvents
  User "1" --> "0..*" Quiz : createdQuizzes
  User "1" --> "0..*" QuizAssignment : createdQuizAssignments
  User "1" --> "0..*" QuizAssignmentStudent : quizAssignments
  User "1" --> "0..*" QuizAttempt : quizAttempts
  TeacherProfile "0..1" --> "0..*" User : reviewer

  Project "1" *-- "0..*" QuizAssignment : quizAssignments
  Quiz "1" *-- "0..*" QuizQuestion : questions
  QuizQuestion "1" *-- "0..*" QuizOption : options
  Quiz "1" *-- "0..*" QuizAssignment : assignments
  QuizAssignment "1" *-- "0..*" QuizAssignmentStudent : students
  QuizAssignment "1" *-- "0..*" QuizAttempt : attempts
  QuizAttempt "1" *-- "0..*" QuizAnswer : answers
  QuizQuestion "1" --> "0..*" QuizAnswer : answers
  QuizOption "1" --> "0..*" QuizAnswer : selectedBy

  User --> UserStatus
  User --> GlobalRole
  Project --> ProjectVisibility
  Project --> ProjectType
  Project --> ProjectStatus
  ProjectMember --> ProjectRole
  Resource --> ResourceKind
  TranscriptionJob --> TranscriptionStatus
  NoteStructureJob --> AgentJobStatus
  TeacherProfile --> TeacherStatus
  TeacherProfile --> TeacherVerificationMethod
  Quiz --> QuizStatus
  QuizQuestion --> QuizQuestionType
  QuizAssignment --> QuizAssignmentStatus
  QuizAttempt --> QuizAttemptStatus

  note for User "avatarUrl, bio y emailVerifiedAt son opcionales"
  note for Project "description, institution, period, subject, code, archivedAt y archiveAccessUntil son opcionales"
  note for Folder "parentId es opcional; la raíz tiene isRoot=true"
  note for Resource "checksum es opcional; s3Key es único; QUIZ enlaza con Quiz"
  note for TranscriptionJob "text y error son opcionales"
  note for NoteStructureJob "resultMarkdown, outline, warnings, error y usage son opcionales"
  note for EmailVerificationToken "usedAt es opcional; tokenHash es único"
  note for TeacherProfile "reviewerId, reviewedAt, rejectionReason y campos académicos son opcionales"
  note for AuditEvent "actorId, entityId y metadata son opcionales"
  note for Quiz "instructions, settings y snapshot son opcionales"
  note for QuizQuestion "correctText es opcional; las opciones solo aplican a MC/VF"
  note for QuizAttempt "submittedAt y gradedAt son opcionales"
  note for QuizAnswer "optionId, text, isCorrect, pointsAwarded y feedback son opcionales"
```

### Reglas del modelo

- `Project.ownerId` es la única fuente del rol **Owner**; el Owner no se guarda en `ProjectMember`.
- `ProjectMember.role` admite `EDITOR`, `VIEWER` y `STUDENT`; el rol `STUDENT` se resuelve como lectura en `PermissionsService`.
- `User.role` es el rol global (`ADMIN`, `TEACHER`, `STUDENT`); no concede acceso implícito a proyectos privados.
- `EmailVerificationToken.tokenHash` guarda el SHA-256 del token, nunca el token en claro.
- `Session.tokenHash` guarda el SHA-256 del token, nunca el token en claro.
- `Resource` representa archivos, avisos, apuntes y cuestionarios; no existen tablas `Note` ni `Notice`.
- Un `Quiz` siempre pertenece a un `Resource(kind=QUIZ)`; el snapshot JSON vive en MinIO y las preguntas viven en tablas.
- `Project` archivado bloquea escrituras a participantes que no son Owner; el Owner conserva la gestión.
- El borrado de `Project`, `Folder`, `Resource`, `Quiz` y `Session` es en cascada según Prisma.
- `Folder.parentId` es una auto-relación; la raíz tiene `isRoot = true`.

## 2. Clases de implementación del backend

```mermaid
classDiagram
  direction LR

  class AuthController {
    +register()
    +login()
    +logout()
    +me()
  }
  class AuthService {
    +register()
    +login()
    +logout()
    +requestEmailVerification()
    +confirmEmail()
  }
  class EmailService {
    +sendVerificationEmail()
    +sendTeacherDecision()
  }
  class TeacherService {
    +request()
    +approve()
    +reject()
    +revoke()
  }
  class RolesGuard {
    +canActivate()
  }
  class SessionService {
    +create()
    +validate()
    +revoke()
  }
  class PasswordService {
    +hash()
    +verify()
  }
  class UsersController {
    +search()
    +profile()
    +updateMe()
    +changePassword()
    +uploadAvatar()
    +archive()
  }
  class UsersService {
    +search()
    +updateProfile()
    +changePassword()
    +uploadAvatar()
    +archive()
  }
  class ProjectsController {
    +create()
    +list()
    +getOne()
    +update()
    +remove()
  }
  class ProjectsService {
    +create()
    +list()
    +getOne()
    +update()
    +archive()
    +extendArchive()
    +restore()
    +purgeExpired()
    +remove()
  }
  class ProjectPurgeQueueService {
    +onModuleInit()
    +onModuleDestroy()
  }
  class FoldersController {
    +tree()
    +create()
    +rename()
    +move()
    +remove()
  }
  class FoldersService {
    +tree()
    +create()
    +rename()
    +move()
    +remove()
  }
  class ResourcesController {
    +list()
    +upload()
    +createNote()
    +createNotice()
    +content()
    +updateContent()
    +rename()
    +remove()
  }
  class ResourcesService {
    +listByFolder()
    +createFromUpload()
    +createNote()
    +createNotice()
    +readText()
    +updateContent()
    +getContent()
    +rename()
    +remove()
  }
  class QuizzesService {
    +create()
    +get()
    +update()
    +setQuestions()
    +publish()
    +archive()
    +duplicate()
  }
  class QuizAssignmentsService {
    +create()
    +publish()
    +listMine()
    +startAttempt()
    +saveAnswer()
    +submit()
    +results()
    +gradeAnswer()
  }
  class MembersController {
    +list()
    +add()
    +updateRole()
    +remove()
  }
  class MembersService {
    +list()
    +add()
    +updateRole()
    +remove()
  }
  class TranscriptionsController {
    +create()
    +get()
    +listByProject()
    +saveAsNote()
  }
  class TranscriptionsService {
    +create()
    +get()
    +listByProject()
    +saveAsNote()
    +process()
  }
  class AsrService {
    +transcribe()
  }
  class QueueService {
    +enqueue()
  }
  class DashboardController {
    +summary()
  }
  class DashboardService {
    +summary()
  }
  class ProjectAccessGuard {
    +canActivate()
  }
  class PermissionsService {
    +resolveRole()
  }
  class PrismaService {
    +$connect()
    +$disconnect()
  }
  class StorageService {
    +ensureBucket()
    +put()
    +get()
    +delete()
  }

  AuthController --> AuthService
  AuthService --> SessionService
  AuthService --> PasswordService
  AuthService --> PrismaService
  AuthService --> EmailService
  TeacherService --> PrismaService
  TeacherService --> EmailService
  RolesGuard --> PermissionsService

  UsersController --> UsersService
  UsersService --> PasswordService
  UsersService --> SessionService
  UsersService --> StorageService
  UsersService --> PrismaService

  ProjectsController --> ProjectsService
  ProjectsService --> PrismaService
  ProjectsService --> StorageService
  ProjectsService --> PermissionsService
  ProjectPurgeQueueService --> ProjectsService

  FoldersController --> FoldersService
  FoldersService --> PrismaService
  FoldersService --> StorageService

  ResourcesController --> ResourcesService
  ResourcesService --> PrismaService
  ResourcesService --> StorageService
  ResourcesService --> PermissionsService

  QuizzesService --> PrismaService
  QuizzesService --> StorageService
  QuizzesService --> PermissionsService
  QuizAssignmentsService --> PrismaService
  QuizAssignmentsService --> PermissionsService

  MembersController --> MembersService
  MembersService --> PermissionsService
  MembersService --> PrismaService

  TranscriptionsController --> TranscriptionsService
  TranscriptionsService --> AsrService
  TranscriptionsService --> QueueService
  TranscriptionsService --> ResourcesService
  TranscriptionsService --> StorageService

  DashboardController --> DashboardService
  DashboardService --> PrismaService

  ProjectAccessGuard --> PermissionsService
  PermissionsService --> PrismaService
  AsrService --> PrismaService
  QueueService --> PrismaService
  StorageService --> PrismaService
```

## 2.5 Clases del servicio de agentes

```mermaid
classDiagram
  direction LR

  class NoteStructureController {
    +create()
    +get()
    +apply()
  }
  class NoteStructureService {
    +createJob()
    +getJob()
    +apply()
    +process()
  }
  class AgentClientService {
    +isEnabled()
    +structure()
  }
  class NoteStructureQueueService {
    +enqueue()
    +registerWorker()
  }
  class NoteStructureWorker {
    +onModuleInit()
  }
  class GraphState {
    +job_id
    +sources
    +extracted
    +outline
    +draft_markdown
    +validation
    +warnings
    +usage
    +retry_count
  }
  class SourceRef {
    +resource_id
    +kind
    +name
    +mime_type
    +checksum
    +url
  }
  class ExtractedDocument {
    +source_id
    +kind
    +text
    +metadata
    +provenance
  }
  class ValidationReport {
    +valid
    +coverage
    +issues
  }
  class NoteStructurerGraph {
    +build_graph()
    +ainvoke()
  }

  NoteStructureController --> NoteStructureService
  NoteStructureWorker --> NoteStructureQueueService
  NoteStructureWorker --> NoteStructureService
  NoteStructureService --> AgentClientService
  NoteStructureService --> NoteStructureQueueService
  AgentClientService ..> NoteStructurerGraph : HTTP interno
  NoteStructurerGraph --> GraphState
  GraphState --> SourceRef
  GraphState --> ExtractedDocument
  GraphState --> ValidationReport
```

## 3. Notas de implementación

- Los controladores solo orquestan HTTP y delegación; la lógica vive en los servicios.
- `ProjectAccessGuard` usa `PermissionsService.resolveRole` para resolver el rol efectivo en cada petición.
- `RolesGuard` aplica los roles globales (`ADMIN`, `TEACHER`, `STUDENT`) en los controladores administrativos.
- `EmailService` encapsula SMTP/Mailpit; `AuthService` emite tokens hasheados y `TeacherService` gestiona la verificación docente.
- `QuizzesService` mantiene el `Quiz` relacional y regenera el snapshot JSON en MinIO en cada cambio.
- `QuizAssignmentsService` valida intentos, autocorrige MC/VF, califica respuestas cortas y publica resultados.
- `TranscriptionsService` usa `QueueService` para el job asíncrono, `StorageService` para descargar el audio, `AsrService` para llamar a Whisper y `ResourcesService` para guardar el apunte.
- `StorageService` es el único adaptador de MinIO; el resto de módulos no conocen el SDK S3.
- `PrismaService` es compartido por todos los servicios que acceden a PostgreSQL.

## 4. Trazabilidad

| Clase / entidad | Specs |
|---|---|
| `User`, `Session` | 001 |
| `Project`, `Folder` | 002, 003 |
| `Resource` | 004, 005, 006, 009 |
| `ProjectMember` | 007, 008 |
| `TranscriptionJob` | 010 |
| `NoteStructureJob` | 012 |
| `NoteStructureService`, `AgentClientService` | 012 |
| `DashboardService` | 011 |
| `EmailVerificationToken`, `TeacherProfile`, `AuditEvent`, `EmailService`, `TeacherService`, `RolesGuard` | 015 |
| `Project.type/status/archiveAccessUntil`, `ProjectPurgeQueueService` | 016 |
| `Quiz`, `QuizQuestion`, `QuizOption`, `QuizzesService` | 017 |
| `QuizAssignment`, `QuizAssignmentStudent`, `QuizAttempt`, `QuizAnswer`, `QuizAssignmentsService` | 018 |

> El diagrama formal equivalente se crea en Enterprise Architect desde [`docs/sdd/ea/modelo.json`](../ea/modelo.json).
