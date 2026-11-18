"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ViewerEmpty, ViewerShell } from "./viewer-shell";
import { DownloadIcon, MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { fileContentUrl, fileDownloadUrl } from "@/lib/api";

export function ImageViewer({ resource }: { resource: { id: string; name: string; mimeType: string } }) {
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  if (failed) {
    return (
      <ViewerShell
        title={resource.name}
        badge="Imagen"
        subtitle="Vista previa no disponible"
        actions={
          <Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}>
            <DownloadIcon data-icon="inline-start" /> Descargar
          </Button>
        }
      >
        <ViewerEmpty
          title="No se pudo cargar la imagen"
          message="El archivo puede estar dañado o usar un formato no compatible con el navegador."
        />
      </ViewerShell>
    );
  }

  return (
    <ViewerShell
      title={resource.name}
      badge="Imagen"
      subtitle={`${Math.round(zoom * 100)}% · arrastra para mover`}
      actions={
        <>
          <Button variant="outline" size="icon-sm" aria-label="Alejar" onClick={() => setZoom((value) => Math.max(0.25, value - 0.25))}>
            <MinusIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Acercar" onClick={() => setZoom((value) => Math.min(4, value + 0.25))}>
            <PlusIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Restablecer" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
            <RotateCcwIcon />
          </Button>
          <Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}>
            <DownloadIcon data-icon="inline-start" /> Descargar
          </Button>
        </>
      }
    >
      <div
        className="flex min-h-[320px] cursor-grab items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-[radial-gradient(circle_at_center,var(--paper-raised),var(--paper-sunken))] dark:bg-[radial-gradient(circle_at_center,var(--surface),var(--night))] active:cursor-grabbing"
        onPointerDown={(event) => {
          setDragging(true);
          dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          setOffset({
            x: dragStart.current.offsetX + event.clientX - dragStart.current.x,
            y: dragStart.current.offsetY + event.clientY - dragStart.current.y,
          });
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileContentUrl(resource.id)}
          alt={resource.name}
          draggable={false}
          onError={() => setFailed(true)}
          className="max-h-[72vh] max-w-full select-none object-contain transition-transform duration-150"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        />
      </div>
    </ViewerShell>
  );
}
