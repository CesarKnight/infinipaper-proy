import {
  BookOpenIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  FileAudioIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

const files = [
  { label: "PDF", icon: FileTextIcon },
  { label: "DOCX", icon: FileTextIcon },
  { label: "XLSX", icon: FileSpreadsheetIcon },
  { label: "PNG", icon: ImageIcon },
  { label: "MP3", icon: FileAudioIcon },
  { label: "MP4", icon: VideoIcon },
] as const;

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[560px]">
      <div
        aria-hidden
        className="absolute -inset-8 rounded-full bg-violet/20 blur-3xl"
      />
      <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/35 backdrop-blur-xl">
        <div className="rounded-[1.55rem] bg-paper p-4 text-ink sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo/10 text-indigo">
                <FolderIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Base de datos 1</p>
                <p className="text-[11px] text-ink/60">
                  6 archivos · 1 espacio compartido
                </p>
              </div>
            </div>
            <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
              En curso
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {files.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-paper-raised px-2 py-1 text-[10px] font-medium text-ink/60"
              >
                <Icon className="size-3" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-paper-raised p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">
                <BookOpenIcon className="size-3.5" />
                Apunte
              </div>
              <p className="mt-2 text-sm font-semibold">Normalización</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink/60">
                1FN, 2FN y 3FN para reducir redundancia y anomalías.
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-success">
                <CheckCircle2Icon className="size-3" />
                Markdown guardado
              </div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper-raised p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A1349F]">
                <SparklesIcon className="size-3.5" />
                Quiz IA
              </div>
              <p className="mt-2 text-sm font-semibold">5 preguntas</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink/60">
                Opción múltiple, V/F y respuesta corta con fuentes citadas.
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-ink/60">
                <CheckCircle2Icon className="size-3" />
                Borrador revisable
              </div>
            </div>
          </div>

          <div className="mt-2.5 rounded-2xl border border-ink/10 bg-paper-raised p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-coral">
                <BrainCircuitIcon className="size-3.5" />
                Mapa mental
              </div>
              <span className="text-[10px] text-ink/60">23 nodos</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
              <span className="rounded-full bg-indigo px-2 py-1 text-[10px] font-medium text-white">
                Bases de datos
              </span>
              <span className="h-px w-4 bg-border-brand" />
              <span className="rounded-full border border-ink/10 px-2 py-1 text-[10px]">
                Claves
              </span>
              <span className="h-px w-4 bg-border-brand" />
              <span className="rounded-full border border-ink/10 px-2 py-1 text-[10px]">
                SQL
              </span>
              <span className="h-px w-4 bg-border-brand" />
              <span className="rounded-full border border-ink/10 px-2 py-1 text-[10px]">
                Índices
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-mist/70">
        Un proyecto. Todo el contexto. Distintas formas de estudiarlo.
      </p>
    </div>
  );
}
