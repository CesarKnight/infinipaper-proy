export type UserStatus = "ACTIVE" | "ARCHIVED";
export type GlobalRole = "ADMIN" | "TEACHER" | "STUDENT";
export type TeacherStatus = "PENDING" | "VERIFIED" | "REJECTED" | "REVOKED";
export type ProjectVisibility = "PUBLIC" | "PRIVATE";
export type ProjectType = "PERSONAL" | "COURSE";
export type ProjectStatus = "ACTIVE" | "ARCHIVED";
export type ProjectRole = "EDITOR" | "VIEWER" | "STUDENT";
export type ResourceKind =
  | "DOCUMENT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "MARKDOWN"
  | "QUIZ";
export type TranscriptionStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
export type AgentJobStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
export type QuizStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuizQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER";
export type QuizAssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type QuizAttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED"
  | "EXPIRED";

export interface TeacherProfile {
  id: string;
  userId: string;
  status: TeacherStatus;
  method: "INSTITUTIONAL_EMAIL" | "MANUAL";
  institution: string;
  area: string | null;
  position: string | null;
  evidenceUrl: string | null;
  reviewerId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: GlobalRole;
  emailVerifiedAt: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role?: GlobalRole;
  teacherProfile?: {
    status: TeacherStatus;
    institution: string;
    area: string | null;
  } | null;
  createdAt: string;
}

export interface PublicProfile extends PublicUser {
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
  }>;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  type: ProjectType;
  status: ProjectStatus;
  institution: string | null;
  period: string | null;
  subject: string | null;
  code: string | null;
  archivedAt: string | null;
  archiveAccessUntil: string | null;
  createdAt: string;
  updatedAt: string;
  owner: PublicUser;
  role?: "owner" | "editor" | "viewer" | "student" | "public";
  _count?: { folders: number; members: number };
}

export interface Folder {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode extends Folder {
  children: FolderNode[];
}

export interface FolderTree {
  rootId: string | null;
  tree: FolderNode[];
}

export interface FolderDetail extends Folder {
  noticeResourceId: string | null;
}

export interface Resource {
  id: string;
  folderId: string;
  authorId: string;
  name: string;
  kind: ResourceKind;
  mimeType: string;
  size: number;
  checksum: string | null;
  createdAt: string;
  updatedAt: string;
  author?: PublicUser;
  quiz?: {
    id: string;
    status: QuizStatus;
    title: string;
  } | null;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  user: PublicUser;
}

export interface TranscriptionJob {
  id: string;
  resourceId: string;
  requestedById: string;
  status: TranscriptionStatus;
  language: string;
  text: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StructureOutlineSection {
  heading: string;
  level: number;
}

export interface NoteStructureJob {
  id: string;
  resourceId: string;
  requestedById: string;
  status: AgentJobStatus;
  language: string;
  instructions: string | null;
  sourceChecksum: string | null;
  resultMarkdown: string | null;
  resultResourceId: string | null;
  outline: StructureOutlineSection[] | null;
  warnings: string[] | null;
  error: string | null;
  model: string | null;
  promptVersion: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
}

export interface AppConfig {
  maxUploadSizeMb: number;
  avisoFilename: string;
  agentStructuringEnabled: boolean;
}

export interface QuizOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuizQuestionType;
  prompt: string;
  points: number;
  order: number;
  correctText: string | null;
  caseSensitive: boolean;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  resourceId: string;
  title: string;
  instructions: string | null;
  status: QuizStatus;
  settings: Record<string, unknown> | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestion[];
  resource?: Resource;
}

export interface QuizAssignment {
  id: string;
  quizId: string;
  projectId: string;
  createdById: string;
  startsAt: string | null;
  dueAt: string | null;
  attemptsAllowed: number;
  status: QuizAssignmentStatus;
  resultsPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  quiz?: Quiz;
  students?: Array<{
    assignmentId: string;
    studentId: string;
    student?: PublicUser;
  }>;
  attempts?: QuizAttempt[];
  _count?: { students: number; attempts: number };
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  optionId: string | null;
  text: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  feedback: string | null;
}

export interface QuizAttempt {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  answers: QuizAnswer[];
}
