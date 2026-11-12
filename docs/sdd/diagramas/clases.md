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

  class UserStatus {
    <<enumeration>>
    ACTIVE
    ARCHIVED
  }

  class ProjectVisibility {
    <<enumeration>>
    PUBLIC
    PRIVATE
  }

  class ProjectRole {
    <<enumeration>>
    EDITOR
    VIEWER
  }

  class ResourceKind {
    <<enumeration>>
    DOCUMENT
    IMAGE
    AUDIO
    VIDEO
    MARKDOWN
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

  User --> UserStatus
  Project --> ProjectVisibility
  ProjectMember --> ProjectRole
  Resource --> ResourceKind
  TranscriptionJob --> TranscriptionStatus
  NoteStructureJob --> AgentJobStatus

  note for User "avatarUrl y bio son opcionales"
  note for Project "description es opcional"
  note for Folder "parentId es opcional; la raíz tiene isRoot=true"
  note for Resource "checksum es opcional; s3Key es único"
  note for TranscriptionJob "text y error son opcionales"
  note for NoteStructureJob "resultMarkdown, outline, warnings, error y usage son opcionales"
```

### Reglas del modelo

- `Project.ownerId` es la única fuente del rol **Owner**; el Owner no se guarda en `ProjectMember`.
- `ProjectMember.role` solo admite `EDITOR` o `VIEWER`.
- `Session.tokenHash` guarda el SHA-256 del token, nunca el token en claro.
- `Resource` representa archivos, avisos y apuntes; no existen tablas `Note` ni `Notice`.
- El borrado de `Project`, `Folder`, `Resource` y `Session` es en cascada según Prisma.
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
    +remove()
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
    +rename()
    +remove()
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

  UsersController --> UsersService
  UsersService --> PasswordService
  UsersService --> SessionService
  UsersService --> StorageService
  UsersService --> PrismaService

  ProjectsController --> ProjectsService
  ProjectsService --> PrismaService
  ProjectsService --> StorageService
  ProjectsService --> PermissionsService

  FoldersController --> FoldersService
  FoldersService --> PrismaService
  FoldersService --> StorageService

  ResourcesController --> ResourcesService
  ResourcesService --> PrismaService
  ResourcesService --> StorageService

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

> El diagrama formal equivalente se crea en Enterprise Architect desde [`docs/sdd/ea/modelo.json`](../ea/modelo.json).
