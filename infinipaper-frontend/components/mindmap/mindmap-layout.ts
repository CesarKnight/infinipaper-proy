import dagre from "@dagrejs/dagre";
import { MarkerType, type Edge, type Node } from "@xyflow/react";

import type { Mindmap } from "@/lib/types";

export const MINDMAP_NODE_WIDTH = 248;
export const MINDMAP_NODE_HEIGHT = 92;

export type MindmapFlowNodeData = {
  label: string;
  type?: string;
  description?: string;
  isRoot: boolean;
};

export type MindmapFlowNode = Node<MindmapFlowNodeData, "mindmap">;
export type MindmapFlowEdge = Edge;

export type SavedMindmapLayout = {
  version: 1;
  positions: Record<string, { x: number; y: number }>;
};

export const MINDMAP_LAYOUT_PREFIX = "infinipaper.mindmap.layout.";

export function mindmapLayoutKey(resourceId: string): string {
  return `${MINDMAP_LAYOUT_PREFIX}${resourceId}`;
}

export function readSavedLayout(resourceId: string): SavedMindmapLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(mindmapLayoutKey(resourceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedMindmapLayout>;
    if (parsed.version !== 1 || !parsed.positions) return null;
    return {
      version: 1,
      positions: parsed.positions,
    };
  } catch {
    return null;
  }
}

export function saveLayout(
  resourceId: string,
  positions: Record<string, { x: number; y: number }>,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      mindmapLayoutKey(resourceId),
      JSON.stringify({ version: 1, positions }),
    );
  } catch {
    // El navegador puede bloquear localStorage; no es crítico.
  }
}

export function clearSavedLayout(resourceId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(mindmapLayoutKey(resourceId));
  } catch {
    // Ignorar bloqueo del navegador.
  }
}

export function buildMindmapElements(
  mindmap: Mindmap,
  saved: SavedMindmapLayout | null,
): { nodes: MindmapFlowNode[]; edges: MindmapFlowEdge[] } {
  const nodeIds = new Set(mindmap.nodes.map((node) => node.id));
  const incoming = new Set(mindmap.edges.map((edge) => edge.target));
  const roots = new Set(
    mindmap.nodes
      .filter((node) => node.type === "root" || !incoming.has(node.id))
      .map((node) => node.id),
  );
  if (!roots.size && mindmap.nodes[0]) roots.add(mindmap.nodes[0].id);

  const validEdges = mindmap.edges.filter(
    (edge) =>
      nodeIds.has(edge.source) &&
      nodeIds.has(edge.target) &&
      edge.source !== edge.target,
  );

  const savedPositions = validSavedPositions(saved, nodeIds);
  const positions = savedPositions
    ? savedPositions
    : computeDagrePositions(mindmap, validEdges);

  const nodes: MindmapFlowNode[] = mindmap.nodes.map((node) => ({
    id: node.id,
    type: "mindmap",
    position: positions[node.id] ?? { x: 0, y: 0 },
    width: MINDMAP_NODE_WIDTH,
    height: MINDMAP_NODE_HEIGHT,
    zIndex: 2,
    data: {
      label: node.label,
      type: node.type,
      description: node.description,
      isRoot: roots.has(node.id),
    },
  }));

  const edges: MindmapFlowEdge[] = validEdges.map((edge, index) => ({
    id: `edge-${index}-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    label: edge.label,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
    },
    style: {
      stroke: "var(--color-muted-foreground)",
      strokeWidth: 1.5,
      opacity: 0.55,
    },
    labelStyle: {
      fill: "var(--color-foreground)",
      fontSize: 11,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: "var(--color-card)",
      fillOpacity: 0.94,
    },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    zIndex: 0,
  }));

  return { nodes, edges };
}

function validSavedPositions(
  saved: SavedMindmapLayout | null,
  nodeIds: Set<string>,
): Record<string, { x: number; y: number }> | null {
  if (!saved) return null;
  const entries = Object.entries(saved.positions);
  if (!entries.length || entries.length !== nodeIds.size) return null;
  if (!entries.every(([id]) => nodeIds.has(id))) return null;
  if (
    !entries.every(
      ([, position]) =>
        Number.isFinite(position.x) && Number.isFinite(position.y),
    )
  ) {
    return null;
  }
  return saved.positions;
}

function computeDagrePositions(
  mindmap: Mindmap,
  edges: Mindmap["edges"],
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  try {
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: "LR",
      align: "UL",
      nodesep: 44,
      ranksep: 92,
      marginx: 24,
      marginy: 24,
    });
    for (const node of mindmap.nodes) {
      graph.setNode(node.id, {
        width: MINDMAP_NODE_WIDTH,
        height: MINDMAP_NODE_HEIGHT,
      });
    }
    edges.forEach((edge) => {
      graph.setEdge(edge.source, edge.target, {});
    });
    dagre.layout(graph);
    for (const node of mindmap.nodes) {
      const position = graph.node(node.id) as
        | { x: number; y: number }
        | undefined;
      if (!position) continue;
      positions[node.id] = {
        x: position.x - MINDMAP_NODE_WIDTH / 2,
        y: position.y - MINDMAP_NODE_HEIGHT / 2,
      };
    }
  } catch {
    // Dagre puede rechazar grafos atípicos; usamos una cuadrícula estable.
  }
  if (Object.keys(positions).length !== mindmap.nodes.length) {
    return gridPositions(mindmap.nodes);
  }
  return positions;
}

function gridPositions(
  nodes: Mindmap["nodes"],
): Record<string, { x: number; y: number }> {
  const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node, index) => {
    positions[node.id] = {
      x: (index % columns) * (MINDMAP_NODE_WIDTH + 80),
      y: Math.floor(index / columns) * (MINDMAP_NODE_HEIGHT + 80),
    };
  });
  return positions;
}
