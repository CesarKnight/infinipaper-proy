"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError, userAvatarUrl } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { GlobeIcon } from "lucide-react";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: () => apiFetch<PublicProfile>(`/users/${username}`),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">
            {error instanceof ApiError
              ? error.message
              : "Usuario no encontrado"}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {data.avatarUrl ? (
                  <AvatarImage
                    src={userAvatarUrl(data.username)}
                    alt={data.displayName}
                  />
                ) : null}
                <AvatarFallback>
                  {data.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h1 className="font-heading text-2xl font-semibold">
                  {data.displayName}
                </h1>
                <span className="text-sm text-muted-foreground">
                  @{data.username}
                </span>
                {data.bio ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.bio}
                  </p>
                ) : null}
              </div>
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Proyectos públicos
              </h2>
              {data.projects.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Este usuario aún no tiene proyectos públicos.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.projects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="h-full transition-colors hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="truncate">
                              {project.name}
                            </CardTitle>
                            <Badge variant="outline">
                              <GlobeIcon data-icon="inline-start" />
                              Público
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {project.description ?? "Sin descripción"}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
