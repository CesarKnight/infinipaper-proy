import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Building2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/#producto", label: "Producto" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/empresa", label: "Empresa" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <Image
            src="/brand/mark.svg"
            alt=""
            width={34}
            height={32}
            priority
            unoptimized
            className="h-8 w-auto dark:hidden"
          />
          <Image
            src="/brand/mark-dark.svg"
            alt=""
            width={34}
            height={32}
            priority
            unoptimized
            className="hidden h-8 w-auto dark:block"
          />
          Infinipaper
        </Link>

        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            render={<Link href="/login" />}
          >
            Iniciar sesión
          </Button>
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            render={<Link href="/register" />}
          >
            Crear cuenta
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
      <div className="border-t border-border/50 bg-muted/30 px-4 py-2 text-center text-[11px] text-muted-foreground md:hidden">
        <Link href="/empresa" className="inline-flex items-center gap-1.5">
          <Building2Icon className="size-3" />
          Conoce Infinipaper Software
        </Link>
      </div>
    </header>
  );
}
