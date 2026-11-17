"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import type { ContentGenerationJob } from "@/lib/types";

type Kind = "MINDMAP" | "QUIZ";

export function GenerationDialog({
  projectId,
  folderId,
  kind,
  open,
  onOpenChange,
  onCreated,
}: {
  projectId: string;
  folderId: string;
  kind: Kind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (resourceId: string) => void;
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

  const reset = () => {
    setJobId(null);
    setInstructions("");
    setCount(10);
    setDifficulty("medium");
    setSourceType("FOLDER");
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
                    type: sourceType,
                    id: sourceType === "FOLDER" ? folderId : projectId,
                  },
                  instructions: instructions || undefined,
                }
              : {
                  source: {
                    type: sourceType,
                    id: sourceType === "FOLDER" ? folderId : projectId,
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
      toast.success("Generación iniciada");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
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
            La IA crea un borrador a partir de los apuntes de la carpeta o del
            proyecto. Siempre nace como no verificado y revisable.
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
          </div>
        )}

        <DialogFooter>
          {!jobId ? (
            <Button
              onClick={() => start.mutate()}
              disabled={start.isPending}
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
