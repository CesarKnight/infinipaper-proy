"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProjectCard } from "@/components/project/project-card";
import { apiFetch } from "@/lib/api";
import type { Project } from "@/lib/types";
import { WifiOffIcon } from "lucide-react";

interface DashboardData {
  owned: Project[];
  participating: Project[];
  public: Project[];
  counts: { owned: number; participating: number; public: number };
}

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/dashboard"),
  });

  const data = query.data;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Mi dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Un resumen de tu actividad y de los proyectos que puedes trabajar.
          </p>
        </div>

        {query.isLoading ? (
          <div className="flex flex-col gap-8">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex flex-col gap-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-36 w-full" />
              </div>
            ))}
          </div>
        ) : query.isError || !data ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
            <WifiOffIcon className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Sin conexión</p>
            <p className="text-sm text-muted-foreground">
              No pudimos cargar tu dashboard. Revisa tu conexión e inténtalo de
              nuevo.
            </p>
            <Button
              variant="outline"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              {query.isFetching ? "Reintentando…" : "Reintentar"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <DashboardSection
              title="Mis proyectos"
              total={data.counts.owned}
              scope="owned"
              items={data.owned}
              emptyMessage="Aún no creaste proyectos."
              emptyAction={
                <Button size="sm" render={<Link href="/projects?scope=owned" />}>
                  Crear proyecto
                </Button>
              }
            />
            <DashboardSection
              title="Participando"
              total={data.counts.participating}
              scope="participating"
              items={data.participating}
              emptyMessage="Todavía no participas en ningún proyecto."
            />
            <DashboardSection
              title="Proyectos públicos"
              total={data.counts.public}
              scope="public"
              items={data.public}
              emptyMessage="No hay proyectos públicos por ahora."
            />
          </div>
        )}
      </main>
    </>
  );
}

function DashboardSection({
  title,
  total,
  scope,
  items,
  emptyMessage,
  emptyAction,
}: {
  title: string;
  total: number;
  scope: "owned" | "participating" | "public";
  items: Project[];
  emptyMessage: string;
  emptyAction?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {total}
          </span>
        </h2>
        {total > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/projects?scope=${scope}`} />}
          >
            Ver todos
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {emptyAction}
        </div>
      ) : (
        <Carousel
          opts={{ align: "start", dragFree: true }}
          className="w-full"
        >
          <CarouselContent>
            {items.map((project) => (
              <CarouselItem
                key={project.id}
                className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <ProjectCard project={project} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-3 hidden md:inline-flex" />
          <CarouselNext className="-right-3 hidden md:inline-flex" />
        </Carousel>
      )}
    </section>
  );
}
