"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiError, userAvatarUrl } from "@/lib/api";
import type { Paged, ProjectMember, ProjectRole, PublicUser } from "@/lib/types";
import { Trash2Icon, UserPlusIcon } from "lucide-react";

export function MembersManager({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");

  const membersQuery = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => apiFetch<ProjectMember[]>(`/projects/${projectId}/members`),
  });

  const searchQuery = useQuery({
    queryKey: ["user-search", search],
    enabled: search.trim().length >= 2,
    queryFn: () =>
      apiFetch<Paged<PublicUser>>(
        `/users?query=${encodeURIComponent(search.trim())}`,
      ),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["members", projectId] });

  const add = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/projects/${projectId}/members`, {
        method: "POST",
        body: { userId, role: "VIEWER" },
      }),
    onSuccess: () => {
      toast.success("Participante añadido");
      setSearch("");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const updateRole = useMutation({
    mutationFn: (variables: { userId: string; role: ProjectRole }) =>
      apiFetch(`/projects/${projectId}/members/${variables.userId}`, {
        method: "PATCH",
        body: { role: variables.role },
      }),
    onSuccess: () => {
      toast.success("Permiso actualizado");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const remove = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Participante retirado");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Error"),
  });

  const existingIds = new Set(membersQuery.data?.map((m) => m.userId) ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por usuario o correo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {search.trim().length >= 2 && searchQuery.data ? (
          <ul className="divide-y rounded-lg border">
            {searchQuery.data.items
              .filter((user) => !existingIds.has(user.id))
              .map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>
                    {user.displayName}{" "}
                    <span className="text-muted-foreground">
                      @{user.username}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => add.mutate(user.id)}
                    disabled={add.isPending}
                  >
                    <UserPlusIcon data-icon="inline-start" />
                    Añadir
                  </Button>
                </li>
              ))}
            {searchQuery.data.items.filter((u) => !existingIds.has(u.id))
              .length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Sin resultados nuevos.
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <ul className="divide-y rounded-lg border">
        {membersQuery.data?.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <Avatar size="sm">
              {member.user.avatarUrl ? (
                <AvatarImage
                  src={userAvatarUrl(member.user.username)}
                  alt={member.user.displayName}
                />
              ) : null}
              <AvatarFallback>
                {member.user.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col">
              <span>{member.user.displayName}</span>
              <span className="text-xs text-muted-foreground">
                @{member.user.username}
              </span>
            </div>
            <Select
              value={member.role}
              onValueChange={(value) =>
                updateRole.mutate({
                  userId: member.userId,
                  role: value as ProjectRole,
                })
              }
              items={[
                { label: "Puede editar", value: "EDITOR" },
                { label: "Solo ver", value: "VIEWER" },
              ]}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Puede editar</SelectItem>
                <SelectItem value="VIEWER">Solo ver</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Retirar"
              onClick={() => remove.mutate(member.userId)}
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
        {membersQuery.data?.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">
            Aún no hay participantes.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
