"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError, fileContentUrl, fileDownloadUrl } from "@/lib/api";
import type { Resource, TranscriptionJob } from "@/lib/types";
import { MarkdownView } from "@/components/project/markdown-view";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { MindmapViewer } from "@/components/mindmap/mindmap-viewer";
import { ProvenancePanel } from "@/components/project/provenance-panel";
import { ImageViewer } from "@/components/viewers/image-viewer";
import { VideoViewer } from "@/components/viewers/video-viewer";
import { PdfViewer } from "@/components/viewers/pdf-viewer";
import { OfficeViewer } from "@/components/viewers/office-viewer";
import { ViewerShell } from "@/components/viewers/viewer-shell";
import { StructureNoteButton } from "@/components/markdown/structure-note-dialog";
import { AutosaveStatusIndicator } from "@/components/markdown/autosave-status";
import { useWorkspace } from "@/components/project/workspace-context";
import { useAutosave } from "@/lib/use-autosave";
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileAudioIcon,
  PencilIcon,
} from "lucide-react";

export default function FileViewerPage() {
  const params = useParams<{ fileId: string }>();
  const fileId = params.fileId;
  const { projectId, selectedFolderId, canEdit } = useWorkspace();

  const resourceQuery = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => apiFetch<Resource>(`/files/${fileId}`),
  });
  const resource = resourceQuery.data;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Volver a la carpeta"
            render={
              <Link
                href={`/projects/${projectId}?folder=${selectedFolderId ?? ""}`}
              />
            }
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="truncate font-heading text-xl font-semibold">
            {resource?.name ?? "…"}
          </h1>
        </div>
        {resource?.kind !== "QUIZ" ? (
          <Button
            variant="outline"
            size="sm"
            render={<a href={fileDownloadUrl(fileId)} download />}
          >
            <DownloadIcon data-icon="inline-start" />
            Descargar
          </Button>
        ) : null}
      </div>

      {resourceQuery.isLoading || !resource ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="flex flex-col gap-4">
          <ResourceContent
            resource={resource}
            canEdit={Boolean(canEdit)}
            projectId={projectId}
          />
          <ProvenancePanel
            resource={resource}
            canEdit={Boolean(canEdit)}
            projectId={projectId}
          />
        </div>
      )}
    </div>
  );
}

function ResourceContent({
  resource,
  canEdit,
  projectId,
}: {
  resource: Resource;
  canEdit: boolean;
  projectId: string;
}) {
  if (resource.kind === "IMAGE") {
    return <ImageViewer key={resource.id} resource={resource} />;
  }

  if (resource.kind === "VIDEO") {
    return <VideoViewer resource={resource} />;
  }

  if (resource.kind === "AUDIO") {
    return <AudioViewer resource={resource} canEdit={canEdit} />;
  }

  if (resource.kind === "MARKDOWN") {
    return <MarkdownViewer resource={resource} canEdit={canEdit} />;
  }

  if (resource.kind === "MINDMAP") {
    return <MindmapViewer resourceId={resource.id} />;
  }

  if (resource.kind === "QUIZ") {
    if (!resource.quiz) {
      return (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          El cuestionario no está disponible.
        </p>
      );
    }
    return (
      <QuizPanel
        quizId={resource.quiz.id}
        projectId={projectId}
        canEdit={canEdit}
      />
    );
  }

  if (resource.mimeType === "application/pdf") {
    return <PdfViewer resource={resource} />;
  }

  if (resource.kind === "DOCUMENT") {
    return <OfficeViewer key={resource.id} resource={resource} />;
  }

  return (
    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      Este formato no tiene visor. Usa el botón de descarga.
    </p>
  );
}

