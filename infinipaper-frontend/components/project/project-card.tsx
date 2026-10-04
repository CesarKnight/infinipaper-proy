"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { userAvatarUrl } from "@/lib/api";
import type { Project } from "@/lib/types";
import { GlobeIcon, LockIcon } from "lucide-react";

const ROLE_LABEL: Partial<Record<NonNullable<Project["role"]>, string>> = {
  owner: "Propietario",
  editor: "Editor",
  viewer: "Lector",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProjectCard({ project }: { project: Project }) {
  const roleLabel = project.role ? ROLE_LABEL[project.role] : undefined;

  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition-colors hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="truncate text-base">
              {project.name}
            </CardTitle>
            <Badge variant="outline" className="shrink-0">
              {project.visibility === "PUBLIC" ? (
                <GlobeIcon data-icon="inline-start" />
              ) : (
                <LockIcon data-icon="inline-start" />
              )}
              {project.visibility === "PUBLIC" ? "Público" : "Privado"}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description ?? "Sin descripción"}
          </CardDescription>
          <div className="mt-2 flex items-center gap-2">
            <Avatar size="sm">
              {project.owner.avatarUrl ? (
                <AvatarImage
                  src={userAvatarUrl(project.owner.username)}
                  alt={project.owner.displayName}
                />
              ) : null}
              <AvatarFallback>
                {initials(project.owner.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {project.owner.displayName}
            </span>
            {roleLabel ? (
              <Badge
                variant={project.role === "owner" ? "default" : "secondary"}
                className="shrink-0"
              >
                {roleLabel}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
