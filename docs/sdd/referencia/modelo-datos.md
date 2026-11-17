# Modelo de datos (Prisma)

> Esquema vigente en `infinipaper-backend/prisma/schema.prisma`. Cualquier cambio requiere una migración versionada y una spec que lo justifique. Diagrama de clases: [`diagramas/clases.md`](../diagramas/clases.md).

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "nodejs"
}

datasource db {
  provider = "postgresql"
}

// ---------------------------------------------------------------
// Enums
// ---------------------------------------------------------------

enum UserStatus {
  ACTIVE
  ARCHIVED
}

enum GlobalRole {
  ADMIN
  TEACHER
  STUDENT
}

enum TeacherStatus {
  PENDING
  VERIFIED
  REJECTED
  REVOKED
}

enum TeacherVerificationMethod {
  INSTITUTIONAL_EMAIL
  MANUAL
}

enum ProjectVisibility {
  PUBLIC
  PRIVATE
}

enum ProjectType {
  PERSONAL
  COURSE
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

enum ProjectRole {
  EDITOR
  VIEWER
  STUDENT
}

enum ResourceKind {
  DOCUMENT
  IMAGE
  AUDIO
  VIDEO
  MARKDOWN
  QUIZ
  MINDMAP
}

enum ResourceOrigin {
  UPLOAD
  NOTE
  TRANSCRIPTION
  AI_STRUCTURE
  AI_MINDMAP
  AI_QUIZ
  QUIZ
  IMPORT
}

enum ValidationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum ResourceSourceRelation {
  DERIVED_FROM
  CITES
  USES
}

enum ContentGenerationType {
  MINDMAP
  QUIZ
}

enum TranscriptionStatus {
  QUEUED
  PROCESSING
  DONE
  FAILED
}

enum AgentJobStatus {
  QUEUED
  PROCESSING
  DONE
  FAILED
}

enum QuizStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum QuizQuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
}

enum QuizAssignmentStatus {
  DRAFT
  PUBLISHED
  CLOSED
}

enum QuizAttemptStatus {
  IN_PROGRESS
  SUBMITTED
  GRADED
  EXPIRED
}

// ---------------------------------------------------------------
// Usuarios y sesiones
// ---------------------------------------------------------------

model User {
  id              String     @id @default(cuid())
  username        String     @unique
  email           String     @unique
  passwordHash    String
  displayName     String
  avatarUrl       String?
  bio             String?
  role            GlobalRole @default(STUDENT)
  emailVerifiedAt DateTime?
  status          UserStatus @default(ACTIVE)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  sessions                Session[]
  projects                Project[]
  memberships             ProjectMember[]
  uploads                 Resource[]
  transcriptions          TranscriptionJob[]
  structureJobs           NoteStructureJob[]
  emailVerificationTokens EmailVerificationToken[]
  teacherProfile          TeacherProfile?               @relation("TeacherProfileUser")
  reviewedTeacherProfiles TeacherProfile[]              @relation("TeacherProfileReviewer")
  auditEvents             AuditEvent[]                  @relation("AuditActor")
  createdQuizzes          Quiz[]                        @relation("QuizCreator")
  createdQuizAssignments  QuizAssignment[]              @relation("QuizAssignmentCreator")
  quizAssignments         QuizAssignmentStudent[]       @relation("StudentAssignments")
  quizAttempts            QuizAttempt[]                 @relation("StudentQuizAttempts")
  validatedResources      Resource[]                    @relation("ResourceValidator")
  generationJobs          ContentGenerationJob[]        @relation("ContentGenerationRequester")

  @@index([status])
  @@index([role])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model EmailVerificationToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model TeacherProfile {
  id              String                    @id @default(cuid())
  userId          String                    @unique
  status          TeacherStatus             @default(PENDING)
  method          TeacherVerificationMethod @default(MANUAL)
  institution     String
  area            String?
  position        String?
  evidenceUrl     String?
  reviewerId      String?
  reviewedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt

  user     User  @relation("TeacherProfileUser", fields: [userId], references: [id], onDelete: Cascade)
  reviewer User? @relation("TeacherProfileReviewer", fields: [reviewerId], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([reviewerId])
}

model AuditEvent {
  id         String   @id @default(cuid())
  actorId    String?
  action     String
  entityType String
  entityId   String?
  metadata   Json?
  createdAt  DateTime @default(now())

  actor User? @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId])
  @@index([entityType, entityId])
  @@index([createdAt])
}

