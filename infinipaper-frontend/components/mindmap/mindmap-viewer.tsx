"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { Mindmap, MindmapNode } from "@/lib/types";

interface PositionedNode extends MindmapNode {
  x: number;
  y: number;
}

function layout(mindmap: Mindmap): PositionedNode[] {
  const outgoing = new Map<string, string[]>();
  for (const edge of mindmap.edges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }
  const root = mindmap.nodes[0];
  const levels = new Map<string, number>([[root.id, 0]]);
  const queue = [root.id];
  while (queue.length) {
    const current = queue.shift()!;
    const depth = levels.get(current) ?? 0;
    for (const target of outgoing.get(current) ?? []) {
      if (!levels.has(target)) {
        levels.set(target, depth + 1);
        queue.push(target);
      }
    }
  }
  const groups = new Map<number, MindmapNode[]>();
  for (const node of mindmap.nodes) {
    const depth = levels.get(node.id) ?? 2;
    groups.set(depth, [...(groups.get(depth) ?? []), node]);
  }
  const positioned: PositionedNode[] = [];
  for (const [depth, nodes] of groups) {
    const radius = depth === 0 ? 0 : 120 + depth * 110;
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positioned.push({
        ...node,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
      });
    });
  }
  return positioned;
}

export function MindmapViewer({ resourceId }: { resourceId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["mindmap", resourceId],
    queryFn: () => apiFetch<Mindmap>(`/files/${resourceId}/content`),
  });

  const positioned = React.useMemo(() => (data ? layout(data) : []), [data]);
  const positions = new Map(positioned.map((node) => [node.id, node]));

  if (isLoading || !data) {
    return <Skeleton className="h-[520px] w-full" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-heading text-xl font-semibold">{data.title}</h2>
        <p className="text-sm text-muted-foreground">
          {data.nodes.length} nodos · {data.edges.length} relaciones
        </p>
      </div>
      <div className="overflow-auto rounded-lg border bg-card">
        <svg viewBox="0 0 800 600" className="h-[520px] min-w-[720px] w-full">
          <g>
            {data.edges.map((edge, index) => {
              const source = positions.get(edge.source);
              const target = positions.get(edge.target);
              if (!source || !target) return null;
              return (
                <g key={`${edge.source}-${edge.target}-${index}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="1.5"
                  />
                  {edge.label ? (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2 - 4}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {positioned.map((node) => (
              <g key={node.id}>
                <title>{node.description ?? node.label}</title>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.type === "root" ? 46 : 38}
                  className="fill-primary/10 stroke-primary"
                  strokeWidth="1.5"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-[11px] font-medium"
                >
                  {node.label.length > 28
                    ? `${node.label.slice(0, 26)}…`
                    : node.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
