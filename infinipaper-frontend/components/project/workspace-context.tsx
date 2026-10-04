"use client";

import * as React from "react";
import type { Project } from "@/lib/types";

export interface WorkspaceValue {
  projectId: string;
  project: Project | null;
  canEdit: boolean;
  rootId: string | null;
  selectedFolderId: string | null;
  /** Selecciona una carpeta y navega a su vista (mantiene el layout). */
  openFolder: (folderId: string) => void;
  isPending: boolean;
}

const WorkspaceContext = React.createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceValue;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceValue {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace debe usarse dentro del layout de proyecto");
  }
  return context;
}