// ---------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------

model Project {
  id                  String            @id @default(cuid())
  ownerId             String
  name                String
  description         String?
  visibility          ProjectVisibility @default(PRIVATE)
  type                ProjectType       @default(PERSONAL)
  status              ProjectStatus     @default(ACTIVE)
  institution         String?
  period              String?
  subject             String?
  code                String?
  archivedAt          DateTime?
  archiveAccessUntil  DateTime?
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  owner            User              @relation(fields: [ownerId], references: [id])
  folders          Folder[]
  members          ProjectMember[]
  quizAssignments  QuizAssignment[]

  @@index([ownerId])
  @@index([visibility])
  @@index([type])
  @@index([status])
}

model ProjectMember {
  id        String      @id @default(cuid())
  projectId String
  userId    String
  role      ProjectRole
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
}

// ---------------------------------------------------------------
// Carpetas y recursos
// ---------------------------------------------------------------

model Folder {
  id        String   @id @default(cuid())
  projectId String
  parentId  String?
  name      String
  isRoot    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parent    Folder?    @relation("FolderChildren", fields: [parentId], references: [id], onDelete: Cascade)
  children  Folder[]   @relation("FolderChildren")
  resources Resource[]
  generationJobs ContentGenerationJob[]

  @@unique([projectId, parentId, name])
  @@index([projectId])
  @@index([parentId])
}

model Resource {
  id               String           @id @default(cuid())
  folderId         String
  authorId         String
  name             String
  kind             ResourceKind
  origin           ResourceOrigin   @default(UPLOAD)
  validationStatus ValidationStatus @default(UNVERIFIED)
  validatedById    String?
  validatedAt      DateTime?
  validationNote   String?
  mimeType         String
  size             Int
  s3Key            String           @unique
  checksum         String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  folder            Folder                @relation(fields: [folderId], references: [id], onDelete: Cascade)
  author            User                  @relation(fields: [authorId], references: [id])
  validatedBy       User?                 @relation("ResourceValidator", fields: [validatedById], references: [id], onDelete: SetNull)
  transcriptions    TranscriptionJob[]
  structureJobs     NoteStructureJob[]    @relation("StructureJobs")
  structuredResults NoteStructureJob[]    @relation("StructuredResult")
  quiz              Quiz?
  sources           ResourceSource[]      @relation("ResourceSources")
  sourceOf          ResourceSource[]      @relation("ResourceSourceTargets")
  generationResult  ContentGenerationJob? @relation("GenerationResult")

  @@unique([folderId, name])
  @@index([folderId])
  @@index([kind])
  @@index([origin])
  @@index([validationStatus])
  @@index([validatedById])
}

model ResourceSource {
  id               String                 @id @default(cuid())
  resourceId       String
  sourceResourceId String?
  relation         ResourceSourceRelation @default(DERIVED_FROM)
  createdAt        DateTime               @default(now())

  resource       Resource  @relation("ResourceSources", fields: [resourceId], references: [id], onDelete: Cascade)
  sourceResource Resource? @relation("ResourceSourceTargets", fields: [sourceResourceId], references: [id], onDelete: SetNull)

  @@unique([resourceId, sourceResourceId, relation])
  @@index([resourceId])
  @@index([sourceResourceId])
}

