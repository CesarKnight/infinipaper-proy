import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpenIcon, FolderIcon, SparklesIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: FolderIcon,
    label: "Proyectos y carpetas",
  },
  {
    icon: BookOpenIcon,
    label: "Apuntes Markdown",
  },
  {
    icon: SparklesIcon,
    label: "Resúmenes con IA",
  },
] as const;

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh w-full bg-background lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <section className="relative isolate flex flex-col overflow-hidden bg-night px-5 pb-5 pt-5 text-white sm:px-10 sm:pb-8 sm:pt-7 lg:h-dvh lg:min-h-0 lg:px-14 lg:py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-28 -top-28 size-[30rem] rounded-full bg-indigo/45 blur-3xl" />
          <div className="absolute -right-36 top-1/3 size-[30rem] rounded-full bg-violet/20 blur-3xl" />
          <div className="absolute -bottom-48 left-1/3 size-[34rem] rounded-full bg-coral/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-night/20 via-transparent to-night/50" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/brand/mark-dark.svg"
              alt=""
              width={40}
              height={38}
              priority
              unoptimized
              className="h-9 w-auto sm:h-10"
            />
            <span className="font-heading text-xl font-semibold tracking-tight">
              Infinipaper
            </span>
          </Link>
          <span className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-mist sm:inline-flex">
            Estudio colaborativo
          </span>
        </div>

        <div className="relative z-10 mt-5 max-w-2xl sm:mt-10 lg:mt-12">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-violet sm:block sm:text-[11px]">
            Material de estudio, compactado
          </p>
          <p className="font-heading text-3xl font-semibold leading-[1.06] tracking-tight sm:mt-3 sm:text-5xl lg:text-[3.35rem]">
            Todo tu estudio, en{" "}
            <span className="whitespace-nowrap italic text-violet">
              un solo lugar
            </span>
            .
          </p>
          <p className="mt-2 text-xs leading-relaxed text-mist sm:hidden">
            Apuntes, proyectos y resúmenes con IA.
          </p>
          <p className="mt-4 hidden max-w-xl text-sm leading-relaxed text-mist sm:block sm:text-base">
            Organiza el material de tu comunidad, escribe apuntes Markdown y
            convierte lo que estudias en resúmenes, cuestionarios y mapas
            mentales.
          </p>
          <ul className="mt-6 hidden gap-2 sm:grid sm:grid-cols-3">
            {features.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <Icon className="size-4 shrink-0 text-violet" />
                <span className="text-xs font-medium text-paper">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-8 hidden min-h-0 flex-1 items-end lg:flex">
          <Image
            src="/brand/login-study.svg"
            alt="Ilustración de un espacio de estudio con apuntes de cálculo, una carpeta de proyecto y un resumen generado con IA."
            width={720}
            height={540}
            priority
            unoptimized
            className="login-float mx-auto max-h-[42vh] w-full max-w-2xl object-contain object-bottom lg:max-h-full"
          />
        </div>

        <p className="relative z-10 mt-5 hidden text-xs text-mist/70 lg:block">
          Hecho para estudiar mejor, juntos.
        </p>
      </section>

      <section className="relative flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-10 lg:h-dvh lg:overflow-y-auto lg:px-10">
        <div className="absolute right-4 top-4 z-20 lg:right-6 lg:top-6">
          <ThemeToggle />
        </div>

        <div className="my-auto w-full max-w-md pt-8 sm:pt-10 lg:pt-0">
          {children}
          <p className="mt-5 text-center text-xs text-muted-foreground lg:hidden">
            Hecho para estudiar mejor, juntos.
          </p>
        </div>
      </section>
    </main>
  );
}

export function AuthCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card/95 py-0 shadow-2xl shadow-ink/10 backdrop-blur-sm dark:shadow-black/30">
      <div
        aria-hidden
        className="h-1 w-full bg-gradient-to-r from-indigo via-[#A1349F] to-coral"
      />
      <CardHeader className="gap-2 p-5 pb-0 sm:p-8 sm:pb-0">
        <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 sm:size-11">
          {icon}
        </div>
        <CardTitle className="font-heading text-2xl font-semibold sm:text-3xl">
          <h1>{title}</h1>
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-8">{children}</CardContent>
    </Card>
  );
}
