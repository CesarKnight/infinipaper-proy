"use client";

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
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { MyProgress } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";

export default function MyProgressPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { data, isLoading } = useQuery({
    queryKey: ["my-progress", projectId],
    queryFn: () => apiFetch<MyProgress>(`/projects/${projectId}/my-progress`),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Volver"
            render={<Link href={`/projects/${projectId}`} />}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="font-heading text-2xl font-semibold">Mi progreso</h1>
        </div>
        {isLoading || !data ? (
          <Skeleton className="h-40 w-full" />
        ) : data.assignments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No tienes tareas asignadas.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{assignment.title}</CardTitle>
                      <CardDescription>
                        {assignment.dueAt
                          ? `Entrega: ${new Date(assignment.dueAt).toLocaleString("es")}`
                          : "Sin fecha límite"}
                      </CardDescription>
                    </div>
                    <Badge variant={assignment.completed ? "secondary" : "outline"}>
                      {assignment.completed ? "Completada" : "Pendiente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {assignment.latestAttempt
                      ? `Intento ${assignment.latestAttempt.attemptNumber}: ${assignment.latestAttempt.score}/${assignment.latestAttempt.maxScore}`
                      : `${assignment.attemptsAllowed} intento(s)`}
                  </span>
                  <Button
                    size="sm"
                    render={<Link href={`/assignments/${assignment.id}`} />}
                  >
                    Abrir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
