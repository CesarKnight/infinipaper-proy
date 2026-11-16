"use client";

import Link from "next/link";
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
import type { QuizAssignment } from "@/lib/types";

export default function AssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["assignments", "mine"],
    queryFn: () => apiFetch<QuizAssignment[]>("/assignments/mine"),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Mis tareas</h1>
          <p className="text-sm text-muted-foreground">
            Cuestionarios asignados a ti en tus proyectos.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((assignment) => {
              const latest = assignment.attempts?.[0];
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {assignment.quiz?.title ?? "Cuestionario"}
                      </CardTitle>
                      <Badge variant="outline">{assignment.status}</Badge>
                    </div>
                    <CardDescription>
                      {assignment.dueAt
                        ? `Entrega: ${new Date(assignment.dueAt).toLocaleString("es")}`
                        : "Sin fecha límite"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {latest
                        ? `Intento ${latest.attemptNumber}: ${latest.status}`
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
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No tienes tareas asignadas.
          </p>
        )}
      </main>
    </>
  );
}
