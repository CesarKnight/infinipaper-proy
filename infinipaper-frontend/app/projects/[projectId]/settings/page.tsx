"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { apiFetch, ApiError } from "@/lib/api";
import type { Project, ProjectVisibility } from "@/lib/types";
import { MembersManager } from "@/components/project/members-manager";

export default function ProjectSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiFetch<Project>(`/projects/${projectId}`),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/projects" />}>
                Proyectos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={`/projects/${projectId}`} />}>
                {project?.name ?? "…"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Configuración</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {isLoading || !project ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ProjectSettingsForm project={project} />
        )}
      </main>
    </>
  );
}

function ProjectSettingsForm({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(
    project.description ?? "",
  );
  const [visibility, setVisibility] = React.useState<ProjectVisibility>(
    project.visibility,
  );

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${project.id}`, {
        method: "PATCH",
        body: { name, description, visibility },
      }),
    onSuccess: () => {
      toast.success("Proyecto actualizado");
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const remove = useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${project.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Proyecto eliminado");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.replace("/projects");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Información del proyecto</CardTitle>
          <CardDescription>
            Solo el propietario puede modificar estos datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Visibilidad</Label>
            <Select
              value={visibility}
              onValueChange={(value) =>
                setVisibility(value as ProjectVisibility)
              }
              items={[
                { label: "Privado", value: "PRIVATE" },
                { label: "Público", value: "PUBLIC" },
              ]}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Privado</SelectItem>
                <SelectItem value="PUBLIC">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participantes y permisos</CardTitle>
          <CardDescription>
            Añade usuarios y define si pueden editar o solo ver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersManager projectId={project.id} />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Eliminar proyecto</CardTitle>
          <CardDescription>
            Esta acción elimina carpetas, archivos y apuntes de forma
            permanente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              Eliminar proyecto
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar el proyecto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrará todo el contenido de forma permanente. No se puede
                  deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => remove.mutate()}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
