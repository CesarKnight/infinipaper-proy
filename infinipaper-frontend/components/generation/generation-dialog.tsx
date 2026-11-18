"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api";
import { useGenerationQueue } from "@/lib/use-generation-queue";
import type { ContentGenerationJob } from "@/lib/types";

type Kind = "MINDMAP" | "QUIZ";

export function GenerationDialog({
  projectId,
  folderId,
  kind,
  open,
  onOpenChange,
  onCreated,
  fixedSource,
}: {
  projectId: string;
  folderId: string;
  kind: Kind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (resourceId: string) => void;
  fixedSource?: { type: "RESOURCE"; id: string; name: string };
}) {
  const [sourceType, setSourceType] = React.useState<"FOLDER" | "PROJECT">(
    "FOLDER",
  );
  const [instructions, setInstructions] = React.useState("");
  const [count, setCount] = React.useState(10);
  const [difficulty, setDifficulty] = React.useState<
    "easy" | "medium" | "hard"
  >("medium");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const effectiveSourceType = fixedSource ? "RESOURCE" : sourceType;
  const effectiveSourceId = fixedSource
    ? fixedSource.id
    : sourceType === "FOLDER"
      ? folderId
      : projectId;
  const requestConfig =
    kind === "MINDMAP"
      ? { instructions: instructions.trim() ? instructions : null }
      : {
          count,
          difficulty,
          types: [
            "MULTIPLE_CHOICE",
            "TRUE_FALSE",
            "SHORT_ANSWER",
          ],
          instructions: instructions.trim() ? instructions : null,
        };
  const queueQuery = useGenerationQueue(projectId, open);
  const activeSameSource = (queueQuery.data?.items ?? []).filter(
    (item) =>
      item.type === kind &&
      item.folder.id === folderId &&
      item.sourceType === effectiveSourceType &&
      item.sourceId === effectiveSourceId,
  );
  const exactJob = activeSameSource.find((item) =>
    sameConfig(item.config, requestConfig),
  );

  const reset = () => {
    setJobId(null);
    setInstructions("");
    setCount(10);
    setDifficulty("medium");
    if (!fixedSource) setSourceType("FOLDER");
  };

  const start = useMutation({
    mutationFn: () =>
      apiFetch<ContentGenerationJob>(
        kind === "MINDMAP"
          ? `/folders/${folderId}/mindmaps`
          : `/folders/${folderId}/quizzes/generate`,
        {
          method: "POST",
          body:
            kind === "MINDMAP"
              ? {
                  source: {
                    type: effectiveSourceType,
                    id: effectiveSourceId,
                  },
                  instructions: instructions || undefined,
                }
              : {
                  source: {
                    type: effectiveSourceType,
                    id: effectiveSourceId,
                  },
                  count,
                  difficulty,
                  types: [
                    "MULTIPLE_CHOICE",
                    "TRUE_FALSE",
                    "SHORT_ANSWER",
                  ],
                  instructions: instructions || undefined,
                },
        },
      ),
    onSuccess: (job) => {
      setJobId(job.id);
      void queryClient.invalidateQueries({
        queryKey: ["generation-queue", projectId],
      });
      toast.success("Generación iniciada");
    },
    onError: (error) => {
      void queryClient.invalidateQueries({
        queryKey: ["generation-queue", projectId],
      });
      const jobId =
        error instanceof ApiError &&
        error.details &&
        typeof error.details === "object" &&
        "jobId" in error.details
          ? String((error.details as { jobId?: unknown }).jobId)
          : null;
      toast.error(
        error instanceof ApiError
          ? `${error.message}${jobId ? ` (job ${jobId})` : ""}`
          : "Error",
      );
    },
  });

  const jobQuery = useQuery({
    queryKey: ["generation-job", jobId],
    enabled: Boolean(jobId),
    queryFn: () =>
      apiFetch<ContentGenerationJob>(`/generation-jobs/${jobId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "DONE" || status === "FAILED" ? false : 2000;
    },
  });

  const job = jobQuery.data;

  const retry = useMutation({
    mutationFn: () =>
      apiFetch<ContentGenerationJob>(`/generation-jobs/${jobId}/retry`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Reintentando generación");
      void jobQuery.refetch();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kind === "MINDMAP"
              ? "Generar mapa mental"
              : "Generar cuestionario con IA"}
          </DialogTitle>
          <DialogDescription>
            La IA crea un borrador a partir del contenido compatible de la
            carpeta o del proyecto. Siempre nace como no verificado y revisable.
          </DialogDescription>
        </DialogHeader>

        {jobId ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Estado: <strong>{job?.status ?? "QUEUED"}</strong>
            </p>
            {job?.status === "FAILED" ? (
              <p className="text-destructive">
                {job.error ?? "La generación falló"}
              </p>
            ) : null}
            {job?.status === "DONE" ? (
              <Button
                onClick={() => {
                  if (job.resultResourceId) onCreated(job.resultResourceId);
                  onOpenChange(false);
                  reset();
                }}
              >
                Abrir recurso generado
              </Button>
            ) : (
              <p className="text-muted-foreground">
                Esto puede tardar unos segundos. Puedes cerrar el diálogo; el
                job sigue en segundo plano.
              </p>
            )}
            {job?.stage || job?.progress ? (
              <div className="rounded-md border bg-muted/30 p-2 text-xs">
                <p>
                  Etapa: <strong>{stageLabel(job?.stage)}</strong>
                </p>
                {job?.progress && job.progress.total > 0 ? (
                  <p>
                    Progreso: {job.progress.completed} de {job.progress.total}
                  </p>
                ) : null}
              </div>
            ) : null}
            {job?.warnings?.length ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {job.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
            {job?.status === "FAILED" ? (
              <Button
                variant="outline"
                onClick={() => retry.mutate()}
                disabled={retry.isPending}
              >
                Reintentar
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fixedSource ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Fuente</p>
                <p className="truncate font-medium">{fixedSource.name}</p>
              </div>
            ) : (
              <Select
                value={sourceType}
                onValueChange={(value) =>
                  setSourceType(value as "FOLDER" | "PROJECT")
                }
                items={[
                  { label: "Carpeta actual", value: "FOLDER" },
                  { label: "Todo el proyecto", value: "PROJECT" },
                ]}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOLDER">Carpeta actual</SelectItem>
                  <SelectItem value="PROJECT">Todo el proyecto</SelectItem>
                </SelectContent>
              </Select>
            )}
            {kind === "QUIZ" ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min={5}
                    max={30}
                    value={count}
                    onChange={(event) =>
                      setCount(Number(event.target.value) || 10)
                    }
                    aria-label="Cantidad de preguntas"
                  />
                  <Select
                    value={difficulty}
                    onValueChange={(value) =>
                      setDifficulty(value as "easy" | "medium" | "hard")
                    }
                    items={[
                      { label: "Fácil", value: "easy" },
                      { label: "Media", value: "medium" },
                      { label: "Difícil", value: "hard" },
                    ]}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se generarán preguntas de opción múltiple, verdadero/falso y
                  respuesta corta.
                </p>
              </>
            ) : null}
            <Input
              placeholder="Instrucciones (opcional)"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se usarán todos los archivos compatibles de la fuente elegida.
            </p>
            {exactJob ? (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                Ya hay una generación idéntica en curso por{" "}
                <strong>{exactJob.requestedBy?.displayName ?? "otro integrante"}</strong>.
                Espera a que termine para evitar duplicados.
              </p>
            ) : activeSameSource.length ? (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                Ya hay otra generación de este tipo en curso. Puedes continuar
                si necesitas una configuración distinta.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {!jobId ? (
            <Button
              onClick={() => start.mutate()}
              disabled={start.isPending || Boolean(exactJob)}
            >
              {start.isPending ? "Iniciando…" : "Generar"}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function stageLabel(stage: string | null | undefined): string {
  if (!stage) return "En cola";
  if (stage === "EXTRACTING") return "Extrayendo fuentes";
  if (stage === "GENERATING") return "Generando";
  if (stage === "SAVING") return "Guardando";
  return stage;
}

function sameConfig(
  left: Record<string, unknown> | null,
  right: Record<string, unknown>,
): boolean {
  return canonical(left) === canonical(right);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
