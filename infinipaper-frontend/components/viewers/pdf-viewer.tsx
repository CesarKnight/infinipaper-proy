"use client";

import { Button } from "@/components/ui/button";
import { ViewerShell } from "./viewer-shell";
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { fileContentUrl, fileDownloadUrl } from "@/lib/api";

export function PdfViewer({ resource }: { resource: { id: string; name: string } }) {
  const url = fileContentUrl(resource.id);
  return (
    <ViewerShell
      title={resource.name}
      badge="PDF"
      subtitle="Visor del navegador · usa los controles para navegar"
      actions={
        <>
          <Button variant="outline" size="sm" render={<a href={url} target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon data-icon="inline-start" /> Abrir
          </Button>
          <Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}>
            <DownloadIcon data-icon="inline-start" /> Descargar
          </Button>
        </>
      }
      contentClassName="bg-paper-sunken/70 dark:bg-night/40"
    >
      <iframe
        src={url}
        title={resource.name}
        className="h-[74vh] min-h-[420px] w-full rounded-xl border border-border/60 bg-white shadow-sm"
      />
    </ViewerShell>
  );
}
