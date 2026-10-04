"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiFetch, userAvatarUrl } from "@/lib/api";
import type { ProjectMember, PublicUser } from "@/lib/types";
import { CrownIcon, PencilIcon, EyeIcon } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  EDITOR: "Editor",
  VIEWER: "Lector",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserRow({
  user,
  role,
  roleVariant,
  icon,
}: {
  user: PublicUser;
  role: string;
  roleVariant: "default" | "secondary" | "outline";
  icon: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <Avatar size="sm">
        {user.avatarUrl ? (
          <AvatarImage
            src={userAvatarUrl(user.username)}
            alt={user.displayName}
          />
        ) : null}
        <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{user.displayName}</span>
        <span className="truncate text-xs text-muted-foreground">
          @{user.username}
        </span>
      </div>
      <Badge variant={roleVariant}>
        {icon}
        {role}
      </Badge>
    </li>
  );
}

export function ParticipantsPanel({
  projectId,
  owner,
}: {
  projectId: string;
  owner: PublicUser;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => apiFetch<ProjectMember[]>(`/projects/${projectId}/members`),
  });

  const members = data ?? [];
  const total = members.length + 1;

  return (
    <aside className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Participantes{isLoading ? "" : ` (${total})`}
      </h2>
      <ul className="flex flex-col gap-3">
        <UserRow
          user={owner}
          role="Propietario"
          roleVariant="default"
          icon={<CrownIcon data-icon="inline-start" />}
        />
        {isLoading ? (
          <li className="text-xs text-muted-foreground">Cargando…</li>
        ) : (
          members.map((member) => (
            <UserRow
              key={member.id}
              user={member.user}
              role={ROLE_LABEL[member.role] ?? member.role}
              roleVariant={member.role === "EDITOR" ? "secondary" : "outline"}
              icon={
                member.role === "EDITOR" ? (
                  <PencilIcon data-icon="inline-start" />
                ) : (
                  <EyeIcon data-icon="inline-start" />
                )
              }
            />
          ))
        )}
        {!isLoading && members.length === 0 ? (
          <li className="text-xs text-muted-foreground">
            Sin otros participantes.
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
