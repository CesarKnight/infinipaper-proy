"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { UsagePanel } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";

export default function ResourceUsagePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [origin, setOrigin] = React.useState("all");
  const [validationStatus, setValidationStatus] = React.useState("all");
  const [resourceKind, setResourceKind] = React.useState("all");

  const query = new URLSearchParams();
  if (origin !== "all") query.set("origin", origin);
  if (validationStatus !== "all") query.set("validationStatus", validationStatus);
  if (resourceKind !== "all") query.set("resourceKind", resourceKind);

  const { data, isLoading } = useQuery({
    queryKey: ["usage", projectId, origin, validationStatus, resourceKind],
    queryFn: () =>
      apiFetch<UsagePanel>(
        `/projects/${projectId}/usage${query.toString() ? `?${query}` : ""}`,
      ),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Volver"
              render={<Link href={`/projects/${projectId}/analytics`} />}
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="font-heading text-2xl font-semibold">Uso de recursos</h1>
          </div>
          <a
            className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium"
            href={`/api/v1/projects/${projectId}/usage/export${
              query.toString() ? `?${query}` : ""
            }`}
          >
            Exportar CSV
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={resourceKind}
            onValueChange={(value) => setResourceKind(value ?? "all")}
            items={[
              { label: "Todo tipo", value: "all" },
              { label: "Markdown", value: "MARKDOWN" },
              { label: "Quiz", value: "QUIZ" },
              { label: "Mapa mental", value: "MINDMAP" },
              { label: "Audio", value: "AUDIO" },
            ]}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo tipo</SelectItem>
              <SelectItem value="MARKDOWN">Markdown</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="MINDMAP">Mapa mental</SelectItem>
              <SelectItem value="AUDIO">Audio</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={origin}
            onValueChange={(value) => setOrigin(value ?? "all")}
            items={[
              { label: "Todo origen", value: "all" },
              { label: "Subida", value: "UPLOAD" },
              { label: "Apunte", value: "NOTE" },
              { label: "IA", value: "AI_STRUCTURE" },
              { label: "Mapa IA", value: "AI_MINDMAP" },
              { label: "Quiz IA", value: "AI_QUIZ" },
            ]}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo origen</SelectItem>
              <SelectItem value="UPLOAD">Subida</SelectItem>
              <SelectItem value="NOTE">Apunte</SelectItem>
              <SelectItem value="AI_STRUCTURE">IA</SelectItem>
              <SelectItem value="AI_MINDMAP">Mapa IA</SelectItem>
              <SelectItem value="AI_QUIZ">Quiz IA</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={validationStatus}
            onValueChange={(value) => setValidationStatus(value ?? "all")}
            items={[
              { label: "Toda validación", value: "all" },
              { label: "No verificado", value: "UNVERIFIED" },
              { label: "Verificado", value: "VERIFIED" },
              { label: "Rechazado", value: "REJECTED" },
            ]}
          >
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda validación</SelectItem>
              <SelectItem value="UNVERIFIED">No verificado</SelectItem>
              <SelectItem value="VERIFIED">Verificado</SelectItem>
              <SelectItem value="REJECTED">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Eventos" value={data.summary.events} />
              <Metric label="Recursos" value={data.summary.resources} />
              <Metric label="Usuarios únicos" value={data.summary.uniqueUsers} />
              <Metric label="Retención" value={`${data.summary.retentionDays} días`} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actividad por recurso</CardTitle>
                <CardDescription>
                  Vistas, descargas, apariciones en búsqueda y uso en quiz.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="pb-2">Recurso</th>
                      <th className="pb-2">Vistas</th>
                      <th className="pb-2">Descargas</th>
                      <th className="pb-2">Búsquedas</th>
                      <th className="pb-2">Quiz</th>
                      <th className="pb-2">Únicos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.resources.map((row, index) => (
                      <tr key={`${row.resourceId ?? "deleted"}-${index}`} className="border-t">
                        <td className="py-2">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.kind} · {row.origin} · {row.validationStatus}
                          </div>
                        </td>
                        <td>{row.view}</td>
                        <td>{row.download}</td>
                        <td>{row.searchHit}</td>
                        <td>{row.quizUse}</td>
                        <td>{row.uniqueUsers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.resources.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sin actividad registrada.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
