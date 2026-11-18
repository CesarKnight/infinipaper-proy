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
  | "QUIZ"
  | "MINDMAP";
export type ResourceOrigin =
  | "UPLOAD"
  | "NOTE"
  | "TRANSCRIPTION"
  | "AI_STRUCTURE"
  | "AI_MINDMAP"
  | "AI_QUIZ"
  | "QUIZ"
  | "IMPORT";
export type ValidationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";
export type ResourceSourceRelation = "DERIVED_FROM" | "CITES" | "USES";
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
  origin: ResourceOrigin;
  validationStatus: ValidationStatus;
  validatedById?: string | null;
  validatedAt?: string | null;
  validationNote?: string | null;
  validatedBy?: PublicUser | null;
  sources?: ResourceSource[];
  author?: PublicUser;
  quiz?: {
    id: string;
    status: QuizStatus;
    title: string;
  } | null;
}

export interface ResourceSource {
  id: string;
  relation: ResourceSourceRelation;
  sourceResourceId: string | null;
  sourceResource?: {
    id: string;
    name: string;
    origin: ResourceOrigin;
    validationStatus: ValidationStatus;
    kind?: ResourceKind;
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

export type ContentGenerationType = "MINDMAP" | "QUIZ";
export type ResourceEventType = "VIEW" | "DOWNLOAD" | "SEARCH_HIT" | "QUIZ_USE";

export interface ContentGenerationJob {
  id: string;
  type: ContentGenerationType;
  folderId: string;
  requestedById: string;
  status: AgentJobStatus;
  sourceType?: "RESOURCE" | "FOLDER" | "PROJECT" | null;
  sourceId?: string | null;
  stage?: string | null;
  progress?: { completed: number; total: number } | null;
  sources: Array<{ resourceId: string; name: string }>;
  config: Record<string, unknown> | null;
  resultJson: Record<string, unknown> | null;
  resultResourceId: string | null;
  warnings: string[] | null;
  error: string | null;
  model: string | null;
  promptVersion: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  requestedBy?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationQueueItem {
  id: string;
  type: ContentGenerationType;
  status: AgentJobStatus;
  stage: string | null;
  progress: { completed: number; total: number } | null;
  folder: { id: string; name: string };
  requestedBy: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  sourceType: "RESOURCE" | "FOLDER" | "PROJECT" | null;
  sourceId: string | null;
  sourceCount: number;
  sourceNames: string[];
  config: Record<string, unknown> | null;
  createdAt: string;
}

export interface GenerationQueueResponse {
  items: GenerationQueueItem[];
}

export interface MindmapNode {
  id: string;
  label: string;
  type?: string;
  description?: string;
}

export interface MindmapEdge {
  source: string;
  target: string;
  label?: string;
}

export interface Mindmap {
  title: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  sources?: string[];
}

export interface AnalyticsSummary {
  students: number;
  activeStudents: number;
  pendingStudents: number;
  assignments: number;
  publishedAssignments: number;
  closedAssignments: number;
  pendingGrading: number;
  completion: number;
  riskThreshold: number;
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  distribution: Array<{ label: string; count: number }>;
}

export interface AnalyticsTask {
  id: string;
  title: string;
  status: QuizAssignmentStatus;
  dueAt: string | null;
  assigned: number;
  completed: number;
  completion: number;
  average: number | null;
  pendingGrading: number;
}

export interface AnalyticsStudent {
  studentId: string;
  username: string;
  displayName: string;
  assigned: number;
  completed: number;
  pending: number;
  average: number | null;
  atRisk: boolean;
  riskReason: string | null;
}

export interface AnalyticsQuestion {
  id: string;
  prompt: string;
  answered: number;
  correct: number;
  accuracy: number | null;
}

export interface AnalyticsPanel {
  filters: Record<string, string | null>;
  summary: AnalyticsSummary;
  tasks: AnalyticsTask[];
  students: AnalyticsStudent[];
  questions: AnalyticsQuestion[];
}

export interface MyProgress {
  assignments: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    status: QuizAssignmentStatus;
    attemptsAllowed: number;
    latestAttempt: QuizAttempt | null;
    completed: boolean;
  }>;
}

export interface UsageRow {
  resourceId: string | null;
  name: string;
  kind: string;
  origin: string;
  validationStatus: string;
  view: number;
  download: number;
  searchHit: number;
  quizUse: number;
  uniqueUsers: number;
  lastEventAt: string | null;
}

export interface UsagePanel {
  filters: Record<string, string | null>;
  summary: {
    events: number;
    byType: Record<string, number>;
    uniqueUsers: number;
    resources: number;
    retentionDays: number;
  };
  resources: UsageRow[];
}

export interface SearchResult {
  resourceId: string;
  chunkId: string;
  name: string;
  kind: ResourceKind;
  origin: ResourceOrigin;
  validationStatus: ValidationStatus;
  fragment: string;
  score: number;
}

export interface SearchResponse {
  mode: "hybrid" | "lexical";
  warning: string | null;
  query: string;
  results: SearchResult[];
}

export interface McpToken {
  id: string;
  name: string;
  scopes: string[];
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  token?: string;
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
  sourceRefs: string[] | null;
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
