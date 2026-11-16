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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";
import type { Quiz, QuizAssignment, QuizAttempt } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";

interface AssignmentDetail extends QuizAssignment {
  quiz: Quiz;
  attempts: QuizAttempt[];
}

interface StartResult {
  attempt: QuizAttempt;
  quiz: Quiz;
}

export default function AssignmentPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;
  const queryClient = useQueryClient();
  const [active, setActive] = React.useState<StartResult | null>(null);
  const [answers, setAnswers] = React.useState<
    Record<string, { optionId?: string; text?: string }>
  >({});

  const detailQuery = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => apiFetch<AssignmentDetail>(`/assignments/${assignmentId}`),
  });

  const start = useMutation({
    mutationFn: () =>
      apiFetch<StartResult>(`/assignments/${assignmentId}/attempts`, {
        method: "POST",
      }),
    onSuccess: (result) => {
      setActive(result);
      setAnswers({});
      toast.success("Intento iniciado");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const saveAnswer = useMutation({
    mutationFn: (variables: {
      questionId: string;
      optionId?: string;
      text?: string;
    }) =>
      apiFetch(`/attempts/${active?.attempt.id}/answers`, {
        method: "PATCH",
        body: variables,
      }),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const submit = useMutation({
    mutationFn: () =>
      apiFetch<QuizAttempt>(`/attempts/${active?.attempt.id}/submit`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Tarea enviada");
      setActive(null);
      queryClient.invalidateQueries({
        queryKey: ["assignment", assignmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["assignments", "mine"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const detail = detailQuery.data;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Volver"
            render={<Link href="/assignments" />}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="font-heading text-2xl font-semibold">
            {detail?.quiz.title ?? "Tarea"}
          </h1>
          {detail ? <Badge variant="outline">{detail.status}</Badge> : null}
        </div>

        {detailQuery.isLoading || !detail ? (
          <Skeleton className="h-64 w-full" />
        ) : active ? (
          <AttemptForm
            quiz={active.quiz}
            answers={answers}
            onChange={(questionId, value) => {
              setAnswers((current) => ({ ...current, [questionId]: value }));
              saveAnswer.mutate({ questionId, ...value });
            }}
            onSubmit={() => submit.mutate()}
            submitting={submit.isPending}
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{detail.quiz.title}</CardTitle>
                <CardDescription>
                  {detail.quiz.instructions ?? "Sin instrucciones."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {detail.quiz.questions.length} preguntas ·{" "}
                  {detail.attemptsAllowed} intento(s)
                </p>
                <div>
                  <Button
                    onClick={() => start.mutate()}
                    disabled={start.isPending || detail.status !== "PUBLISHED"}
                  >
                    {start.isPending ? "Iniciando…" : "Iniciar intento"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mis intentos</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.attempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no has iniciado esta tarea.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {detail.attempts.map((attempt) => (
                      <li
                        key={attempt.id}
                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                      >
                        <span>
                          Intento {attempt.attemptNumber} · {attempt.status}
                        </span>
                        <span className="text-muted-foreground">
                          {attempt.score}/{attempt.maxScore}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}

function AttemptForm({
  quiz,
  answers,
  onChange,
  onSubmit,
  submitting,
}: {
  quiz: Quiz;
  answers: Record<string, { optionId?: string; text?: string }>;
  onChange: (
    questionId: string,
    value: { optionId?: string; text?: string },
  ) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <CardDescription>
          Responde todas las preguntas y envía la tarea.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {index + 1}. {question.prompt}{" "}
              <span className="text-muted-foreground">
                ({question.points} pt)
              </span>
            </p>
            {question.type === "SHORT_ANSWER" ? (
              <Textarea
                value={answers[question.id]?.text ?? ""}
                onChange={(event) =>
                  onChange(question.id, { text: event.target.value })
                }
                placeholder="Tu respuesta"
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <Input
                      type="radio"
                      className="size-4"
                      name={question.id}
                      checked={answers[question.id]?.optionId === option.id}
                      onChange={() =>
                        onChange(question.id, { optionId: option.id })
                      }
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar tarea"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
