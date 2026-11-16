"use client";

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
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser, TeacherProfile, TeacherStatus } from "@/lib/types";

interface AdminTeacherProfile extends TeacherProfile {
  user: PublicUser & { email: string; emailVerifiedAt: string | null };
}

export default function AdminTeacherVerificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "teacher-verifications"],
    queryFn: () =>
      apiFetch<AdminTeacherProfile[]>("/admin/teacher-verifications"),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "teacher-verifications"],
    });

  const approve = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/teacher-verifications/${id}/approve`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      toast.success("Docente aprobado");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Error"),
  });

  const reject = useMutation({
    mutationFn: (id: string) => {
      const reason = window.prompt("Motivo del rechazo");
      if (!reason?.trim()) {
        throw new ApiError(422, "REASON_REQUIRED", "El motivo es obligatorio");
      }
      return apiFetch(`/admin/teacher-verifications/${id}/reject`, {
        method: "POST",
        body: { reason },
      });
    },
    onSuccess: () => {
      toast.success("Solicitud rechazada");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Error"),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Verificaciones docentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Revisa solicitudes manuales y audita las decisiones.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {error instanceof ApiError
              ? error.message
              : "No se pudieron cargar las solicitudes."}
          </p>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4">
            {data.map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {profile.user.displayName}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          @{profile.user.username}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {profile.institution}
                        {profile.area ? ` · ${profile.area}` : ""}
                        {profile.position ? ` · ${profile.position}` : ""}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        profile.status === "VERIFIED" ? "default" : "outline"
                      }
                    >
                      {profile.status as TeacherStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    <p>{profile.user.email}</p>
                    {profile.evidenceUrl ? (
                      <a
                        href={profile.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Ver evidencia
                      </a>
                    ) : null}
                  </div>
                  {profile.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approve.mutate(profile.id)}
                        disabled={approve.isPending}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reject.mutate(profile.id)}
                        disabled={reject.isPending}
                      >
                        Rechazar
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No hay solicitudes docentes.
          </p>
        )}
      </main>
    </>
  );
}
