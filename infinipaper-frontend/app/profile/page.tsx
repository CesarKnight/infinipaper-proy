"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { User } from "@/lib/types";

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
          <ProfileForm user={user} />
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
