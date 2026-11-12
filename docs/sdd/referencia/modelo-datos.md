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

enum ProjectVisibility {
  PUBLIC
  PRIVATE
}

enum ProjectRole {
  EDITOR
  VIEWER
}

enum ResourceKind {
  DOCUMENT
  IMAGE
  AUDIO
  VIDEO
  MARKDOWN
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

// ---------------------------------------------------------------
// Usuarios y sesiones
// ---------------------------------------------------------------

model User {
  id           String     @id @default(cuid())
  username     String     @unique
  email        String     @unique
  passwordHash String
  displayName  String
  avatarUrl    String?
  bio          String?
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  sessions       Session[]
  projects       Project[]
  memberships    ProjectMember[]
  uploads        Resource[]
  transcriptions TranscriptionJob[]
  structureJobs  NoteStructureJob[]

  @@index([status])
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

// ---------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------

model Project {
  id          String            @id @default(cuid())
  ownerId     String
  name        String
  description String?
  visibility  ProjectVisibility @default(PRIVATE)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  owner   User            @relation(fields: [ownerId], references: [id])
  folders Folder[]
  members ProjectMember[]

  @@index([ownerId])
  @@index([visibility])
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

  @@unique([projectId, parentId, name])
  @@index([projectId])
  @@index([parentId])
}

model Resource {
  id        String       @id @default(cuid())
  folderId  String
  authorId  String
  name      String
  kind      ResourceKind
  mimeType  String
  size      Int
  s3Key     String       @unique
  checksum  String?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  folder            Folder             @relation(fields: [folderId], references: [id], onDelete: Cascade)
  author            User               @relation(fields: [authorId], references: [id])
  transcriptions    TranscriptionJob[]
  structureJobs     NoteStructureJob[] @relation("StructureJobs")
  structuredResults NoteStructureJob[] @relation("StructuredResult")

  @@unique([folderId, name])
  @@index([folderId])
  @@index([kind])
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
