"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { Loader2Icon, Maximize2Icon, RotateCcwIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { Mindmap } from "@/lib/types";
import {
  buildMindmapElements,
  clearSavedLayout,
  MINDMAP_NODE_HEIGHT,
  MINDMAP_NODE_WIDTH,
  readSavedLayout,
  saveLayout,
  type MindmapFlowEdge,
  type MindmapFlowNode,
} from "./mindmap-layout";
import { MindmapNodeCard } from "./mindmap-node";

const nodeTypes: NodeTypes = { mindmap: MindmapNodeCard };

export function MindmapViewer({ resourceId }: { resourceId: string }) {
  return (
    <ReactFlowProvider>
      <MindmapViewerInner resourceId={resourceId} />
    </ReactFlowProvider>
  );
}

function MindmapViewerInner({ resourceId }: { resourceId: string }) {
  const query = useQuery({
    queryKey: ["mindmap", resourceId],
    queryFn: () => apiFetch<Mindmap>(`/files/${resourceId}/content`),
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<MindmapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindmapFlowEdge>([]);
  const { fitView, getNodes, setCenter } = useReactFlow();
  const [isExporting, setIsExporting] = React.useState(false);

  const applyLayout = React.useCallback(
    (
      mindmap: Mindmap,
      useSaved: boolean,
      focusRoot?: boolean,
    ) => {
      const saved = useSaved ? readSavedLayout(resourceId) : null;
      const elements = buildMindmapElements(mindmap, saved);
      setNodes(elements.nodes);
      setEdges(elements.edges);
      window.requestAnimationFrame(() => {
        const root = elements.nodes.find((node) => node.data.isRoot);
        if (focusRoot && root) {
          void setCenter(
            root.position.x + MINDMAP_NODE_WIDTH / 2,
            root.position.y + MINDMAP_NODE_HEIGHT / 2,
            { zoom: 0.82, duration: 0 },
          );
          return;
        }
        void fitView({ padding: 0.18, duration: 300 });
      });
    },
    [fitView, resourceId, setCenter, setEdges, setNodes],
  );

  React.useEffect(() => {
    if (!query.data) return;
    applyLayout(query.data, true, true);
  }, [applyLayout, query.data]);

  const handleNodeDragStop = React.useCallback(() => {
    const positions = Object.fromEntries(
      getNodes().map((node) => [node.id, { x: node.position.x, y: node.position.y }]),
    );
    saveLayout(resourceId, positions);
  }, [getNodes, resourceId]);

  const handleReset = React.useCallback(() => {
    if (!query.data) return;
    clearSavedLayout(resourceId);
    applyLayout(query.data, false);
  }, [applyLayout, query.data, resourceId]);

  const handleExport = React.useCallback(async () => {
    if (!query.data || isExporting) return;
    const viewportElement = document.querySelector<HTMLElement>(
      ".react-flow__viewport",
    );
    if (!viewportElement) {
      toast.error("No se pudo encontrar el diagrama para exportar.");
      return;
    }

    setIsExporting(true);
    try {
      const nodeList = getNodes() as MindmapFlowNode[];
      const bounds = getNodesBounds(nodeList);
      const imageWidth = Math.max(
        1200,
        Math.min(2800, Math.ceil(bounds.width + 240)),
      );
      const imageHeight = Math.max(
        800,
        Math.min(2200, Math.ceil(bounds.height + 240)),
      );
      const viewport = getViewportForBounds(
        bounds,
        imageWidth,
        imageHeight,
        0.1,
        2,
        "5%",
      );
      const { toPng } = await import("html-to-image");
      const background =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim() || "#ffffff";
      const dataUrl = await toPng(viewportElement, {
        backgroundColor: background,
        cacheBust: true,
        pixelRatio: 2,
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transformOrigin: "top left",
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      });
      const link = document.createElement("a");
      link.download = `${slugify(query.data.title)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Mapa mental exportado como PNG.");
    } catch {
      toast.error("No se pudo exportar el mapa mental.");
    } finally {
      setIsExporting(false);
    }
  }, [getNodes, isExporting, query.data]);

  if (query.isError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el mapa mental.
        </p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (query.isLoading || !query.data) {
    return <Skeleton className="h-[620px] w-full" />;
  }

  if (!query.data.nodes.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Este mapa mental no tiene nodos.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            {query.data.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {query.data.nodes.length} nodos · {query.data.edges.length} relaciones
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Arrastra los nodos para reorganizar · rueda para zoom
        </p>
      </div>

      <div className="h-[min(72vh,720px)] min-h-[420px] overflow-hidden rounded-lg border bg-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          nodesConnectable={false}
          elementsSelectable
          minZoom={0.08}
          maxZoom={2.5}
          className="bg-background"
          aria-label="Mapa mental interactivo"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="var(--color-border)"
          />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            className="!bg-card"
            nodeColor={(node) =>
              node.data?.isRoot
                ? "var(--color-primary)"
                : "var(--color-muted-foreground)"
            }
            maskColor="color-mix(in srgb, var(--background) 72%, transparent)"
          />
          <Panel position="top-right" className="!m-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fitView({ padding: 0.18, duration: 250 })}
            >
              <Maximize2Icon data-icon="inline-start" />
              Ajustar vista
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcwIcon data-icon="inline-start" />
              Reorganizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleExport()}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
              ) : (
                <DownloadIcon data-icon="inline-start" />
              )}
              {isExporting ? "Exportando…" : "Exportar PNG"}
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 80) || "mapa-mental"
  );
}
