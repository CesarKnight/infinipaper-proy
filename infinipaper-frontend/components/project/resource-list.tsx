"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { GenerationDialog } from "@/components/generation/generation-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch, ApiError, userAvatarUrl } from "@/lib/api";
import type {
  Paged,
  Resource,
  ResourceKind,
  ResourceOrigin,
  ValidationStatus,
} from "@/lib/types";
import {
  BrainCircuitIcon,
  ClipboardListIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  MusicIcon,
  NotebookPenIcon,
  Trash2Icon,
  SparklesIcon,
  UploadIcon,
  UploadCloudIcon,
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
    case "QUIZ":
      return <ClipboardListIcon className="size-4 text-muted-foreground" />;
    case "MINDMAP":
      return <BrainCircuitIcon className="size-4 text-muted-foreground" />;
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

const ORIGIN_LABEL: Record<ResourceOrigin, string> = {
  UPLOAD: "Subida",
  NOTE: "Apunte",
  TRANSCRIPTION: "Transcripción",
  AI_STRUCTURE: "IA · estructura",
  AI_MINDMAP: "IA · mapa",
  AI_QUIZ: "IA · quiz",
  QUIZ: "Cuestionario",
  IMPORT: "Importado",
};

const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  UNVERIFIED: "No verificado",
  PENDING: "Pendiente",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
};

interface ResourceListProps {
  projectId: string;
  folderId: string;
  canEdit: boolean;
}

export function ResourceList({ projectId, folderId, canEdit }: ResourceListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragDepth = React.useRef(0);
  const [dragActive, setDragActive] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteName, setNoteName] = React.useState("");
  const [noteContent, setNoteContent] = React.useState("");
  const [quizOpen, setQuizOpen] = React.useState(false);
  const [quizTitle, setQuizTitle] = React.useState("");
  const [quizInstructions, setQuizInstructions] = React.useState("");
  const [generationKind, setGenerationKind] = React.useState<"MINDMAP" | "QUIZ" | null>(null);
  const [origin, setOrigin] = React.useState<string>("all");
  const [validationStatus, setValidationStatus] = React.useState<string>("all");
  const [sort, setSort] = React.useState<"name" | "date" | "type">("name");

  const { data, isLoading } = useQuery({
    queryKey: ["files", folderId, origin, validationStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (origin !== "all") params.set("origin", origin);
      if (validationStatus !== "all")
        params.set("validationStatus", validationStatus);
      const suffix = params.toString();
      return apiFetch<Paged<Resource>>(
        `/folders/${folderId}/files${suffix ? `?${suffix}` : ""}`,
      );
    },
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
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        await apiFetch(`/folders/${folderId}/files`, {
          method: "POST",
          body: form,
        });
      }
      return files;
    },
    onSuccess: (files) => {
      toast.success(
        files.length === 1
          ? "Archivo subido"
          : `${files.length} archivos subidos`,
      );
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

  const createQuiz = useMutation({
    mutationFn: () =>
      apiFetch<{ resource: Resource }>(`/folders/${folderId}/quizzes`, {
        method: "POST",
        body: {
          title: quizTitle,
          instructions: quizInstructions || undefined,
        },
      }),
    onSuccess: ({ resource }) => {
      toast.success("Cuestionario creado");
      setQuizOpen(false);
      setQuizTitle("");
      setQuizInstructions("");
      invalidate();
      router.push(
        `/projects/${projectId}/files/${resource.id}?folder=${folderId}`,
      );
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

  const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
    if (!canEdit) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!canEdit) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    if (!canEdit) return;
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    if (!canEdit) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) upload.mutate(files);
  };

  return (
    <section
      className="relative flex flex-col gap-3"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Archivos de la carpeta"
    >
      {canEdit && dragActive ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/85 p-6 text-center shadow-lg backdrop-blur-sm">
          <div>
            <UploadCloudIcon className="mx-auto mb-2 size-8 text-primary" />
            <p className="font-heading text-lg font-semibold">
              Suelta para subir a esta carpeta
            </p>
            <p className="text-sm text-muted-foreground">
              Puedes arrastrar varios archivos a la vez.
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Archivos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={origin}
            onValueChange={(value) => setOrigin(value ?? "all")}
            items={[
              { label: "Todo origen", value: "all" },
              ...Object.entries(ORIGIN_LABEL).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          >
            <SelectTrigger className="h-7 w-36" aria-label="Filtrar por origen">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo origen</SelectItem>
              {Object.entries(ORIGIN_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={validationStatus}
            onValueChange={(value) => setValidationStatus(value ?? "all")}
            items={[
              { label: "Toda validación", value: "all" },
              ...Object.entries(VALIDATION_LABEL).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          >
            <SelectTrigger className="h-7 w-40" aria-label="Filtrar por validación">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda validación</SelectItem>
              {Object.entries(VALIDATION_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) upload.mutate(files);
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
                variant="outline"
                size="sm"
                onClick={() => setQuizOpen(true)}
              >
                <ClipboardListIcon data-icon="inline-start" />
                Nuevo cuestionario
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGenerationKind("MINDMAP")}
              >
                <BrainCircuitIcon data-icon="inline-start" />
                Mapa mental IA
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGenerationKind("QUIZ")}
              >
                <SparklesIcon data-icon="inline-start" />
                Quiz IA
              </Button>
              <Button
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={upload.isPending}
              >
                <UploadIcon data-icon="inline-start" />
                {upload.isPending ? "Subiendo…" : "Subir archivos"}
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
              <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                {ORIGIN_LABEL[resource.origin] ?? resource.origin}
              </Badge>
              <Badge
                variant={
                  resource.validationStatus === "VERIFIED"
                    ? "secondary"
                    : resource.validationStatus === "REJECTED"
                      ? "destructive"
                      : "outline"
                }
                className="hidden shrink-0 sm:inline-flex"
              >
                {VALIDATION_LABEL[resource.validationStatus] ??
                  resource.validationStatus}
              </Badge>
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
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>No hay archivos en esta carpeta.</p>
          {canEdit ? (
            <p className="mt-1 text-xs">
              Arrastra archivos aquí o usa “Subir archivos”.
            </p>
          ) : null}
        </div>
      )}

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cuestionario</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Título del cuestionario"
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
            />
            <Input
              placeholder="Instrucciones (opcional)"
              value={quizInstructions}
              onChange={(event) => setQuizInstructions(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!quizTitle.trim() || createQuiz.isPending}
              onClick={() => createQuiz.mutate()}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      {generationKind ? (
        <GenerationDialog
          projectId={projectId}
          folderId={folderId}
          kind={generationKind}
          open
          onOpenChange={(value) => {
            if (!value) setGenerationKind(null);
          }}
          onCreated={(resourceId) => {
            invalidate();
            router.push(
              `/projects/${projectId}/files/${resourceId}?folder=${folderId}`,
            );
          }}
        />
      ) : null}
    </section>
  );
}
