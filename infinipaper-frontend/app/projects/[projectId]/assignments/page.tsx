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
import type { QuizAssignment } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";

export default function ProjectAssignmentsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { data, isLoading } = useQuery({
    queryKey: ["project-assignments", projectId],
    queryFn: () =>
      apiFetch<QuizAssignment[]>(`/projects/${projectId}/assignments`),
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
          <h1 className="font-heading text-2xl font-semibold">Tareas del curso</h1>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : data && data.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {assignment.quiz?.title ?? "Cuestionario"}
                      </CardTitle>
                      <CardDescription>
                        {assignment._count?.students ?? 0} estudiantes ·{" "}
                        {assignment._count?.attempts ?? 0} intentos
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{assignment.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <Link
                        href={`/projects/${projectId}/assignments/${assignment.id}`}
                      />
                    }
                  >
                    Revisar desempeño
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aún no hay tareas asignadas.
          </p>
        )}
      </main>
    </>
  );
}