model ContentGenerationJob {
  id               String                 @id @default(cuid())
  type             ContentGenerationType
  folderId         String
  requestedById    String
  status           AgentJobStatus         @default(QUEUED)
  sources          Json
  config           Json?
  resultJson       Json?
  resultResourceId String?                @unique
  warnings         Json?
  error            String?
  model            String?
  promptVersion    String?
  inputTokens      Int?
  outputTokens     Int?
  createdAt        DateTime               @default(now())
  updatedAt        DateTime               @updatedAt

  folder         Folder    @relation(fields: [folderId], references: [id], onDelete: Cascade)
  requestedBy    User      @relation("ContentGenerationRequester", fields: [requestedById], references: [id])
  resultResource Resource? @relation("GenerationResult", fields: [resultResourceId], references: [id], onDelete: SetNull)

  @@index([folderId])
  @@index([requestedById])
  @@index([status])
  @@index([type])
}

// ---------------------------------------------------------------
// Transcripción
// ---------------------------------------------------------------

model TranscriptionJob {
  id            String              @id @default(cuid())
  resourceId    String
  requestedById String
  status        TranscriptionStatus @default(QUEUED)
  language      String              @default("es")
  text          String?
  error         String?
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  requestedBy User     @relation(fields: [requestedById], references: [id])

  @@index([resourceId])
  @@index([status])
}

model NoteStructureJob {
  id               String         @id @default(cuid())
  resourceId       String
  requestedById    String
  status           AgentJobStatus @default(QUEUED)
  language         String         @default("es")
  instructions     String?
  sourceChecksum   String?
  resultMarkdown   String?
  resultResourceId String?        @unique
  outline          Json?
  warnings         Json?
  error            String?
  model            String?
  promptVersion    String?
  inputTokens      Int?
  outputTokens     Int?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  resource       Resource  @relation("StructureJobs", fields: [resourceId], references: [id], onDelete: Cascade)
  requestedBy    User      @relation(fields: [requestedById], references: [id])
  resultResource Resource? @relation("StructuredResult", fields: [resultResourceId], references: [id], onDelete: SetNull)

  @@index([resourceId])
  @@index([status])
}

// ---------------------------------------------------------------
// Cuestionarios
// ---------------------------------------------------------------

model Quiz {
  id           String     @id @default(cuid())
  resourceId   String     @unique
  title        String
  instructions String?
  status       QuizStatus @default(DRAFT)
  settings     Json?
  createdById  String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  resource    Resource           @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  createdBy   User               @relation("QuizCreator", fields: [createdById], references: [id])
  questions   QuizQuestion[]
  assignments QuizAssignment[]

  @@index([status])
  @@index([createdById])
}

model QuizQuestion {
  id            String           @id @default(cuid())
  quizId        String
  type          QuizQuestionType
  prompt        String
  points        Int              @default(1)
  order         Int              @default(0)
  correctText   String?
  caseSensitive Boolean          @default(false)
  sourceRefs    Json?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  quiz    Quiz         @relation(fields: [quizId], references: [id], onDelete: Cascade)
  options QuizOption[]
  answers QuizAnswer[]

  @@index([quizId])
}

model QuizOption {
  id         String  @id @default(cuid())
  questionId String
  text       String
  isCorrect  Boolean @default(false)
  order      Int     @default(0)

  question QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers  QuizAnswer[]

  @@index([questionId])
}

model QuizAssignment {
  id                  String               @id @default(cuid())
  quizId              String
  projectId           String
  createdById         String
  startsAt            DateTime?
  dueAt               DateTime?
  attemptsAllowed     Int                  @default(1)
  status              QuizAssignmentStatus @default(DRAFT)
  resultsPublishedAt  DateTime?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  quiz      Quiz                    @relation(fields: [quizId], references: [id], onDelete: Cascade)
  project   Project                 @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy User                    @relation("QuizAssignmentCreator", fields: [createdById], references: [id])
  students  QuizAssignmentStudent[]
  attempts  QuizAttempt[]

  @@index([quizId])
  @@index([projectId, status])
  @@index([createdById])
}

