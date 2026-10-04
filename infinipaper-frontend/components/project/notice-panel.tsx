"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import type { FolderDetail } from "@/lib/types";
import { MarkdownView } from "./markdown-view";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { AutosaveStatusIndicator } from "@/components/markdown/autosave-status";
import { useAutosave } from "@/lib/use-autosave";
import { MegaphoneIcon, PencilIcon } from "lucide-react";

interface NoticePanelProps {
  folderId: string;
  canEdit: boolean;
}

export function NoticePanel({ folderId, canEdit }: NoticePanelProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const folderQuery = useQuery({
    queryKey: ["folder", folderId],
    queryFn: () => apiFetch<FolderDetail>(`/folders/${folderId}`),
  });

  const noticeId = folderQuery.data?.noticeResourceId ?? null;

  const textQuery = useQuery({
    queryKey: ["notice-text", noticeId],
    enabled: Boolean(noticeId),
    queryFn: () => apiFetch<{ content: string }>(`/files/${noticeId}/text`),
  });

  const loadedContent = textQuery.data?.content ?? "";

  const createNotice = useMutation({
    mutationFn: () =>
      apiFetch(`/folders/${folderId}/notice`, {
        method: "POST",
        body: { content: "## Aviso\n\nEscribe aquí la información del proyecto." },
      }),
    onSuccess: () => {
      toast.success("Aviso creado");
      queryClient.invalidateQueries({ queryKey: ["folder", folderId] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const saveNotice = useMutation({
    mutationFn: (content: string) =>
      apiFetch(`/files/${noticeId}/content`, {
        method: "PUT",
        body: { content },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notice-text", noticeId] }),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const status = useAutosave({
    value: draft,
    initial: loadedContent,
    enabled: editing,
    onSave: (value) => saveNotice.mutateAsync(value),
  });

  if (folderQuery.isLoading) {
    return null;
  }

  if (!noticeId) {
    if (!canEdit) return null;
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => createNotice.mutate()}
          disabled={createNotice.isPending}
        >
          <MegaphoneIcon data-icon="inline-start" />
          Crear aviso
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MegaphoneIcon className="size-4" />
          Aviso
        </h2>
        {canEdit ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar aviso"
            onClick={() => {
              setDraft(loadedContent);
              setEditing((value) => !value);
            }}
          >
            <PencilIcon />
          </Button>
        ) : null}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <MarkdownEditor
            value={draft}
            onChange={setDraft}
            placeholder="Escribe el aviso en Markdown…"
          />
          <div className="flex items-center justify-between">
            <AutosaveStatusIndicator status={status} />
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Listo
            </Button>
          </div>
        </div>
      ) : (
        <MarkdownView content={loadedContent} />
      )}
    </section>
  );
}
