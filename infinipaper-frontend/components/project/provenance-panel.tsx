"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  Resource,
  ResourceOrigin,
  ValidationStatus,
} from "@/lib/types";

const ORIGIN_LABEL: Record<ResourceOrigin, string> = {
  UPLOAD: "Subida",
  NOTE: "Apunte",
  TRANSCRIPTION: "Transcripción",
  AI_STRUCTURE: "IA · estructura",
  AI_MINDMAP: "IA · mapa mental",
  AI_QUIZ: "IA · cuestionario",
  QUIZ: "Cuestionario",
  IMPORT: "Importado",
};

const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  UNVERIFIED: "No verificado",
  PENDING: "Pendiente",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
};

export function ProvenancePanel({
  resource,
  canEdit,
  projectId,
}: {
  resource: Resource;
  canEdit: boolean;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = React.useState("");
  const query = useQuery({
    queryKey: ["provenance", resource.id],
    queryFn: () => apiFetch<Resource>(`/files/${resource.id}/provenance`),
  });
  const current = query.data ?? resource;

  const validate = useMutation({
    mutationFn: (status: "VERIFIED" | "REJECTED") =>
      apiFetch<Resource>(`/files/${resource.id}/validate`, {
        method: "POST",
        body: { status, note: note || undefined },
      }),
    onSuccess: () => {
      toast.success("Validación guardada");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["provenance", resource.id] });
      queryClient.invalidateQueries({ queryKey: ["file", resource.id] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const sources = current.sources ?? [];
  const unverified = sources.some(
    (source) => source.sourceResource?.validationStatus !== "VERIFIED",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Procedencia y validación</CardTitle>
        <CardDescription>
          Origen del recurso y fuentes utilizadas para generarlo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {ORIGIN_LABEL[current.origin] ?? current.origin}
          </Badge>
          <Badge
            variant={
              current.validationStatus === "VERIFIED"
                ? "secondary"
                : current.validationStatus === "REJECTED"
                  ? "destructive"
                  : "outline"
            }
          >
            {VALIDATION_LABEL[current.validationStatus] ??
              current.validationStatus}
          </Badge>
          {current.validatedBy ? (
            <span className="text-xs text-muted-foreground">
              por {current.validatedBy.displayName}
              {current.validatedAt
                ? ` · ${new Date(current.validatedAt).toLocaleDateString("es")}`
                : ""}
            </span>
          ) : null}
        </div>

        {current.validationNote ? (
          <p className="rounded-md bg-muted/40 p-2 text-muted-foreground">
            {current.validationNote}
          </p>
        ) : null}

        {unverified && sources.length > 0 ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-amber-900 dark:text-amber-200">
            Este recurso deriva de fuentes no verificadas. Revísalas antes de
            usarlo como material definitivo.
          </p>
        ) : null}

        {sources.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Fuentes
            </span>
            <ul className="flex flex-col gap-1">
              {sources.map((source) => (
                <li key={source.id}>
                  {source.sourceResource ? (
                    <Link
                      className="underline"
                      href={`/projects/${projectId}/files/${source.sourceResource.id}`}
                    >
                      {source.sourceResource.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">
                      Fuente eliminada
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground">Origen propio, sin fuentes externas.</p>
        )}

        {canEdit ? (
          <div className="flex flex-wrap items-end gap-2 border-t pt-3">
            <Input
              placeholder="Comentario de validación (opcional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-w-48 flex-1"
            />
            <Button
              size="sm"
              onClick={() => validate.mutate("VERIFIED")}
              disabled={validate.isPending}
            >
              Verificar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => validate.mutate("REJECTED")}
              disabled={validate.isPending}
            >
              Rechazar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
