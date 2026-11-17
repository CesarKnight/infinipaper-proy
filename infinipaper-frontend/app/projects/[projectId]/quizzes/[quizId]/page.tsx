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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  ProjectMember,
  Quiz,
  QuizQuestionType,
} from "@/lib/types";
import { ArrowLeftIcon, PlusIcon, SendIcon } from "lucide-react";

interface DraftOption {
  text: string;
  isCorrect: boolean;
}

interface DraftQuestion {
  type: QuizQuestionType;
  prompt: string;
  points: number;
  correctText?: string;
  sourceRefs?: string[];
  options?: DraftOption[];
}

function toDraft(quiz: Quiz): DraftQuestion[] {
  return quiz.questions.map((question) => ({
    type: question.type,
    prompt: question.prompt,
    points: question.points,
    correctText: question.correctText ?? undefined,
    sourceRefs: question.sourceRefs ?? undefined,
    options: question.options.map((option) => ({
      text: option.text,
      isCorrect: option.isCorrect,
    })),
  }));
}

export default function QuizEditorPage() {
  const params = useParams<{ projectId: string; quizId: string }>();
  const { projectId, quizId } = params;
  const queryClient = useQueryClient();

  const quizQuery = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => apiFetch<Quiz>(`/quizzes/${quizId}`),
  });
  const quiz = quizQuery.data;

  const [questions, setQuestions] = React.useState<DraftQuestion[]>([]);
  const [title, setTitle] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (quiz && !loaded) {
      // Inicialización única desde la respuesta asíncrona del servidor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuestions(toDraft(quiz));
      setTitle(quiz.title);
      setInstructions(quiz.instructions ?? "");
      setLoaded(true);
    }
  }, [quiz, loaded]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["quiz", quizId] });
    queryClient.invalidateQueries({ queryKey: ["files"] });
  };

  const saveQuiz = useMutation({
    mutationFn: () =>
      apiFetch(`/quizzes/${quizId}`, {
        method: "PATCH",
        body: { title, instructions: instructions || undefined },
      }),
    onSuccess: () => {
      toast.success("Cuestionario actualizado");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const saveQuestions = useMutation({
    mutationFn: () =>
      apiFetch(`/quizzes/${quizId}/questions`, {
        method: "PUT",
        body: { questions },
      }),
    onSuccess: () => {
      toast.success("Preguntas guardadas");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const publish = useMutation({
    mutationFn: () =>
      apiFetch(`/quizzes/${quizId}/publish`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Cuestionario publicado");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const membersQuery = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => apiFetch<ProjectMember[]>(`/projects/${projectId}/members`),
  });

  const assign = useMutation({
    mutationFn: async () => {
      const studentIds = (membersQuery.data ?? [])
        .filter((member) => member.role === "STUDENT")
        .map((member) => member.userId);
      if (!studentIds.length) {
        throw new ApiError(422, "NO_STUDENTS", "No hay estudiantes en el proyecto");
      }
      const assignment = await apiFetch<{ id: string }>(
        `/quizzes/${quizId}/assignments`,
        {
          method: "POST",
          body: { studentIds, attemptsAllowed: 1 },
        },
      );
      await apiFetch(`/assignments/${assignment.id}/publish`, {
        method: "POST",
      });
      return assignment;
    },
    onSuccess: () => {
      toast.success("Tarea asignada a los estudiantes");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  if (quizQuery.isLoading || !quiz) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </>
    );
  }

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
          <h1 className="font-heading text-2xl font-semibold">
            Editar cuestionario
          </h1>
          <Badge variant="outline">{quiz.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
            <CardDescription>
              El cuestionario aparece como un recurso más en la carpeta.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="instructions">Instrucciones</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => saveQuiz.mutate()}
                disabled={!title.trim() || saveQuiz.isPending}
              >
                Guardar datos
              </Button>
              <Button
                onClick={() => publish.mutate()}
                disabled={quiz.status === "PUBLISHED" || publish.isPending}
              >
                Publicar
              </Button>
              <Button
                variant="secondary"
                onClick={() => assign.mutate()}
                disabled={quiz.status !== "PUBLISHED" || assign.isPending}
              >
                <SendIcon data-icon="inline-start" />
                Asignar a estudiantes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preguntas</CardTitle>
            <CardDescription>
              {questions.length} pregunta{questions.length === 1 ? "" : "s"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {questions.map((question, index) => (
              <div key={index} className="rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{question.prompt}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Quitar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {question.type} · {question.points} punto
                  {question.points === 1 ? "" : "s"}
                  {question.sourceRefs?.length
                    ? ` · ${question.sourceRefs.length} fuente(s)`
                    : ""}
                </p>
                {question.options?.length ? (
                  <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                    {question.options.map((option, optionIndex) => (
                      <li key={optionIndex}>
                        {option.text} {option.isCorrect ? "✓" : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            <AddQuestionForm
              onAdd={(question) =>
                setQuestions((current) => [...current, question])
              }
            />

            <div className="flex justify-end">
              <Button
                onClick={() => saveQuestions.mutate()}
                disabled={!questions.length || saveQuestions.isPending}
              >
                Guardar preguntas
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function AddQuestionForm({
  onAdd,
}: {
  onAdd: (question: DraftQuestion) => void;
}) {
  const [type, setType] = React.useState<QuizQuestionType>("MULTIPLE_CHOICE");
  const [prompt, setPrompt] = React.useState("");
  const [points, setPoints] = React.useState(1);
  const [optionA, setOptionA] = React.useState("");
  const [optionB, setOptionB] = React.useState("");
  const [correct, setCorrect] = React.useState<"A" | "B">("A");
  const [correctText, setCorrectText] = React.useState("");

  function add() {
    if (!prompt.trim()) return;
    const question: DraftQuestion =
      type === "SHORT_ANSWER"
        ? {
            type,
            prompt: prompt.trim(),
            points,
            correctText: correctText.trim() || undefined,
          }
        : {
            type,
            prompt: prompt.trim(),
            points,
            options:
              type === "TRUE_FALSE"
                ? [
                    { text: "Verdadero", isCorrect: correct === "A" },
                    { text: "Falso", isCorrect: correct === "B" },
                  ]
                : [
                    { text: optionA.trim(), isCorrect: correct === "A" },
                    { text: optionB.trim(), isCorrect: correct === "B" },
                  ],
          };
    onAdd(question);
    setPrompt("");
    setOptionA("");
    setOptionB("");
    setCorrectText("");
  }

  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="mb-2 text-sm font-medium">Añadir pregunta</p>
      <div className="flex flex-col gap-2">
        <Select
          value={type}
          onValueChange={(value) => setType(value as QuizQuestionType)}
          items={[
            { label: "Opción múltiple", value: "MULTIPLE_CHOICE" },
            { label: "Verdadero/Falso", value: "TRUE_FALSE" },
            { label: "Respuesta corta", value: "SHORT_ANSWER" },
          ]}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MULTIPLE_CHOICE">Opción múltiple</SelectItem>
            <SelectItem value="TRUE_FALSE">Verdadero/Falso</SelectItem>
            <SelectItem value="SHORT_ANSWER">Respuesta corta</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Enunciado"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <Input
          type="number"
          min={1}
          value={points}
          onChange={(event) => setPoints(Number(event.target.value) || 1)}
        />
        {type === "SHORT_ANSWER" ? (
          <Input
            placeholder="Respuesta esperada (opcional; la califica el docente)"
            value={correctText}
            onChange={(event) => setCorrectText(event.target.value)}
          />
        ) : type === "TRUE_FALSE" ? (
          <Select
            value={correct}
            onValueChange={(value) => setCorrect(value as "A" | "B")}
            items={[
              { label: "Verdadero", value: "A" },
              { label: "Falso", value: "B" },
            ]}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Verdadero</SelectItem>
              <SelectItem value="B">Falso</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              placeholder="Opción A"
              value={optionA}
              onChange={(event) => setOptionA(event.target.value)}
            />
            <Input
              placeholder="Opción B"
              value={optionB}
              onChange={(event) => setOptionB(event.target.value)}
            />
            <Select
              value={correct}
              onValueChange={(value) => setCorrect(value as "A" | "B")}
              items={[
                { label: "Correcta: A", value: "A" },
                { label: "Correcta: B", value: "B" },
              ]}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Correcta: A</SelectItem>
                <SelectItem value="B">Correcta: B</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        <Button
          size="sm"
          onClick={add}
          disabled={
            !prompt.trim() ||
            (type === "MULTIPLE_CHOICE" && (!optionA.trim() || !optionB.trim()))
          }
        >
          <PlusIcon data-icon="inline-start" />
          Añadir
        </Button>
      </div>
    </div>
  );
}
