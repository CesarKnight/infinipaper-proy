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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { AnalyticsPanel } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";

export default function ProjectAnalyticsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [assignmentId, setAssignmentId] = React.useState("all");
  const [studentId, setStudentId] = React.useState("all");

  const query = new URLSearchParams();
  if (assignmentId !== "all") query.set("assignmentId", assignmentId);
  if (studentId !== "all") query.set("studentId", studentId);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", projectId, assignmentId, studentId],
    queryFn: () =>
      apiFetch<AnalyticsPanel>(
        `/projects/${projectId}/analytics${query.toString() ? `?${query}` : ""}`,
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
              render={<Link href={`/projects/${projectId}`} />}
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="font-heading text-2xl font-semibold">Panel docente</h1>
          </div>
          <a
            className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium"
            href={`/api/v1/projects/${projectId}/analytics/export${
              query.toString() ? `?${query}` : ""
            }`}
          >
            Exportar CSV
          </a>
        </div>

        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Select
                value={assignmentId}
                onValueChange={(value) => setAssignmentId(value ?? "all")}
                items={[
                  { label: "Todas las tareas", value: "all" },
                  ...data.tasks.map((task) => ({
                    label: task.title,
                    value: task.id,
                  })),
                ]}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tareas</SelectItem>
                  {data.tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={studentId}
                onValueChange={(value) => setStudentId(value ?? "all")}
                items={[
                  { label: "Todos los estudiantes", value: "all" },
                  ...data.students.map((student) => ({
                    label: student.displayName,
                    value: student.studentId,
                  })),
                ]}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estudiantes</SelectItem>
                  {data.students.map((student) => (
                    <SelectItem key={student.studentId} value={student.studentId}>
                      {student.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Estudiantes" value={data.summary.students} detail={`${data.summary.pendingStudents} con pendientes`} />
              <Metric label="Tareas" value={data.summary.assignments} detail={`${data.summary.publishedAssignments} publicadas`} />
              <Metric label="Completitud" value={`${data.summary.completion}%`} detail={`${data.summary.pendingGrading} por calificar`} />
              <Metric label="Promedio" value={data.summary.average === null ? "—" : `${data.summary.average}%`} detail={`Mediana ${data.summary.median ?? "—"}%`} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución de notas</CardTitle>
                <CardDescription>
                  Umbral de riesgo: {data.summary.riskThreshold}%.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {data.summary.distribution.map((bucket) => {
                  const max = Math.max(
                    ...data.summary.distribution.map((item) => item.count),
                    1,
                  );
                  return (
                    <div key={bucket.label} className="flex items-center gap-2 text-sm">
                      <span className="w-16 text-muted-foreground">{bucket.label}</span>
                      <div className="h-2 flex-1 rounded bg-muted">
                        <div
                          className="h-2 rounded bg-primary"
                          style={{ width: `${(bucket.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">{bucket.count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estudiantes</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="pb-2">Estudiante</th>
                      <th className="pb-2">Promedio</th>
                      <th className="pb-2">Completadas</th>
                      <th className="pb-2">Pendientes</th>
                      <th className="pb-2">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((student) => (
                      <tr key={student.studentId} className="border-t">
                        <td className="py-2">
                          <div className="font-medium">{student.displayName}</div>
                          <div className="text-xs text-muted-foreground">@{student.username}</div>
                        </td>
                        <td>{student.average === null ? "—" : `${student.average}%`}</td>
                        <td>{student.completed}/{student.assigned}</td>
                        <td>{student.pending}</td>
                        <td>
                          {student.atRisk ? (
                            <Badge variant="destructive" title={student.riskReason ?? ""}>
                              En riesgo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tareas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.tasks.map((task) => (
                    <div key={task.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{task.title}</span>
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {task.completed}/{task.assigned} completadas ·{" "}
                        {task.completion}% · promedio {task.average ?? "—"}%
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dificultad por pregunta</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.questions.map((question) => (
                    <div key={question.id} className="rounded-md border p-2 text-sm">
                      <p className="font-medium">{question.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {question.accuracy === null
                          ? "Sin datos"
                          : `${question.accuracy}% de acierto (${question.correct}/${question.answered})`}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}
