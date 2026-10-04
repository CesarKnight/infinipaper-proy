"use client";

import * as React from "react";
import Link from "next/link";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch, ApiError, userAvatarUrl } from "@/lib/api";
import type { Paged, Resource, ResourceKind } from "@/lib/types";
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  MusicIcon,
  NotebookPenIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
} from "lucide-react";

function kindIcon(kind: ResourceKind) {
  switch (kind) {
    case "IMAGE":
      return <ImageIcon className="size-4 text-muted-foreground" />;
    case "AUDIO":
      return <MusicIcon className="size-4 text-muted-foreground" />;
    case "VIDEO":
      return <VideoIcon className="size-4 text-muted-foreground" />;
    case "MARKDOWN":
      return <FileTextIcon className="size-4 text-muted-foreground" />;
    default:
      return <FileIcon className="size-4 text-muted-foreground" />;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ResourceListProps {
  projectId: string;
  folderId: string;
  canEdit: boolean;
}

export function ResourceList({ projectId, folderId, canEdit }: ResourceListProps) {
  const queryClient = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteName, setNoteName] = React.useState("");
  const [noteContent, setNoteContent] = React.useState("");
  const [sort, setSort] = React.useState<"name" | "date" | "type">("name");

  const { data, isLoading } = useQuery({
    queryKey: ["files", folderId],
    queryFn: () => apiFetch<Paged<Resource>>(`/folders/${folderId}/files`),
  });

  const items = React.useMemo(() => {
    const list = [...(data?.items ?? [])];
    if (sort === "name") {
      list.sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      );
    } else if (sort === "date") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      list.sort(
        (a, b) =>
          a.kind.localeCompare(b.kind) ||
          a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      );
    }
    return list;
  }, [data, sort]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["files", folderId] });
    queryClient.invalidateQueries({ queryKey: ["folder", folderId] });
  };

  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch(`/folders/${folderId}/files`, {
        method: "POST",
        body: form,
      });
    },
    onSuccess: () => {
      toast.success("Archivo subido");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error al subir"),
  });

  const createNote = useMutation({
    mutationFn: () =>
      apiFetch(`/folders/${folderId}/notes`, {
        method: "POST",
        body: { name: noteName, content: noteContent },
      }),
    onSuccess: () => {
      toast.success("Apunte creado");
      setNoteOpen(false);
      setNoteName("");
      setNoteContent("");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/files/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Archivo eliminado");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Archivos</h2>
        <div className="flex items-center gap-2">
          <Select
            value={sort}
            onValueChange={(value) =>
              setSort(value as "name" | "date" | "type")
            }
            items={[
              { label: "Nombre", value: "name" },
              { label: "Más recientes", value: "date" },
              { label: "Tipo", value: "type" },
            ]}
          >
            <SelectTrigger className="h-7 w-36" aria-label="Ordenar archivos">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="date">Más recientes</SelectItem>
              <SelectItem value="type">Tipo</SelectItem>
            </SelectContent>
          </Select>
          {canEdit ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload.mutate(file);
                  event.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNoteOpen(true)}
              >
                <NotebookPenIcon data-icon="inline-start" />
                Nuevo apunte
              </Button>
              <Button
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={upload.isPending}
              >
                <UploadIcon data-icon="inline-start" />
                {upload.isPending ? "Subiendo…" : "Subir archivo"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {items.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <Link
                href={`/projects/${projectId}/files/${resource.id}?folder=${folderId}`}
                className="flex flex-1 items-center gap-2 min-w-0"
              >
                {kindIcon(resource.kind)}
                <span className="truncate">{resource.name}</span>
              </Link>
              {resource.author ? (
                <div
                  className="hidden shrink-0 items-center gap-1.5 sm:flex"
                  title={`Subido por ${resource.author.displayName}`}
                >
                  <Avatar size="sm">
                    {resource.author.avatarUrl ? (
                      <AvatarImage
                        src={userAvatarUrl(resource.author.username)}
                        alt={resource.author.displayName}
                      />
                    ) : null}
                    <AvatarFallback>
                      {initials(resource.author.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-24 truncate text-xs text-muted-foreground">
                    {resource.author.displayName}
                  </span>
                </div>
              ) : null}
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSize(resource.size)}
              </span>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar"
                  onClick={() => remove.mutate(resource.id)}
                >
                  <Trash2Icon />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay archivos en esta carpeta.
        </p>
      )}

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo apunte</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="nombre.md"
              value={noteName}
              onChange={(event) => setNoteName(event.target.value)}
            />
            <MarkdownEditor
              value={noteContent}
              onChange={setNoteContent}
              placeholder="# Apunte"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!noteName.trim() || createNote.isPending}
              onClick={() => createNote.mutate()}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