function MarkdownViewer({
  resource,
  canEdit,
}: {
  resource: Resource;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const textQuery = useQuery({
    queryKey: ["file-text", resource.id],
    queryFn: () => apiFetch<{ content: string }>(`/files/${resource.id}/text`),
  });

  const loadedContent = textQuery.data?.content ?? "";

  const save = useMutation({
    mutationFn: (content: string) =>
      apiFetch(`/files/${resource.id}/content`, {
        method: "PUT",
        body: { content },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["file-text", resource.id] }),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const status = useAutosave({
    value: draft,
    initial: loadedContent,
    enabled: editing,
    onSave: (value) => save.mutateAsync(value),
  });

  return (
    <div className="flex flex-col gap-3">
      {canEdit ? (
        <div className="flex flex-wrap justify-end gap-2">
          <StructureNoteButton
            resource={resource}
            originalContent={loadedContent}
            canEdit={canEdit}
          />
          {editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Listo
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(loadedContent);
                setEditing(true);
              }}
            >
              <PencilIcon data-icon="inline-start" />
              Editar
            </Button>
          )}
        </div>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-2">
          <MarkdownEditor
            value={draft}
            onChange={setDraft}
            placeholder="# Apunte"
          />
          <AutosaveStatusIndicator status={status} />
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <MarkdownView content={loadedContent} />
        </div>
      )}
    </div>
  );
}

function AudioViewer({
  resource,
  canEdit,
}: {
  resource: Resource;
  canEdit: boolean;
}) {
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [textOverride, setTextOverride] = React.useState<string | null>(null);
  const [noteName, setNoteName] = React.useState(
    resource.name.replace(/\.[^.]+$/, "") + ".md",
  );

  const start = useMutation({
    mutationFn: () =>
      apiFetch<TranscriptionJob>(`/files/${resource.id}/transcriptions`, {
        method: "POST",
        body: {},
      }),
    onSuccess: (job) => {
      setJobId(job.id);
      toast.success("Transcripción en proceso");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error ASR"),
  });

  const jobQuery = useQuery({
    queryKey: ["transcription", jobId],
    enabled: Boolean(jobId),
    queryFn: () => apiFetch<TranscriptionJob>(`/transcriptions/${jobId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "DONE" || status === "FAILED" ? false : 2000;
    },
  });

  const text = textOverride ?? jobQuery.data?.text ?? "";

  const saveNote = useMutation({
    mutationFn: () =>
      apiFetch(`/transcriptions/${jobId}/note`, {
        method: "POST",
        body: { name: noteName, content: text },
      }),
    onSuccess: () => toast.success("Apunte creado"),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const status = jobQuery.data?.status;

  return (
    <ViewerShell
      title={resource.name}
      badge="Audio"
      subtitle="Reproducción con streaming"
      actions={
        <Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}>
          <DownloadIcon data-icon="inline-start" /> Descargar
        </Button>
      }
      contentClassName="bg-paper-sunken/40 dark:bg-night/30"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
          <audio controls src={fileContentUrl(resource.id)} className="w-full" />
        </div>

      {canEdit ? (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileAudioIcon className="size-4" />
              Transcripción
            </h2>
            {!jobId || status === "FAILED" ? (
              <Button
                size="sm"
                onClick={() => start.mutate()}
                disabled={start.isPending}
              >
                {start.isPending ? "Enviando…" : "Transcribir"}
              </Button>
            ) : null}
          </div>

          {status === "QUEUED" || status === "PROCESSING" ? (
            <p className="text-sm text-muted-foreground">
              Procesando audio… (
              {status === "QUEUED" ? "en cola" : "transcribiendo"})
            </p>
          ) : null}
          {status === "FAILED" ? (
            <p className="text-sm text-destructive">
              Error: {jobQuery.data?.error ?? "no se pudo transcribir"}
            </p>
          ) : null}

          {status === "DONE" ? (
            <>
              <Textarea
                className="min-h-40 font-mono text-xs"
                value={text}
                onChange={(event) => setTextOverride(event.target.value)}
              />
              <div className="flex items-center gap-2">
                <Input
                  value={noteName}
                  onChange={(event) => setNoteName(event.target.value)}
                />
                <Button
                  onClick={() => saveNote.mutate()}
                  disabled={!text.trim() || saveNote.isPending}
                >
                  Guardar como apunte
                </Button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      </div>
    </ViewerShell>
  );
}
