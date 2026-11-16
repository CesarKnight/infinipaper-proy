"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { apiFetch, ApiError } from "@/lib/api";
import type { Quiz, QuizAssignment, QuizAttempt } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";

interface Results extends QuizAssignment {
  quiz: Quiz;
  attempts: QuizAttempt[];
}

export default function AssignmentResultsPage() {
  const params = useParams<{ projectId: string; assignmentId: string }>();
  const { projectId, assignmentId } = params;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["assignment-results", assignmentId],
    queryFn: () => apiFetch<Results>(`/assignments/${assignmentId}/results`),
  });

  const publish = useMutation({
    mutationFn: () =>
      apiFetch(`/assignments/${assignmentId}/publish-results`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Resultados publicados");
      queryClient.invalidateQueries({
        queryKey: ["assignment-results", assignmentId],
      });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
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
            render={<Link href={`/projects/${projectId}/assignments`} />}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="font-heading text-2xl font-semibold">
            {data?.quiz.title ?? "Desempeño"}
          </h1>
        </div>

        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {data.attempts.length} intentos · {data.students?.length ?? 0}{" "}
                estudiantes
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
              >
                Publicar resultados
              </Button>
            </div>

            {data.students?.map((student) => {
              const attempts = data.attempts.filter(
                (attempt) => attempt.studentId === student.studentId,
              );
              return (
                <Card key={student.studentId}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {student.student?.displayName ?? student.studentId}
                    </CardTitle>
                    <CardDescription>
                      @{student.student?.username ?? "estudiante"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {attempts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Sin intentos.
                      </p>
                    ) : (
                      attempts.map((attempt) => (
                        <div key={attempt.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm">
                              Intento {attempt.attemptNumber} · {attempt.status}
                            </span>
                            <Badge variant="outline">
                              {attempt.score}/{attempt.maxScore}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-2">
                            {data.quiz.questions.map((question) => {
                              const answer = attempt.answers.find(
                                (item) => item.questionId === question.id,
                              );
                              if (!answer) {
                                return (
                                  <p
                                    key={question.id}
                                    className="text-xs text-muted-foreground"
                                  >
                                    {question.prompt}: sin respuesta
                                  </p>
                                );
                              }
                              return (
                                <div
                                  key={question.id}
                                  className="rounded-md bg-muted/40 p-2 text-xs"
                                >
                                  <p className="font-medium text-foreground">
                                    {question.prompt}
                                  </p>
                                  <p>
                                    Respuesta:{" "}
                                    {answer.text ??
                                      question.options.find(
                                        (option) =>
                                          option.id === answer.optionId,
                                      )?.text ??
                                      "—"}
                                  </p>
                                  <p>
                                    Puntos: {answer.pointsAwarded ?? "pendiente"}
                                    /{question.points}
                                  </p>
                                  {question.type === "SHORT_ANSWER" &&
                                  answer.pointsAwarded === null ? (
                                    <GradeAnswerForm
                                      attemptId={attempt.id}
                                      answerId={answer.id}
                                      maxPoints={question.points}
                                      onGraded={() =>
                                        queryClient.invalidateQueries({
                                          queryKey: [
                                            "assignment-results",
                                            assignmentId,
                                          ],
                                        })
                                      }
                                    />
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </main>
    </>
  );
}

function GradeAnswerForm({
  attemptId,
  answerId,
  maxPoints,
  onGraded,
}: {
  attemptId: string;
  answerId: string;
  maxPoints: number;
  onGraded: () => void;
}) {
  const [points, setPoints] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");
  const grade = useMutation({
    mutationFn: () =>
      apiFetch(`/attempts/${attemptId}/answers/${answerId}/grade`, {
        method: "PATCH",
        body: { points, feedback: feedback || undefined },
      }),
    onSuccess: () => {
      toast.success("Respuesta calificada");
      onGraded();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <Input
        type="number"
        min={0}
        max={maxPoints}
        value={points}
        onChange={(event) => setPoints(Number(event.target.value) || 0)}
        className="w-20"
      />
      <Input
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        placeholder="Feedback"
        className="min-w-40 flex-1"
      />
      <Button
        size="sm"
        onClick={() => grade.mutate()}
        disabled={grade.isPending}
      >
        Calificar
      </Button>
    </div>
  );
}
