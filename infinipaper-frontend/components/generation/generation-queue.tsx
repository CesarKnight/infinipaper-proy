"use client";

import {
  BrainCircuitIcon,
  Clock3Icon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import { useGenerationQueue } from "@/lib/use-generation-queue";
import type { GenerationQueueItem } from "@/lib/types";

const STAGE_LABEL: Record<string, string> = {
  EXTRACTING: "Extrayendo fuentes",
  GENERATING: "Generando",
  SAVING: "Guardando",
};

export function GenerationQueue({
  projectId,
  canEdit,
}: {
  projectId: string;
  canEdit: boolean;
}) {
  const query = useGenerationQueue(projectId, canEdit);
  const items = query.data?.items ?? [];
  if (!canEdit || query.isLoading) return null;
  if (query.isError) {
    return (
      <section className="rounded-lg border bg-card p-3 text-sm shadow-xs">
        <p className="text-muted-foreground">
          No se pudo cargar la cola de generaciones.
        </p>
        <button
          type="button"
          className="mt-2 text-xs underline"
          onClick={() => void query.refetch()}
        >
          Reintentar
        </button>
      </section>
    );
  }
  if (!items.length) return null;

  return (
    <section
      className="rounded-lg border bg-card p-3 shadow-xs"
      aria-label="Generaciones en curso"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          <h2 className="text-sm font-medium">Generaciones en curso</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Visible para Owner y Editor
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <GenerationQueueRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function GenerationQueueRow({ item }: { item: GenerationQueueItem }) {
  const isMap = item.type === "MINDMAP";
  const Icon = isMap ? BrainCircuitIcon : SparklesIcon;
  const stage = item.stage ? (STAGE_LABEL[item.stage] ?? item.stage) : "En cola";
  const progress =
    item.progress && item.progress.total > 0
      ? Math.min(
          100,
          Math.round((item.progress.completed / item.progress.total) * 100),
        )
      : null;
  const requester = item.requestedBy?.displayName ?? "Alguien del equipo";
  const sourceLabel =
    item.sourceCount === 1
      ? item.sourceNames[0] ?? "1 archivo"
      : `${item.sourceCount} archivos`;

  return (
    <li className="rounded-md border bg-background/60 px-3 py-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-muted p-1.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium">
              {isMap ? "Mapa mental" : "Cuestionario"}
            </span>
            <span className="text-muted-foreground">por {requester}</span>
            <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
              {stage}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.folder.name} · {sourceLabel}
            {item.sourceNames.length > 1
              ? ` · ${item.sourceNames.join(", ")}`
              : ""}
          </p>
          {progress !== null ? (
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${isMap ? "mapa mental" : "cuestionario"}`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <Clock3Icon className="size-3" />
          {new Date(item.createdAt).toLocaleTimeString("es", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </li>
  );
}
