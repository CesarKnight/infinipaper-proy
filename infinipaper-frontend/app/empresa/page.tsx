import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  CheckCircle2Icon,
  Code2Icon,
  CompassIcon,
  LayersIcon,
  RocketIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Infinipaper Software · Sitio corporativo" },
  description:
    "Infinipaper Software: estudio de desarrollo de software enfocado en productos web, plataformas colaborativas e inteligencia artificial aplicada.",
};

const services = [
  {
    icon: Code2Icon,
    title: "Productos digitales",
    description:
      "Diseñamos y construimos aplicaciones web con foco en claridad, rendimiento y experiencia de uso.",
  },
  {
    icon: LayersIcon,
    title: "Plataformas colaborativas",
    description:
      "Sistemas para equipos que necesitan organizar información, coordinar permisos y trabajar sobre el mismo contexto.",
  },
  {
    icon: SparklesIcon,
    title: "IA aplicada",
    description:
      "Integramos modelos de lenguaje, búsqueda semántica y automatización donde aportan valor real al producto.",
  },
  {
    icon: CompassIcon,
    title: "Consultoría técnica",
    description:
      "Acompañamos decisiones de arquitectura, producto y entrega para convertir una idea en software sostenible.",
  },
] as const;

const values = [
  {
    icon: CompassIcon,
    title: "Claridad",
    text: "Preferimos soluciones simples, explícitas y fáciles de mantener.",
  },
  {
    icon: UsersIcon,
    title: "Colaboración",
    text: "Trabajamos cerca de las personas que usan y cuidan el producto.",
  },
  {
    icon: RocketIcon,
    title: "Impacto",
    text: "La tecnología importa cuando resuelve un problema concreto.",
  },
] as const;

export default function CompanyPage() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b bg-background">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-primary/10 blur-3xl"
          />
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <Building2Icon className="size-3.5 text-primary" />
                Sitio corporativo en construcción
              </span>
              <h1 className="mt-5 max-w-3xl font-heading text-4xl font-semibold leading-[1.04] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Construimos software que ordena la complejidad.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Infinipaper Software es un estudio de desarrollo enfocado en
                productos web, plataformas colaborativas e inteligencia
                artificial aplicada. Nos interesa convertir problemas reales en
                herramientas claras, útiles y sostenibles.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" render={<Link href="/" />}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  Volver a Infinipaper
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="/#producto" />}
                >
                  Conocer el producto
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border bg-card p-5 shadow-xl">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-night text-paper">
                    <Building2Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-semibold">
                      Infinipaper Software
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Producto · Ingeniería · IA aplicada
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2.5">
                  {[
                    ["Producto", "Web apps y experiencias centradas en la persona."],
                    ["Ingeniería", "Arquitectura, backend, frontend y datos."],
                    ["IA aplicada", "Automatización con criterio y trazabilidad."],
                  ].map(([title, text]) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-xl border bg-background/60 p-3"
                    >
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-semibold">{title}</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Este espacio es provisional. Estamos preparando el sitio
                  corporativo completo con servicios, casos y contacto.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Qué hacemos
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Software con propósito, no solo pantallas.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Trabajamos en la intersección entre producto, ingeniería y
              experiencia. Nos gustan los sistemas que hacen que la información
              sea más fácil de entender y usar.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {services.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Cómo pensamos
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance">
                Menos ruido. Más criterio.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {values.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <Icon className="size-5 text-primary" />
                  <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-[2rem] border bg-night px-6 py-12 text-paper shadow-xl sm:px-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-violet">
                <SparklesIcon className="size-3.5" />
                Sitio corporativo en preparación
              </span>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Mientras tanto, el producto ya está funcionando.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                Infinipaper es nuestra primera plataforma pública. Si quieres
                conocer cómo estamos aplicando producto, colaboración e IA,
                empieza por ahí.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-paper text-ink hover:bg-white"
                  render={<Link href="/" />}
                >
                  Ir a Infinipaper
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-paper hover:bg-white/10 hover:text-white"
                  render={<Link href="/#producto" />}
                >
                  Conocer el producto
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
