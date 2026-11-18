"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewerEmpty, ViewerShell } from "./viewer-shell";
import { DownloadIcon, FileSpreadsheetIcon, PresentationIcon, FileTextIcon } from "lucide-react";
import { fileContentUrl, fileDownloadUrl } from "@/lib/api";

type OfficeKind = "word" | "sheet" | "slides" | "unsupported";

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function officeKind(name: string): OfficeKind {
  const ext = extensionOf(name);
  if (["docx", "docm", "dotx"].includes(ext)) return "word";
  if (["xlsx", "xlsm", "xls", "csv", "ods"].includes(ext)) return "sheet";
  if (["pptx", "pptm", "ppsx", "odp"].includes(ext)) return "slides";
  return "unsupported";
}

function formatLabel(kind: OfficeKind): string {
  if (kind === "word") return "Documento Word";
  if (kind === "sheet") return "Hoja de cálculo";
  if (kind === "slides") return "Presentación";
  return "Documento ofimático";
}

export function OfficeViewer({
  resource,
}: {
  resource: { id: string; name: string; mimeType: string };
}) {
  const kind = officeKind(resource.name);
  const docxRef = React.useRef<HTMLDivElement>(null);
  const pptxRef = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "error" | "unsupported">(
    kind === "unsupported" ? "unsupported" : "loading",
  );
  const [message, setMessage] = React.useState("");
  const [sheets, setSheets] = React.useState<Array<{ name: string; rows: string[][] }>>([]);
  const [sheetIndex, setSheetIndex] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    if (docxRef.current) docxRef.current.innerHTML = "";
    if (pptxRef.current) pptxRef.current.innerHTML = "";

    if (kind === "unsupported") {
      return;
    }

    (async () => {
      try {
        const response = await fetch(fileContentUrl(resource.id), { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        if (kind === "word") {
          const mod = await import("docx-preview");
          if (!docxRef.current) return;
          await mod.renderAsync(buffer, docxRef.current, docxRef.current, {
            className: "infinipaper-docx",
            inWrapper: true,
            breakPages: true,
            renderHeaders: true,
            renderFooters: true,
            ignoreWidth: false,
            ignoreHeight: false,
          });
          if (!cancelled) setState("ready");
        } else if (kind === "sheet") {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(buffer, { type: "array" });
          const parsed = workbook.SheetNames.map((name) => {
            const sheet = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
              header: 1,
              defval: "",
              raw: false,
            });
            return {
              name,
              rows: rows.slice(0, 500).map((row) =>
                row.slice(0, 40).map((cell) => String(cell ?? "")),
              ),
            };
          });
          if (!cancelled) {
            setSheets(parsed);
            setState("ready");
          }
        } else if (kind === "slides") {
          const mod = await import("pptx-preview");
          if (!pptxRef.current) return;
          const previewer = mod.init(pptxRef.current, {
            width: 960,
            height: 540,
          });
          await previewer.preview(buffer);
          if (!cancelled) setState("ready");
        }
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo generar la vista previa.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resource.id, kind]);

  const icon =
    kind === "sheet" ? (
      <FileSpreadsheetIcon className="size-4" />
    ) : kind === "slides" ? (
      <PresentationIcon className="size-4" />
    ) : (
      <FileTextIcon className="size-4" />
    );

  return (
    <ViewerShell
      title={resource.name}
      badge={formatLabel(kind)}
      subtitle="Vista previa de solo lectura · base preparada para colaboración"
      actions={
        <Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}>
          <DownloadIcon data-icon="inline-start" /> Descargar
        </Button>
      }
      contentClassName="bg-paper-raised/35 dark:bg-surface/20"
    >
      {state === "loading" ? <Skeleton className="h-[520px] w-full rounded-xl" /> : null}
      {state === "error" ? (
        <ViewerEmpty
          title="No se pudo generar la vista previa"
          message={message || "Prueba a descargar el archivo y abrirlo en tu aplicación ofimática."}
          action={
            <Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}>
              <DownloadIcon data-icon="inline-start" /> Descargar
            </Button>
          }
        />
      ) : null}
      {state === "unsupported" ? (
        <ViewerEmpty
          title="Formato no previsualizable"
          message="Los formatos binarios antiguos se ofrecen para descarga. La vista previa está disponible para DOCX, XLSX y PPTX."
          action={
            <Button variant="outline" size="sm" render={<a href={fileDownloadUrl(resource.id)} download />}>
              <DownloadIcon data-icon="inline-start" /> Descargar
            </Button>
          }
        />
      ) : null}
      <div
        className={
          state === "ready" && kind === "word"
            ? "max-h-[74vh] overflow-auto rounded-xl border border-border/60 bg-white p-2 shadow-inner"
            : "hidden"
        }
      >
        <div ref={docxRef} className="infinipaper-docx" />
      </div>
      <div
        className={
          state === "ready" && kind === "slides"
            ? "max-h-[74vh] overflow-auto rounded-xl border border-border/60 bg-white p-2 shadow-inner"
            : "hidden"
        }
      >
        <div ref={pptxRef} className="mx-auto" />
      </div>
      {state === "ready" && kind === "sheet" ? (
        <div className="flex max-h-[74vh] flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-white shadow-inner">
          <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
            <Badge variant="outline" className="mr-1">{icon} {sheets.length} hoja(s)</Badge>
            {sheets.map((sheet, index) => (
              <Button key={sheet.name} size="sm" variant={index === sheetIndex ? "secondary" : "ghost"} onClick={() => setSheetIndex(index)}>
                {sheet.name}
              </Button>
            ))}
          </div>
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-left text-xs">
              <tbody>
                {(sheets[sheetIndex]?.rows ?? []).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex === 0 ? "bg-muted/50 font-medium" : ""}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="max-w-64 truncate border border-border/50 px-2 py-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t px-2 py-1 text-[11px] text-muted-foreground">
            Vista limitada a 500 filas y 40 columnas para mantener la interfaz fluida.
          </p>
        </div>
      ) : null}
    </ViewerShell>
  );
}
