"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError, userAvatarUrl } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { TeacherProfile, User } from "@/lib/types";

export default function MyProfilePage() {
  const { user, isLoading } = useSession();

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="font-heading text-2xl font-semibold">Mi perfil</h1>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : user ? (
          <>
            <ProfileForm user={user} />
            <TeacherVerificationCard user={user} />
          </>
        ) : null}
      </main>
    </>
  );
}

function ProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = React.useState(user.displayName);
  const [bio, setBio] = React.useState(user.bio ?? "");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");

  const updateProfile = useMutation({
    mutationFn: () =>
      apiFetch("/users/me", {
        method: "PATCH",
        body: { displayName, bio },
      }),
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch("/users/me/avatar", { method: "POST", body: form });
    },
    onSuccess: () => {
      toast.success("Avatar actualizado");
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      apiFetch("/users/me/password", {
        method: "PUT",
        body: { currentPassword, newPassword },
      }),
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const archive = useMutation({
    mutationFn: () => apiFetch("/users/me", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const initials = user.displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>Actualiza tu nombre y biografía.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {user.avatarUrl ? (
                <AvatarImage
                  src={userAvatarUrl(user.username)}
                  alt={user.displayName}
                />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadAvatar.mutate(file);
                  event.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploadAvatar.isPending}
              >
                Cambiar avatar
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG o WebP, máx. 5 MB.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Nombre</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
            >
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>
            Introduce tu contraseña actual y la nueva.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current">Contraseña actual</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new">Nueva contraseña</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => changePassword.mutate()}
              disabled={
                !currentPassword ||
                newPassword.length < 8 ||
                changePassword.isPending
              }
            >
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmailVerificationCard user={user} />

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Archivar cuenta</CardTitle>
          <CardDescription>
            Tu cuenta se desactivará. Tus proyectos privados se eliminarán y los
            públicos permanecerán.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              Archivar cuenta
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Archivar tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  No podrás iniciar sesión de nuevo y perderás tus proyectos
                  privados de forma permanente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => archive.mutate()}
                >
                  Archivar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}

function EmailVerificationCard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const resend = useMutation({
    mutationFn: () =>
      apiFetch("/auth/email/verify/request", { method: "POST" }),
    onSuccess: () => {
      toast.success("Correo de confirmación enviado");
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correo electrónico</CardTitle>
        <CardDescription>
          {user.emailVerifiedAt
            ? "Tu correo está confirmado."
            : "Confirma tu correo para poder solicitar la verificación docente."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <span className="text-sm">{user.email}</span>
        {user.emailVerifiedAt ? (
          <Badge variant="secondary">Verificado</Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
          >
            Reenviar correo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function TeacherVerificationCard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [institution, setInstitution] = React.useState("");
  const [area, setArea] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [evidenceUrl, setEvidenceUrl] = React.useState("");

  const profileQuery = useQuery({
    queryKey: ["teacher-verification"],
    queryFn: () => apiFetch<TeacherProfile | null>("/teacher/verification"),
    enabled: user.role !== "ADMIN",
  });

  const request = useMutation({
    mutationFn: () =>
      apiFetch<TeacherProfile>("/teacher/verification", {
        method: "POST",
        body: {
          institution,
          area: area || undefined,
          position: position || undefined,
          evidenceUrl: evidenceUrl || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Solicitud enviada");
      queryClient.invalidateQueries({ queryKey: ["teacher-verification"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  if (user.role === "ADMIN") {
    return null;
  }

  const profile = profileQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil docente</CardTitle>
        <CardDescription>
          La verificación es híbrida: dominio institucional confirmado o revisión
          administrativa.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {profile ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Estado:</span>
            <Badge
              variant={profile.status === "VERIFIED" ? "default" : "outline"}
            >
              {profile.status}
            </Badge>
            {profile.rejectionReason ? (
              <span className="text-destructive">{profile.rejectionReason}</span>
            ) : null}
          </div>
        ) : null}

        {profile?.status === "VERIFIED" ? (
          <p className="text-sm text-muted-foreground">
            Ya puedes crear proyectos de curso.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="institution">Institución</Label>
              <Input
                id="institution"
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="teacherArea">Área</Label>
              <Input
                id="teacherArea"
                value={area}
                onChange={(event) => setArea(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="teacherPosition">Cargo</Label>
              <Input
                id="teacherPosition"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="evidenceUrl">Evidencia (URL)</Label>
              <Input
                id="evidenceUrl"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => request.mutate()}
                disabled={!institution.trim() || request.isPending}
              >
                Solicitar verificación
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
