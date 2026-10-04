"use client";

import type { AutosaveStatus } from "@/lib/use-autosave";
import { CheckIcon, LoaderIcon, TriangleAlertIcon } from "lucide-react";

export function AutosaveStatusIndicator({
  status,
}: {
  status: AutosaveStatus;
}) {
  if (status === "idle") {
    return null;
  }

  const config = {
    saving: {
      icon: <LoaderIcon className="size-3.5 animate-spin" />,
      text: "Guardando…",
      className: "text-muted-foreground",
    },
    saved: {
      icon: <CheckIcon className="size-3.5" />,
      text: "Guardado",
      className: "text-muted-foreground",
    },
    error: {
      icon: <TriangleAlertIcon className="size-3.5" />,
      text: "Error al guardar",
      className: "text-destructive",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${config.className}`}
    >
      {config.icon}
      {config.text}
    </span>
  );
}
