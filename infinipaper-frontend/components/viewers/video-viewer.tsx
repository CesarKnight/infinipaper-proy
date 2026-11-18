"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ViewerEmpty, ViewerShell } from "./viewer-shell";
import { DownloadIcon } from "lucide-react";
import { fileContentUrl, fileDownloadUrl } from "@/lib/api";

export function VideoViewer({ resource }: { resource: { id: string; name: string; mimeType: string } }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <ViewerShell title={resource.name} badge="Video" subtitle="Vista previa no disponible">
        <ViewerEmpty
          title="No se pudo reproducir el video"
          message="El formato o códec no es compatible con este navegador."
          action={<Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}><DownloadIcon data-icon="inline-start" /> Descargar</Button>}
        />
      </ViewerShell>
    );
  }
  return (
    <ViewerShell
      title={resource.name}
      badge="Video"
      subtitle="Reproducción con streaming"
      actions={<Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}><DownloadIcon data-icon="inline-start" /> Descargar</Button>}
      contentClassName="bg-black/90"
    >
      <video
        controls
        playsInline
        preload="metadata"
        src={fileContentUrl(resource.id)}
        onError={() => setFailed(true)}
        className="mx-auto max-h-[72vh] w-full rounded-xl bg-black shadow-lg"
      >
        Tu navegador no soporta video HTML5.
      </video>
    </ViewerShell>
  );
}
