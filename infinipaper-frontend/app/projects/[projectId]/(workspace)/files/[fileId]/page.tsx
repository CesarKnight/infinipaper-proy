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
import { apiFetch, ApiError, fileContentUrl } from "@/lib/api";
import type { Resource, TranscriptionJob } from "@/lib/types";
import { MarkdownView } from "@/components/project/markdown-view";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
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
        <Button
          variant="outline"
          size="sm"
          render={<a href={fileContentUrl(fileId)} download />}
        >
          <DownloadIcon data-icon="inline-start" />
          Descargar
        </Button>
      </div>

      {resourceQuery.isLoading || !resource ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ResourceContent resource={resource} canEdit={Boolean(canEdit)} />
      )}
    </div>
  );
}

function ResourceContent({
  resource,
  canEdit,
}: {
  resource: Resource;
  canEdit: boolean;
}) {
  if (resource.kind === "IMAGE") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fileContentUrl(resource.id)}
        alt={resource.name}
        className="mx-auto max-h-[75vh] rounded-lg border object-contain"
      />
    );
  }

  if (resource.kind === "VIDEO") {
    return (
      <video
        controls
        src={fileContentUrl(resource.id)}
        className="max-h-[75vh] w-full rounded-lg border bg-black"
      />
    );
  }

  if (resource.kind === "AUDIO") {
    return <AudioViewer resource={resource} canEdit={canEdit} />;
  }

  if (resource.kind === "MARKDOWN") {
    return <MarkdownViewer resource={resource} canEdit={canEdit} />;
  }

  if (resource.mimeType === "application/pdf") {
    return (
      <iframe
        src={fileContentUrl(resource.id)}
        title={resource.name}
        className="h-[78vh] w-full rounded-lg border"
      />
    );
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
        <div className="flex justify-end gap-2">
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
    <div className="flex flex-col gap-4">
      <audio controls src={fileContentUrl(resource.id)} className="w-full" />

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
  );
}
