export type GlobalRole = "ADMIN" | "TEACHER" | "STUDENT";
export type ProjectRole = "owner" | "editor" | "viewer" | "student" | "public";
export type ProjectType = "PERSONAL" | "COURSE";
export type ProjectStatus = "ACTIVE" | "ARCHIVED";
export type ResourceKind =
  | "DOCUMENT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "MARKDOWN"
  | "QUIZ"
  | "MINDMAP";

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: GlobalRole;
  emailVerifiedAt: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  type: ProjectType;
  status: ProjectStatus;
  institution: string | null;
  period: string | null;
  subject: string | null;
  code: string | null;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  role?: ProjectRole;
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

export interface Resource {
  id: string;
  folderId: string;
  authorId: string;
  name: string;
  kind: ResourceKind;
  origin: string;
  validationStatus: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  quiz?: { id: string; status: string; title: string } | null;
}

export interface Assignment {
  id: string;
  quizId: string;
  projectId: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  startsAt: string | null;
  dueAt: string | null;
  attemptsAllowed: number;
  quiz: { title: string; resource?: Resource };
  attempts?: {
    id: string;
    status: string;
    score: number;
    maxScore: number;
    attemptNumber: number;
  }[];
}

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
}

export interface MobileSessionResponse {
  user: User;
  token: string;
  expiresAt: string;
}
