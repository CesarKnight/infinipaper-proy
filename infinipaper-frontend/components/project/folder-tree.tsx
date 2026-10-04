"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch, ApiError } from "@/lib/api";
import type { FolderNode, FolderTree } from "@/lib/types";
import {
  FolderIcon,
  FolderPlusIcon,
  HomeIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderTreeProps {
  projectId: string;
  selectedId: string | null;
  onSelect: (folderId: string) => void;
  canEdit: boolean;
  /** Etiqueta del nodo raíz. Por defecto "Raíz". */
  rootLabel?: string;
}

type FolderSort = "name" | "createdAt";

function sortNodes(nodes: FolderNode[], sort: FolderSort): FolderNode[] {
  const sorted = [...nodes].sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return sorted.map((node) => ({ ...node, children: sortNodes(node.children, sort) }));
}

export function FolderPickerTree({
  projectId,
  selectedId,
  onSelect,
  canEdit,
  rootLabel,
}: FolderTreeProps) {
  const queryClient = useQueryClient();
  const [createParent, setCreateParent] = React.useState<string | null | undefined>(undefined);
  const [renameTarget, setRenameTarget] = React.useState<FolderNode | null>(null);
  const [name, setName] = React.useState("");
  const [sort, setSort] = React.useState<FolderSort>("name");

  const { data, isLoading } = useQuery({
    queryKey: ["folders", projectId],
    queryFn: () => apiFetch<FolderTree>(`/projects/${projectId}/folders`),
  });

  const tree = React.useMemo(
    () => sortNodes(data?.tree ?? [], sort),
    [data, sort],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["folders", projectId] });

  const createFolder = useMutation({
    mutationFn: (variables: { name: string; parentId: string }) =>
      apiFetch(`/projects/${projectId}/folders`, {
        method: "POST",
        body: variables,
      }),
    onSuccess: () => {
      toast.success("Carpeta creada");
      setCreateParent(undefined);
      setName("");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const renameFolder = useMutation({
    mutationFn: (variables: { id: string; name: string }) =>
      apiFetch(`/folders/${variables.id}`, {
        method: "PATCH",
        body: { name: variables.name },
      }),
    onSuccess: () => {
      toast.success("Carpeta renombrada");
      setRenameTarget(null);
      setName("");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/folders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Carpeta eliminada");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  function renderNode(node: FolderNode, depth: number) {
    const isSelected = node.id === selectedId;
    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md pr-1 text-sm",
            isSelected ? "bg-secondary" : "hover:bg-muted",
          )}
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          <button
            type="button"
            className="flex flex-1 items-center gap-1.5 py-1.5 text-left"
            onClick={() => onSelect(node.id)}
          >
            <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
          </button>
          {canEdit ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100"
                    aria-label="Acciones"
                  />
                }
              >
                <MoreVerticalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCreateParent(node.id)}>
                  <FolderPlusIcon data-icon="inline-start" />
                  Nueva subcarpeta
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRenameTarget(node);
                    setName(node.name);
                  }}
                >
                  <PencilIcon data-icon="inline-start" />
                  Renombrar
                </DropdownMenuItem>
                {!node.isRoot ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteFolder.mutate(node.id)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Eliminar
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  if (isLoading) {
    return <p className="px-2 py-1 text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        {canEdit ? (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground"
            onClick={() => setCreateParent(data?.rootId ?? null)}
          >
            <FolderPlusIcon data-icon="inline-start" />
            Nuevo
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-0.5" role="group" aria-label="Ordenar carpetas">
          <Button
            variant={sort === "name" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setSort("name")}
          >
            A–Z
          </Button>
          <Button
            variant={sort === "createdAt" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setSort("createdAt")}
          >
            Recientes
          </Button>
        </div>
      </div>
      <nav className="flex flex-col">
        {data?.rootId ? (
          <div
            className={cn(
              "group flex items-center gap-1 rounded-md pr-1 text-sm",
              selectedId === data.rootId ? "bg-secondary" : "hover:bg-muted",
            )}
            style={{ paddingLeft: 4 }}
          >
            <button
              type="button"
              className="flex flex-1 items-center gap-1.5 py-1.5 text-left"
              onClick={() => onSelect(data.rootId as string)}
            >
              <HomeIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">
                {rootLabel ?? "Raíz"}
              </span>
            </button>
          </div>
        ) : null}
        {tree.map((node) => renderNode(node, 1))}
      </nav>

      <Dialog
        open={createParent !== undefined}
        onOpenChange={(open) => !open && setCreateParent(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva carpeta</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Nombre de la carpeta"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <DialogFooter>
            <Button
              disabled={!name.trim() || createFolder.isPending}
              onClick={() =>
                createFolder.mutate({
                  name: name.trim(),
                  parentId: createParent as string,
                })
              }
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar carpeta</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <DialogFooter>
            <Button
              disabled={!name.trim() || renameFolder.isPending}
              onClick={() =>
                renameTarget &&
                renameFolder.mutate({ id: renameTarget.id, name: name.trim() })
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
