import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileTextIcon,
  FolderIcon,
  GraduationCapIcon,
  LayersIcon,
  QuoteIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ProductPreview } from "@/components/marketing/product-preview";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Infinipaper · Menos infoxicación, más comprensión" },
  description:
    "Infinipaper reúne el material de tu comunidad y lo convierte en apuntes, cuestionarios, mapas mentales y búsqueda para estudiar mejor.",
};

const capabilities = [
  {
    icon: FolderIcon,
    title: "Todo tu material, ordenado",
    description:
      "Proyectos, carpetas, avisos y archivos de la comunidad en un solo espacio.",
  },
  {
    icon: FileTextIcon,
    title: "Cualquier formato como fuente",
    description:
      "PDF, Office, imágenes, audio, video y Markdown se convierten en contenido utilizable.",
  },
  {
    icon: SparklesIcon,
    title: "IA que sintetiza y practica",
    description:
      "Apuntes estructurados, cuestionarios y mapas mentales con fuentes trazables.",
  },
  {
    icon: SearchIcon,
    title: "Encuentra lo que importa",
    description:
      "Búsqueda semántica dentro del proyecto, incluso cuando no recuerdas las palabras exactas.",
  },
  {
    icon: UsersIcon,
    title: "Aprende en comunidad",
    description:
      "Owner, editores, viewers y estudiantes trabajando sobre el mismo material.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Revisable y transparente",
    description:
      "Cada recurso generado muestra su origen, su estado y sus fuentes.",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Reúne",
    description:
      "Sube apuntes, PDFs, presentaciones, audios o videos y organízalos en proyectos.",
    icon: LayersIcon,
  },
  {
    number: "02",
    title: "Genera",
    description:
      "La IA extrae, estructura y convierte el contenido en material de estudio útil.",
    icon: BrainCircuitIcon,
  },
  {
    number: "03",
    title: "Estudia",
    description:
      "Repasa con apuntes, cuestionarios, mapas mentales y búsqueda dentro del proyecto.",
    icon: GraduationCapIcon,
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-night text-paper">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-32 -top-40 size-[34rem] rounded-full bg-indigo/45 blur-3xl" />
            <div className="absolute -right-40 top-1/4 size-[36rem] rounded-full bg-violet/20 blur-3xl" />
            <div className="absolute -bottom-56 left-1/3 size-[38rem] rounded-full bg-coral/15 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-night/10 via-transparent to-night/60" />
          </div>

          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-violet">
                <span className="size-1.5 rounded-full bg-coral" />
                Estudio colaborativo, potenciado por IA
              </span>
              <h1 className="mt-5 max-w-2xl break-words font-heading text-3xl font-semibold leading-[1.04] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Menos infoxicación.
                <br />
                <span className="italic text-violet">Más comprensión.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-mist sm:text-base">
                Infinipaper reúne los apuntes, archivos y recursos de tu
                comunidad, y los convierte en material de estudio claro, visual
                y listo para practicar.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-paper text-ink hover:bg-white"
                  render={<Link href="/register" />}
                >
                  Crear cuenta
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-paper hover:bg-white/10 hover:text-white"
                  render={<Link href="/#como-funciona" />}
                >
                  Ver cómo funciona
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mist/80">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2Icon className="size-3.5 text-violet" />
                  Desde un solo apunte hasta todo el proyecto
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2Icon className="size-3.5 text-violet" />
                  Web y móvil
                </span>
              </div>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="border-b bg-background">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {[
              ["PDF, Office, audio y video", "Un mismo punto de partida"],
              ["Apuntes Markdown", "Editor y autoguardado"],
              ["IA con trazabilidad", "Cada recurso cita sus fuentes"],
              ["Comunidad y roles", "Owner, editor, viewer y estudiante"],
            ].map(([title, detail]) => (
              <div key={title} className="flex items-start gap-2.5">
                <ZapIcon className="mt-0.5 size-4 shrink-0 text-coral" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                El problema
              </p>
              <h2 className="mt-3 max-w-lg font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                El acceso al conocimiento ya no es el problema. El tiempo para
                comprenderlo sí.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Entre lecturas obligatorias, artículos, manuales y apuntes
                dispersos, la comunidad académica dedica demasiado tiempo a
                ordenar y muy poco a pensar, practicar y retener.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Clock3Icon,
                  title: "Demasiado que filtrar",
                  text: "La información abunda, pero el tiempo y la atención son limitados.",
                },
                {
                  icon: FileTextIcon,
                  title: "Material en todas partes",
                  text: "PDFs, presentaciones, audios y notas que no hablan entre sí.",
                },
                {
                  icon: BrainCircuitIcon,
                  title: "Lectura lineal y pasiva",
                  text: "Subrayar no siempre se traduce en comprensión ni en práctica.",
                },
                {
                  icon: SparklesIcon,
                  title: "La IA sin contexto no basta",
                  text: "Un resumen útil necesita fuentes, estructura y una revisión humana.",
                },
              ].map(({ icon: Icon, title, text }) => (
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

        <section id="producto" className="border-y bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Producto
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Del material disperso al estudio que sí funciona.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Un espacio para reunir, entender y practicar. Sin perder de
                vista de dónde salió cada idea.
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Cómo funciona
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Tres pasos. Menos fricción.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Infinipaper no reemplaza el estudio: quita el trabajo repetitivo
                que hay antes de estudiar.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                render={<Link href="/register" />}
              >
                Empezar ahora
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
            <div className="grid gap-3">
              {steps.map(({ number, title, description, icon: Icon }) => (
                <article
                  key={number}
                  className="flex gap-4 rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-night text-paper">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-lg font-semibold text-primary">
                        {number}
                      </span>
                      <h3 className="text-sm font-semibold">{title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-night text-paper">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <QuoteIcon className="size-8 text-coral" />
              <blockquote className="mt-4 max-w-2xl font-heading text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">
                “La dificultad ya no está en encontrar información, sino en
                convertirla en comprensión.”
              </blockquote>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
                Infinipaper nace para que estudiantes y docentes dediquen menos
                tiempo a ordenar y más a pensar, practicar y compartir lo que
                aprenden.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["Apuntes", BookOpenIcon],
                ["Cuestionarios", CheckCircle2Icon],
                ["Mapas mentales", BrainCircuitIcon],
                ["Búsqueda", SearchIcon],
              ].map(([label, Icon]) => (
                <div
                  key={label as string}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <Icon className="size-4 text-violet" />
                  <span className="text-sm text-paper">{label as string}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border bg-card px-6 py-12 shadow-xl sm:px-10">
            <div
              aria-hidden
              className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Empieza hoy
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Tu próximo material de estudio ya está en tus archivos.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Crea tu cuenta, arma tu primer proyecto y deja que Infinipaper
                te ayude a convertir el material de tu comunidad en algo que
                puedas usar.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" render={<Link href="/register" />}>
                  Crear cuenta
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="/login" />}
                >
                  Ya tengo cuenta
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
