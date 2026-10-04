"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/project/project-card";
import { apiFetch, ApiError } from "@/lib/api";
import type { Paged, Project, ProjectVisibility } from "@/lib/types";
import { PlusIcon } from "lucide-react";

const SCOPES = [
  { value: "all", label: "Todos" },
  { value: "owned", label: "Mis proyectos" },
  { value: "participating", label: "Participando" },
  { value: "public", label: "Públicos" },
] as const;

type Scope = (typeof SCOPES)[number]["value"];

function CreateProjectDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [visibility, setVisibility] = React.useState<ProjectVisibility>("PRIVATE");

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Project>("/projects", {
        method: "POST",
        body: { name, description: description || undefined, visibility },
      }),
    onSuccess: () => {
      toast.success("Proyecto creado");
      setOpen(false);
      setName("");
      setDescription("");
      setVisibility("PRIVATE");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error al crear"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Nuevo proyecto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear proyecto</DialogTitle>
          <DialogDescription>
            Un espacio para organizar tus recursos académicos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
              onValueChange={(value) => setVisibility(value as ProjectVisibility)}
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
        </div>
        <DialogFooter>
          <Button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = (searchParams.get("scope") ?? "all") as Scope;

  const { data, isLoading } = useQuery({
    queryKey: ["projects", scope],
    queryFn: () => apiFetch<Paged<Project>>(`/projects?scope=${scope}`),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Proyectos</h1>
            <p className="text-sm text-muted-foreground">
              Tus proyectos y aquellos en los que participas.
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        <Tabs
          value={scope}
          onValueChange={(value) =>
            router.push(`/projects?scope=${value as string}`)
          }
        >
          <TabsList>
            {SCOPES.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Sin proyectos</EmptyTitle>
              <EmptyDescription>
                No hay proyectos en esta categoría.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateProjectDialog />
            </EmptyContent>
          </Empty>
        )}
      </main>
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <>
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
            <Skeleton className="h-40 w-full" />
          </main>
        </>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
