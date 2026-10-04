"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FolderPickerTree } from "@/components/project/folder-tree";
import { ParticipantsPanel } from "@/components/project/participants-panel";
import {
  WorkspaceProvider,
  type WorkspaceValue,
} from "@/components/project/workspace-context";
import { apiFetch } from "@/lib/api";
import type { FolderNode, FolderTree, Project } from "@/lib/types";
import { SettingsIcon } from "lucide-react";

function findPath(
  nodes: FolderNode[],
  targetId: string | null,
): FolderNode[] {
  if (!targetId) return [];
  for (const node of nodes) {
    if (node.id === targetId) return [node];
    const childPath = findPath(node.children, targetId);
    if (childPath.length) return [node, ...childPath];
  }
  return [];
}

function ProjectWorkspaceLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder");

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiFetch<Project>(`/projects/${projectId}`),
  });

  const treeQuery = useQuery({
    queryKey: ["folders", projectId],
    queryFn: () => apiFetch<FolderTree>(`/projects/${projectId}/folders`),
  });

  const project = projectQuery.data ?? null;
  const rootId = treeQuery.data?.rootId ?? null;
  const isPending = projectQuery.isLoading || treeQuery.isLoading;

  const folderExists =
    folderParam !== null &&
    (folderParam === rootId || findPath(treeQuery.data?.tree ?? [], folderParam).length > 0);
  const selectedFolderId =
    folderExists && folderParam ? folderParam : rootId;

  const canEdit =
    project?.role === "owner" || project?.role === "editor";

  const openFolder = React.useCallback(
    (folderId: string) => {
      router.push(`/projects/${projectId}?folder=${folderId}`);
    },
    [router, projectId],
  );

  const path = findPath(treeQuery.data?.tree ?? [], selectedFolderId);

  const value: WorkspaceValue = {
    projectId,
    project,
    canEdit,
    rootId,
    selectedFolderId,
    openFolder,
    isPending,
  };

  return (
    <WorkspaceProvider value={value}>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/projects" />}>
                Proyectos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {path.length === 0 && rootId ? (
                <BreadcrumbPage>{project?.name ?? "…"}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={
                    <Link
                      href={`/projects/${projectId}?folder=${rootId ?? ""}`}
                    />
                  }
                >
                  {project?.name ?? "…"}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {path.map((node, index) => {
              const isLast = index === path.length - 1;
              return (
                <React.Fragment key={node.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{node.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={
                          <Link
                            href={`/projects/${projectId}?folder=${node.id}`}
                          />
                        }
                      >
                        {node.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
          {project?.role === "owner" ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              render={<Link href={`/projects/${projectId}/settings`} />}
            >
              <SettingsIcon data-icon="inline-start" />
              Configuración
            </Button>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_260px]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-lg border p-3">
              <FolderPickerTree
                projectId={projectId}
                selectedId={selectedFolderId}
                onSelect={openFolder}
                canEdit={canEdit}
              />
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-6">{children}</div>

          {project?.owner ? (
            <div className="lg:sticky lg:top-20 lg:self-start">
              <ParticipantsPanel projectId={projectId} owner={project.owner} />
            </div>
          ) : (
            <Skeleton className="hidden h-40 w-full lg:block" />
          )}
        </div>
      </main>
    </WorkspaceProvider>
  );
}

export default function ProjectWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ProjectWorkspaceLayoutInner>{children}</ProjectWorkspaceLayoutInner>
    </React.Suspense>
  );
}
