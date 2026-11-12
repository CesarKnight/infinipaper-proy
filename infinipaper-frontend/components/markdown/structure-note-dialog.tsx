"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { diffLines } from "diff";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownView } from "@/components/project/markdown-view";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  AppConfig,
  NoteStructureJob,
  Resource,
} from "@/lib/types";
import {
  LoaderIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";

interface StructureNoteButtonProps {
  resource: Resource;
  originalContent: string;
  canEdit: boolean;
}

function statusLabel(status: NoteStructureJob["status"]) {
  switch (status) {
    case "QUEUED":
      return "En cola…";
    case "PROCESSING":
      return "Estructurando el apunte…";
    case "DONE":
      return "Listo para revisar";
    case "FAILED":
      return "No se pudo estructurar";
    default:
      return status;
  }
}

function DiffView({
  original,
  structured,
}: {
  original: string;
  structured: string;
}) {
  const changes = React.useMemo(
    () => diffLines(original, structured),
    [original, structured],
  );

  return (
    <pre className="max-h-[50vh] overflow-auto rounded-lg border bg-card p-3 text-xs leading-relaxed whitespace-pre-wrap">
      {changes.map((part, index) => (
        <span
          key={index}
          className={
            part.added
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : part.removed
                ? "bg-destructive/15 text-destructive"
                : ""
          }
        >
          {part.value}
        </span>
      ))}
    </pre>
  );
}

export function StructureNoteButton({
  resource,
  originalContent,
  canEdit,
}: StructureNoteButtonProps) {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [instructions, setInstructions] = React.useState("");
  const [jobId, setJobId] = React.useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: () => apiFetch<AppConfig>("/config"),
  });

  const createJob = useMutation({
    mutationFn: () =>
      apiFetch<NoteStructureJob>(`/files/${resource.id}/structure`, {
        method: "POST",
        body: {
          instructions: instructions.trim() || undefined,
          language: "es",
        },
      }),
    onSuccess: (job) => {
      setJobId(job.id);
      toast.success("Estructuración encolada");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const details = error.details as { jobId?: string } | null;
        if (error.code === "STRUCTURE_JOB_IN_PROGRESS" && details?.jobId) {
          setJobId(details.jobId);
          toast.info("Ya hay una estructuración en curso");
          return;
        }
        toast.error(error.message);
        return;
      }
      toast.error("No se pudo iniciar la estructuración");
    },
  });

  const jobQuery = useQuery({
    queryKey: ["structure-job", jobId],
    enabled: Boolean(jobId),
    queryFn: () =>
      apiFetch<NoteStructureJob>(`/structure-jobs/${jobId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "DONE" || status === "FAILED" ? false : 1500;
    },
  });

  const applyJob = useMutation({
    mutationFn: () =>
      apiFetch<Resource>(`/structure-jobs/${jobId}/apply`, {
        method: "POST",
        body: {},
      }),
    onSuccess: (created) => {
      toast.success("Apunte estructurado creado");
      queryClient.invalidateQueries({
        queryKey: ["files", resource.folderId],
      });
      setOpen(false);
      setJobId(null);
      setInstructions("");
      router.push(
        `/projects/${params.projectId}/files/${created.id}?folder=${resource.folderId}`,
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el apunte",
      ),
  });

  if (!canEdit || !configQuery.data?.agentStructuringEnabled) {
    return null;
  }

  const job = jobQuery.data;
  const running = job?.status === "QUEUED" || job?.status === "PROCESSING";
  const result = job?.status === "DONE" ? job.resultMarkdown : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={running}
      >
        <SparklesIcon data-icon="inline-start" />
        {running ? "Estructurando…" : "Estructurar con IA"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Estructurar apunte con IA</DialogTitle>
            <DialogDescription>
              El agente leerá el apunte desde el almacenamiento y propondrá una
              versión organizada. El archivo original no se modifica.
            </DialogDescription>
          </DialogHeader>

          {!jobId ? (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium" htmlFor="structure-instructions">
                Instrucciones opcionales
              </label>
              <Textarea
                id="structure-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Ej.: ordena por temas, añade preguntas de repaso, usa tono académico…"
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                Se aplicará un esquema base y se conservarán hechos, enlaces y
                bloques de código.
              </p>
            </div>
          ) : null}

          {jobId ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {running ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : job?.status === "FAILED" ? (
                  <TriangleAlertIcon className="size-4 text-destructive" />
                ) : (
                  <SparklesIcon className="size-4" />
                )}
                <span>{job ? statusLabel(job.status) : "Cargando estado…"}</span>
              </div>

              {job?.status === "FAILED" ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">
                    {job.error ?? "AGENT_ERROR"}
                  </p>
                  <p className="text-muted-foreground">
                    El apunte original sigue intacto. Puedes reintentar creando
                    un nuevo job.
                  </p>
                </div>
              ) : null}

              {job?.warnings?.length ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <p className="font-medium">Advertencias del agente</p>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {job.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result ? (
                <Tabs defaultValue="structured" className="min-h-0">
                  <TabsList>
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="structured">Estructurado</TabsTrigger>
                    <TabsTrigger value="diff">Cambios</TabsTrigger>
                  </TabsList>
                  <TabsContent value="original" className="max-h-[50vh] overflow-auto rounded-lg border bg-card p-3">
                    <MarkdownView content={originalContent} />
                  </TabsContent>
                  <TabsContent value="structured" className="max-h-[50vh] overflow-auto rounded-lg border bg-card p-3">
                    <MarkdownView content={result} />
                  </TabsContent>
                  <TabsContent value="diff">
                    <DiffView original={originalContent} structured={result} />
                  </TabsContent>
                </Tabs>
              ) : null}

              {job?.status === "DONE" && job.model ? (
                <p className="text-xs text-muted-foreground">
                  Modelo: {job.model}
                  {job.promptVersion ? ` · ${job.promptVersion}` : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            {jobId ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setJobId(null);
                    setInstructions("");
                  }}
                  disabled={running}
                >
                  {job?.status === "FAILED" ? "Reintentar" : "Nuevo intento"}
                </Button>
                <Button
                  onClick={() => applyJob.mutate()}
                  disabled={!result || applyJob.isPending}
                >
                  {applyJob.isPending
                    ? "Guardando…"
                    : "Guardar como nuevo apunte"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createJob.mutate()}
                  disabled={createJob.isPending}
                >
                  {createJob.isPending ? "Encolando…" : "Estructurar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
