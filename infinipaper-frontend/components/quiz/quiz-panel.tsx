"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import type { Quiz } from "@/lib/types";
import { ClipboardListIcon, PencilIcon } from "lucide-react";

export function QuizPanel({
  quizId,
  projectId,
  canEdit,
}: {
  quizId: string;
  projectId: string;
  canEdit: boolean;
}) {
  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => apiFetch<Quiz>(`/quizzes/${quizId}`),
  });

  if (isLoading || !quiz) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardListIcon className="size-4" />
              {quiz.title}
            </CardTitle>
            <CardDescription>
              {quiz.instructions ?? "Sin instrucciones adicionales."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{quiz.status}</Badge>
            {canEdit ? (
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link href={`/projects/${projectId}/quizzes/${quiz.id}`} />
                }
              >
                <PencilIcon data-icon="inline-start" />
                Editar
              </Button>
            ) : (
              <Button size="sm" render={<Link href="/assignments" />}>
                Ir a mis tareas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>
          {quiz.questions.length} pregunta
          {quiz.questions.length === 1 ? "" : "s"} ·{" "}
          {quiz.questions.reduce((total, question) => total + question.points, 0)}{" "}
          puntos
        </p>
        {canEdit
          ? quiz.questions.map((question) => (
              <div key={question.id} className="rounded-lg border p-3">
                <p className="font-medium text-foreground">{question.prompt}</p>
                <p className="text-xs">
                  {question.type} · {question.points} punto
                  {question.points === 1 ? "" : "s"}
                </p>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
}
