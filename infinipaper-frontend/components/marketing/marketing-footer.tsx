import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

const productLinks = [
  { href: "/#producto", label: "Producto" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/register", label: "Crear cuenta" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t bg-night text-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/brand/mark-dark.svg"
              alt=""
              width={36}
              height={34}
              unoptimized
              className="h-9 w-auto"
            />
            <span className="font-heading text-xl font-semibold">
              Infinipaper
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
            El material de tu comunidad, convertido en estudio claro, visual y
            accionable. Hecho para estudiar mejor, juntos.
          </p>
          <p className="mt-6 text-xs text-mist/60">
            © {new Date().getFullYear()} Infinipaper Software
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-violet">
            Producto
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {productLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-mist transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-violet">
            Compañía
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/empresa"
                className="inline-flex items-center gap-1 text-mist transition-colors hover:text-white"
              >
                Sitio corporativo
                <ArrowUpRightIcon className="size-3" />
              </Link>
            </li>
            <li>
              <Link
                href="/empresa#equipo"
                className="text-mist transition-colors hover:text-white"
              >
                Equipo
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="text-mist transition-colors hover:text-white"
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
          <p className="mt-6 max-w-xs text-xs leading-relaxed text-mist/60">
            Próximamente: casos, servicios y contacto de Infinipaper Software.
          </p>
        </div>
      </div>
    </footer>
  );
}
