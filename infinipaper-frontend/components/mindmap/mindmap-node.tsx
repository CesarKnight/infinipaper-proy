"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { MindmapFlowNode } from "./mindmap-layout";

export const MindmapNodeCard = memo(function MindmapNodeCard({
  data,
  selected,
}: NodeProps<MindmapFlowNode>) {
  return (
    <div
      className={[
        "relative w-[248px] rounded-xl border bg-card px-3 py-2.5 text-card-foreground shadow-sm transition-shadow",
        data.isRoot
          ? "border-primary/70 bg-primary/10 ring-1 ring-primary/20"
          : "border-border",
        selected ? "shadow-md ring-2 ring-primary/50" : "",
      ].join(" ")}
      title={data.description ?? data.label}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border !border-border !bg-background"
      />
      <div className="flex items-center gap-2">
        <span
          className={[
            "size-2 shrink-0 rounded-full",
            data.isRoot ? "bg-primary" : "bg-muted-foreground/50",
          ].join(" ")}
        />
        <p className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">
          {data.label}
        </p>
      </div>
      {data.description ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {data.description}
        </p>
      ) : null}
      {data.type ? (
        <span className="mt-1.5 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {data.type}
        </span>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border !border-border !bg-background"
      />
    </div>
  );
});
