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
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
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
