"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { FolderNode, FolderTree } from "@/lib/types";
import { FolderIcon, HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "move" | "copy";

interface FlatFolder {
  id: string;
  name: string;
  depth: number;
  isRoot: boolean;
}

function flatten(nodes: FolderNode[], depth = 0, acc: FlatFolder[] = []) {
  for (const node of nodes) {
    acc.push({ id: node.id, name: node.name, depth, isRoot: node.isRoot });
    flatten(node.children, depth + 1, acc);
  }
  return acc;
}

export function FileDestinationDialog({
  projectId,
  mode,
  count,
  open,
  onOpenChange,
  onConfirm,
  pending,
}: {
  projectId: string;
  mode: Mode;
  count: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderId: string) => void;
  pending: boolean;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const tree = useQuery({
    queryKey: ["folders", projectId],
    enabled: open,
    queryFn: () => apiFetch<FolderTree>(`/projects/${projectId}/folders`),
  });

  const folders = React.useMemo(() => {
    const list = flatten(tree.data?.tree ?? []);
    if (tree.data?.rootId) {
      return [
        {
          id: tree.data.rootId,
          name: "Raíz del proyecto",
          depth: 0,
          isRoot: true,
        },
        ...list,
      ];
    }
    return list;
  }, [tree.data]);

  const effectiveSelected = selected ?? tree.data?.rootId ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "move" ? "Mover" : "Copiar"} {count} archivo
            {count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Elige la carpeta destino dentro de este proyecto.
          </DialogDescription>
        </DialogHeader>

        {tree.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="max-h-72 overflow-auto rounded-lg border p-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelected(folder.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                  effectiveSelected === folder.id
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-muted",
                )}
                style={{ paddingLeft: 8 + folder.depth * 18 }}
              >
                {folder.isRoot ? (
                  <HomeIcon className="size-4 shrink-0" />
                ) : (
                  <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!effectiveSelected || pending || tree.isLoading}
            onClick={() => effectiveSelected && onConfirm(effectiveSelected)}
          >
            {mode === "move" ? "Mover aquí" : "Copiar aquí"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
