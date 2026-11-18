"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { SearchResponse } from "@/lib/types";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";

export default function ProjectSearchPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [q, setQ] = React.useState("");
  const [kind, setKind] = React.useState("all");
  const [origin, setOrigin] = React.useState("all");
  const [validationStatus, setValidationStatus] = React.useState("all");

  const query = new URLSearchParams();
  if (q.trim()) query.set("q", q.trim());
  if (kind !== "all") query.set("kind", kind);
  if (origin !== "all") query.set("origin", origin);
  if (validationStatus !== "all") query.set("validationStatus", validationStatus);

  const { data, isFetching } = useQuery({
    queryKey: ["search", projectId, q, kind, origin, validationStatus],
    enabled: q.trim().length > 1,
    queryFn: () =>
      apiFetch<SearchResponse>(
        `/projects/${projectId}/search?${query.toString()}`,
      ),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Volver"
            render={<Link href={`/projects/${projectId}`} />}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="font-heading text-2xl font-semibold">Buscar en el proyecto</h1>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Ej. diferencia entre sprint y revisión"
            />
            <Button disabled={q.trim().length < 2 || isFetching}>
              <SearchIcon data-icon="inline-start" />
              Buscar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={kind}
              onValueChange={(value) => setKind(value ?? "all")}
              items={[
                { label: "Todo tipo", value: "all" },
                { label: "Markdown", value: "MARKDOWN" },
                { label: "Quiz", value: "QUIZ" },
                { label: "Mapa mental", value: "MINDMAP" },
              ]}
            >
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo tipo</SelectItem>
                <SelectItem value="MARKDOWN">Markdown</SelectItem>
                <SelectItem value="QUIZ">Quiz</SelectItem>
                <SelectItem value="MINDMAP">Mapa mental</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={origin}
              onValueChange={(value) => setOrigin(value ?? "all")}
              items={[
                { label: "Todo origen", value: "all" },
                { label: "Apunte", value: "NOTE" },
                { label: "IA", value: "AI_STRUCTURE" },
                { label: "Mapa IA", value: "AI_MINDMAP" },
                { label: "Quiz IA", value: "AI_QUIZ" },
              ]}
            >
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo origen</SelectItem>
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
        </div>

        {isFetching ? (
          <Skeleton className="h-40 w-full" />
        ) : data ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {data.results.length} resultado(s)
              </CardTitle>
              <CardDescription>
                Modo: {data.mode}
                {data.warning ? ` · ${data.warning}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {data.results.map((result) => (
                <Link
                  key={result.chunkId}
                  href={`/projects/${projectId}/files/${result.resourceId}`}
                  className="rounded-md border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{result.name}</span>
                    <Badge variant="outline">{result.kind}</Badge>
                    <Badge variant="outline">{result.validationStatus}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {result.score}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {result.fragment}
                  </p>
                </Link>
              ))}
              {data.results.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay resultados.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Escribe al menos dos caracteres para buscar.
          </p>
        )}
      </main>
    </>
  );
}
