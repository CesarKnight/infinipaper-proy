"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import type { Project, Quiz, QuizSubmissionDetail, User } from "@/lib/types";
import { ArrowLeftIcon, CheckCircle2Icon, ClipboardListIcon, PlusIcon, Trash2Icon } from "lucide-react";

interface DraftQuestion {
  text: string;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}

export default function ProjectQuizzesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [mode, setMode] = React.useState<"list" | "create" | "solve">("list");
  const [selectedQuizId, setSelectedQuizId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => apiFetch<User>("/auth/me") });
  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => apiFetch<Project>(`/projects/${projectId}`) });
  const quizzesQuery = useQuery({ queryKey: ["project-quizzes", projectId], queryFn: () => apiFetch<Quiz[]>(`/projects/${projectId}/quizzes`) });

  const canCreate = Boolean(meQuery.data?.isTeacher) && (projectQuery.data?.role === "owner" || projectQuery.data?.role === "editor");

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" render={<Link href={`/projects/${projectId}`} />}>
              <ArrowLeftIcon className="mr-1 size-4" /> Volver
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-semibold">Cuestionarios tarea</h1>
              <p className="text-sm text-muted-foreground">{projectQuery.data?.name ?? "Cargando..."}</p>
            </div>
          </div>
          {mode === "list" && canCreate ? (
            <Button onClick={() => { setFeedback(null); setMode("create"); }}>
              <PlusIcon className="mr-1.5 size-4" /> Crear cuestionario
            </Button>
          ) : mode !== "list" ? (
            <Button variant="outline" onClick={() => { setMode("list"); setSelectedQuizId(null); }}>
              Ver lista
            </Button>
          ) : null}
        </div>

        {feedback ? <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600">{feedback}</div> : null}

        {mode === "create" ? (
          <CreateQuizForm
            projectId={projectId}
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["project-quizzes", projectId] });
              setFeedback("Cuestionario publicado correctamente.");
              setMode("list");
            }}
          />
        ) : mode === "solve" && selectedQuizId ? (
          <SolveQuizView
            projectId={projectId}
            quizId={selectedQuizId}
            onFinished={() => queryClient.invalidateQueries({ queryKey: ["project-quizzes", projectId] })}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {quizzesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando cuestionarios...</p>
            ) : !quizzesQuery.data?.length ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
                <ClipboardListIcon className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium">No hay cuestionarios publicados aún</p>
              </div>
            ) : (
              quizzesQuery.data.map((quiz) => (
                <div key={quiz.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{quiz.title}</h2>
                      {quiz.mySubmission ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2Icon className="size-3.5" /> Nota: {quiz.mySubmission.score} / {quiz.mySubmission.maxScore}
                        </span>
                      ) : null}
                    </div>
                    {quiz.description ? <p className="text-sm text-muted-foreground">{quiz.description}</p> : null}
                    <p className="text-xs text-muted-foreground">{quiz._count?.questions ?? 0} preguntas · Por {quiz.creator?.displayName ?? "Docente"}</p>
                  </div>
                  <Button variant={quiz.mySubmission ? "outline" : "default"} size="sm" onClick={() => { setFeedback(null); setSelectedQuizId(quiz.id); setMode("solve"); }}>
                    {quiz.mySubmission ? "Ver mi resultado" : "Resolver cuestionario"}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}
function CreateQuizForm({ projectId, onCreated }: { projectId: string; onCreated: () => void }) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [questions, setQuestions] = React.useState<DraftQuestion[]>([
    { text: "", points: 10, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] },
  ]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}/quizzes`, { method: "POST", body: { title, description: description || undefined, status: "PUBLISHED", questions } }),
    onSuccess: onCreated,
    onError: (err) => setErrorMsg(err instanceof ApiError ? err.message : "Error al crear cuestionario"),
  });

  const addQuestion = () => setQuestions((prev) => [...prev, { text: "", points: 10, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] }]);
  const addOption = (qIndex: number) => setQuestions((prev) => prev.map((q, idx) => (idx === qIndex ? { ...q, options: [...q.options, { text: "", isCorrect: false }] } : q)));
  const setCorrectOption = (qIndex: number, optIndex: number) => setQuestions((prev) => prev.map((q, idx) => (idx === qIndex ? { ...q, options: q.options.map((o, oIdx) => ({ ...o, isCorrect: oIdx === optIndex })) } : q)));

  return (
    <form onSubmit={(e) => { e.preventDefault(); setErrorMsg(null); mutation.mutate(); }} className="flex flex-col gap-6 rounded-lg border p-6">
      <h2 className="font-heading text-lg font-semibold">Nuevo cuestionario tarea (HU12)</h2>
      {errorMsg ? <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{errorMsg}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Título *</label>
          <Input required placeholder="Ej: Evaluación Unidad 1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Descripción</label>
          <Input placeholder="Indicaciones opcionales" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="flex flex-col gap-3 rounded-md border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Pregunta #{qIdx + 1}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Puntos:</label>
                <Input type="number" min={1} className="h-8 w-20" value={q.points} onChange={(e) => setQuestions((prev) => prev.map((item, idx) => (idx === qIdx ? { ...item, points: Number(e.target.value) || 1 } : item)))} />
                {questions.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))}>
                    <Trash2Icon className="size-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
            </div>
            <Input required placeholder="Escribe el enunciado de la pregunta" value={q.text} onChange={(e) => setQuestions((prev) => prev.map((item, idx) => (idx === qIdx ? { ...item, text: e.target.value } : item)))} />
            <div className="flex flex-col gap-2 pl-2">
              <span className="text-xs text-muted-foreground">Marca la respuesta correcta:</span>
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${qIdx}`} checked={opt.isCorrect} onChange={() => setCorrectOption(qIdx, optIdx)} />
                  <Input required placeholder={`Opción ${optIdx + 1}`} value={opt.text} onChange={(e) => setQuestions((prev) => prev.map((item, idx) => (idx === qIdx ? { ...item, options: item.options.map((o, oI) => (oI === optIdx ? { ...o, text: e.target.value } : o)) } : item)))} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => addOption(qIdx)}>+ Añadir opción</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={addQuestion}><PlusIcon className="mr-1 size-4" /> Añadir otra pregunta</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Publicando..." : "Publicar cuestionario"}</Button>
      </div>
    </form>
  );
}
function SolveQuizView({ projectId, quizId, onFinished }: { projectId: string; quizId: string; onFinished: () => void }) {
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const quizQuery = useQuery({ queryKey: ["quiz-detail", projectId, quizId], queryFn: () => apiFetch<Quiz>(`/projects/${projectId}/quizzes/${quizId}`) });
  const submissionQuery = useQuery({
    queryKey: ["quiz-submission", projectId, quizId],
    queryFn: async () => {
      try {
        return await apiFetch<QuizSubmissionDetail>(`/projects/${projectId}/quizzes/${quizId}/my-submission`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => apiFetch<QuizSubmissionDetail>(`/projects/${projectId}/quizzes/${quizId}/submit`, {
      method: "POST",
      body: { answers: Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })) },
    }),
    onSuccess: () => { submissionQuery.refetch(); onFinished(); },
    onError: (err) => setErrorMsg(err instanceof ApiError ? err.message : "Error al enviar respuestas"),
  });

  if (quizQuery.isLoading || submissionQuery.isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  const quiz = quizQuery.data;
  const submission = submissionQuery.data;
  if (!quiz) return null;

  if (submission) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">{quiz.title}</h2>
            <p className="text-sm text-muted-foreground">Cuestionario completado</p>
          </div>
          <div className="rounded-lg bg-primary/10 px-4 py-2 text-right">
            <p className="text-xs text-muted-foreground">Puntaje obtenido</p>
            <p className="text-2xl font-bold text-primary">{submission.score} / {submission.maxScore}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {submission.answers.map((ans, idx) => (
            <div key={ans.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{idx + 1}. {ans.question?.text}</p>
              <p className="mt-1 text-xs">
                Tu respuesta: <strong>{ans.selectedOption?.text}</strong>{" "}
                {ans.isCorrect ? <span className="text-emerald-600">(Correcta)</span> : <span className="text-destructive">(Incorrecta)</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setErrorMsg(null); submitMutation.mutate(); }} className="flex flex-col gap-6 rounded-lg border p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">{quiz.title}</h2>
        {quiz.description ? <p className="text-sm text-muted-foreground">{quiz.description}</p> : null}
      </div>
      {errorMsg ? <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{errorMsg}</div> : null}

      <div className="flex flex-col gap-4">
        {quiz.questions?.map((q, idx) => (
          <div key={q.id} className="flex flex-col gap-2 rounded-md border p-4">
            <p className="font-medium">{idx + 1}. {q.text} <span className="text-xs text-muted-foreground">({q.points} pts)</span></p>
            <div className="flex flex-col gap-2 pt-1">
              {q.options.map((opt) => (
                <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded border p-2.5 text-sm hover:bg-muted/50">
                  <input type="radio" name={q.id} required checked={selectedAnswers[q.id] === opt.id} onChange={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))} />
                  <span>{opt.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={submitMutation.isPending}>
        {submitMutation.isPending ? "Enviando..." : "Enviar respuestas"}
      </Button>
    </form>
  );
}