model QuizAssignmentStudent {
  assignmentId String
  studentId    String

  assignment QuizAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student    User           @relation("StudentAssignments", fields: [studentId], references: [id], onDelete: Cascade)

  @@id([assignmentId, studentId])
  @@index([studentId])
}

model QuizAttempt {
  id            String            @id @default(cuid())
  assignmentId  String
  studentId     String
  attemptNumber Int
  status        QuizAttemptStatus @default(IN_PROGRESS)
  score         Float             @default(0)
  maxScore      Float             @default(0)
  startedAt     DateTime          @default(now())
  submittedAt   DateTime?
  gradedAt      DateTime?

  assignment QuizAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student    User           @relation("StudentQuizAttempts", fields: [studentId], references: [id], onDelete: Cascade)
  answers    QuizAnswer[]

  @@unique([assignmentId, studentId, attemptNumber])
  @@index([assignmentId])
  @@index([studentId])
}

model QuizAnswer {
  id             String  @id @default(cuid())
  attemptId      String
  questionId     String
  optionId       String?
  text           String?
  isCorrect      Boolean?
  pointsAwarded  Float?
  feedback       String?

  attempt  QuizAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  option   QuizOption?  @relation(fields: [optionId], references: [id], onDelete: SetNull)

  @@unique([attemptId, questionId])
  @@index([questionId])
  @@index([optionId])
}
```

## Notas de diseño

- **No hay entidad `Note` ni `Notice`:** el aviso (`aviso.md`, spec 004) y los apuntes (`.md`, spec 009) son `Resource` con `kind = MARKDOWN`. El aviso se detecta por nombre (`AVISO_FILENAME`) y se renderiza; ambos permanecen visibles en el listado.
- **Propietario:** `Project.ownerId` es la única fuente del rol Owner. El Owner no genera fila en `ProjectMember`; la resolución de permisos lo evalúa primero.
- **`ProjectMember.role`** solo admite `EDITOR` o `VIEWER`.
- **Borrado en cascada:** al eliminar `Project` se eliminan carpetas, recursos, membresías y jobs; al eliminar `Folder` se eliminan subcarpetas y recursos. El servicio borra además los objetos en S3.
- **`Resource.s3Key`** reemplaza a cualquier URL persistida; la descarga se resuelve en el backend.
- **`@@unique([folderId, name])`** garantiza nombres únicos por carpeta a nivel de base de datos; la comparación case-insensitive se hace en el servicio.
- **`Session.tokenHash`** almacena el SHA-256 del token; nunca el token en claro.
- **`Resource.size`** es un entero en bytes; el límite de subida no vive en el esquema y se controla con `MAX_UPLOAD_SIZE_MB`.
- **Transcripciones:** `TranscriptionJob` referencia al `Resource` de audio; el listado por proyecto se resuelve mediante `resource.folder.projectId`.
- **Estructuración IA:** `NoteStructureJob` guarda el estado del job, el resultado, warnings, usage y el `resultResourceId` del apunte creado. `resultResourceId` es único y opcional.
- **Roles globales:** `User.role` distingue `ADMIN`, `TEACHER` y `STUDENT`. La verificación docente vive en `TeacherProfile`.
- **Proyectos académicos:** `Project.type` distingue `PERSONAL` y `COURSE`; `status` y `archiveAccessUntil` controlan el archivado. Al vencer, un job purga archivos y proyecto.
- **Cuestionarios:** `Resource(kind=QUIZ)` es la entrada en la jerarquía; `Quiz` guarda preguntas, opciones y configuración. El snapshot JSON vive en MinIO.
- **Tareas:** `QuizAssignment` asigna un quiz a estudiantes; `QuizAttempt` y `QuizAnswer` conservan intentos, puntajes y feedback.
- **Procedencia:** `Resource.origin`, `validationStatus` y `ResourceSource` enlazan recursos derivados con sus fuentes y permiten validación docente.
- **Generación IA:** `ContentGenerationJob` registra jobs de mapas mentales y cuestionarios, sus fuentes, configuración, usage y recurso resultante.
