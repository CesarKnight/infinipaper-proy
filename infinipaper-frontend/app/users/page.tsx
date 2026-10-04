"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, userAvatarUrl } from "@/lib/api";
import type { Paged, PublicUser } from "@/lib/types";

export default function UsersPage() {
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["user-search", debounced],
    queryFn: () =>
      apiFetch<Paged<PublicUser>>(
        `/users${debounced ? `?query=${encodeURIComponent(debounced)}` : ""}`,
      ),
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Busca usuarios y visita sus perfiles públicos.
          </p>
        </div>

        <Input
          placeholder="Buscar por nombre o usuario…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data?.items.map((user) => (
              <Link key={user.id} href={`/users/${user.username}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center gap-3 pt-6">
                    <Avatar>
                      {user.avatarUrl ? (
                        <AvatarImage
                          src={userAvatarUrl(user.username)}
                          alt={user.displayName}
                        />
                      ) : null}
                      <AvatarFallback>
                        {user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{user.username}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {data?.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin resultados.
              </p>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}
