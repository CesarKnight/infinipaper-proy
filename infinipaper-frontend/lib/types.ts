export type UserStatus = "ACTIVE" | "ARCHIVED";
export type ProjectVisibility = "PUBLIC" | "PRIVATE";
export type ProjectRole = "EDITOR" | "VIEWER";
export type ResourceKind = "DOCUMENT" | "IMAGE" | "AUDIO" | "VIDEO" | "MARKDOWN";
export type TranscriptionStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  status: UserStatus;
  isTeacher: boolean;
  teacherVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isTeacher?: boolean;
  teacherVerifiedAt?: string | null;
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
  createdAt: string;
  updatedAt: string;
  owner: PublicUser;
  role?: "owner" | "editor" | "viewer" | "public";
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

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
}

export interface AppConfig {
  maxUploadSizeMb: number;
  avisoFilename: string;
}

export type QuizStatus = "DRAFT" | "PUBLISHED";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  points: number;
  order: number;
  options: QuizOption[];
}

export interface QuizSubmissionSummary {
  id: string;
  score: number;
  maxScore: number;
  submittedAt: string;
}

export interface Quiz {
  id: string;
  projectId: string;
  folderId: string | null;
  creatorId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: QuizStatus;
  createdAt: string;
  creator?: { id: string; username: string; displayName: string };
  _count?: { questions: number; submissions: number };
  mySubmission?: QuizSubmissionSummary | null;
  questions?: QuizQuestion[];
}

export interface QuizSubmissionDetail extends QuizSubmissionSummary {
  quizId: string;
  userId: string;
  answers: Array<{
    id: string;
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    question?: { id: string; text: string; points: number };
    selectedOption?: { id: string; text: string };
  }>;
}