# 03 · Tipografía

## 1. Familias

| Familia | Rol | Pesos | Origen |
|---|---|---|---|
| **Fraunces** | Wordmark y títulos | 600 | [Google Fonts](https://fonts.google.com/specimen/Fraunces) · OFL 1.1 |
| **Inter** | Interfaz, etiquetas y cuerpo | 400, 500, 600 | [Google Fonts](https://fonts.google.com/specimen/Inter) · OFL 1.1 |
| **Geist Mono** | Código y datos técnicos | 400 | Ya incluida en el frontend |

Fraunces es una serif variable con personalidad editorial; se usa con peso 600 y, en el wordmark, con *tracking* `-0.01em`. Inter es la tipografía de interfaz: clara, neutra y con buenos números tabulares.

> El frontend ya usa Inter desde la spec `014-tema-marca-frontend`. La mono se mantiene en Geist Mono porque el board no define una mono oficial.

## 2. Escala

| Token | Tamaño | Interlineado | Peso | Uso |
|---|---|---|---|---|
| `display` | 64 px | 1.1 | 600 Fraunces | Portadas, hero y wordmark grande. |
| `heading` | 30 px | 1.2 | 600 Fraunces | Títulos de sección. |
| `subheading` | 20 px | 1.3 | 600 Fraunces | Títulos de tarjeta y subsecciones. |
| `body` | 16 px | 1.5 | 400 Inter | Cuerpo de texto. |
| `ui` | 15 px | 1.4 | 600 Inter | Botones y controles. |
| `small` | 14 px | 1.5 | 400 Inter | Metadatos y ayudas. |
| `label` | 12 px | 1.4 | 600 Inter, mayúsculas, `0.08em` | Etiquetas y *badges*. |

Otras medidas del board:

- Título de página: 40 px / 1.1 Fraunces 600.
- Título de tarjeta: 22 px / 1.2 Fraunces 600.
- Wordmark: 64 px / 1 Fraunces 600, `-0.01em`.
- Texto de botón: 15 px / 1 Inter 600.
- Texto de notificación: 14 px / 1.4 Inter 400.

## 3. CSS

```css
:root {
  --ds-font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --ds-font-heading: "Fraunces", ui-serif, Georgia, serif;
  --ds-font-mono: "Geist Mono", ui-monospace, monospace;
}

.display {
  font-family: var(--ds-font-heading);
  font-size: var(--ds-text-display);
  line-height: var(--ds-leading-display);
  font-weight: 600;
  letter-spacing: var(--ds-tracking-tight);
}

.body {
  font-family: var(--ds-font-sans);
  font-size: var(--ds-text-body);
  line-height: var(--ds-leading-body);
  font-weight: 400;
}

.label {
  font-family: var(--ds-font-sans);
  font-size: var(--ds-text-label);
  line-height: var(--ds-leading-label);
  font-weight: 600;
  letter-spacing: var(--ds-tracking-label);
  text-transform: uppercase;
}
```

## 4. Tailwind

```html
<h1 class="font-heading text-display font-semibold tracking-tight">
  Cell Biology, Unit 3
</h1>
<p class="text-body text-muted-foreground">14 sources · 3 contributors</p>
<span class="text-label uppercase">Flashcards</span>
```

## 5. Carga de fuentes

En Next.js se cargan con `next/font/google`:

```tsx
import { Fraunces, Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});
```

En HTML estático o correo:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

Los archivos de `assets/fonts/` son para previsualización y generación de assets; no es necesario copiarlos al frontend si se usa `next/font`.

## 6. Reglas

- No uses Fraunces para párrafos largos.
- No uses Inter para el wordmark.
- No bajes de 12 px en interfaz ni de 14 px en cuerpo de lectura.
- No uses más de tres pesos de Inter en una misma pantalla.
- Respeta el interlineado de la escala; no comprimas líneas.
- Para números y tablas, activa `font-variant-numeric: tabular-nums` si están disponibles.
- El texto de producto va en español y con sentence case; las etiquetas en mayúsculas solo con `label` y tracking amplio.
