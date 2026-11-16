# 04 · Espaciado, radios, sombras y movimiento

## 1. Espaciado

Base de **4 px**. El board usa una escala corta y consistente; no introduzcas valores fuera de ella salvo en arte.

| Token | Valor | Uso típico |
|---|---|---|
| `--ds-space-1` | 4 px | Separación mínima, icono + texto. |
| `--ds-space-2` | 8 px | Chips, grupos de iconos. |
| `--ds-space-3` | 12 px | Gap entre botones, padding de badge. |
| `--ds-space-4` | 16 px | Padding de tarjeta compacta. |
| `--ds-space-5` | 20 px | Padding de botón horizontal. |
| `--ds-space-6` | 24 px | Gap de tarjetas, padding interno. |
| `--ds-space-8` | 32 px | Separación entre bloques. |
| `--ds-space-10` | 40 px | Márgenes amplios. |
| `--ds-space-12` | 48 px | Separación entre secciones. |
| `--ds-space-16` | 64 px | Padding de página en escritorio. |
| `--ds-space-20` | 80 px | Aire en portadas. |
| `--ds-space-24` | 96 px | Máximo habitual. |

Layout del board:

- Padding de página: **64 px**.
- Gap entre secciones: **48 px**.
- Gap entre tarjetas: **32 px**.
- Gap entre controles: **12 px**.
- Altura mínima de botón: **44 px** (objetivo táctil).
- Píldoras: padding `4px 10px`, radio completo.

## 2. Radios

| Token | Valor | Uso |
|---|---|---|
| `--ds-radius-sm` | 8 px | Inputs compactos, checkbox. |
| `--ds-radius-md` | 12 px | Botones, campos y controles. |
| `--ds-radius-lg` | 16 px | Tarjetas internas y bloques. |
| `--ds-radius-xl` | 20 px | Tarjetas principales. |
| `--ds-radius-2xl` | 22 px | Iconos de app y tiles. |
| `--ds-radius-pill` | 9999 px | Badges y chips. |

No mezcles radios en un mismo grupo de controles. Un botón de 44 px usa `md` (12 px); una tarjeta usa `xl` (20 px); un icono de app usa `2xl` (22 px).

## 3. Bordes

- Grosor estándar: **1 px**.
- Botón secundario: **1.5 px**.
- Color claro: `--border` (`#E6DECF`).
- Color oscuro: `--border` (`#3B2A6E`).
- No uses bordes de 2 px salvo en foco.

## 4. Sombras

El board no define sombras; estas son **derivadas** y buscan una elevación sutil, nunca dramática.

| Token | Claro | Oscuro |
|---|---|---|
| `sm` | `0 1px 2px rgb(27 22 51 / .06)` | `0 1px 2px rgb(0 0 0 / .35)` |
| `md` | `0 2px 8px rgb(27 22 51 / .08)` | `0 2px 10px rgb(0 0 0 / .45)` |
| `lg` | `0 12px 32px rgb(27 22 51 / .12)` | `0 16px 40px rgb(0 0 0 / .55)` |

Reglas:

- Una tarjeta en reposo usa `sm` o ninguna sombra; al hacer hover, `md`.
- Los diálogos y menús usan `lg`.
- No apiles sombras (`shadow-sm` + `shadow-lg`).
- En modo oscuro, la elevación se comunica sobre todo con el color de superficie (`surface`), no con la sombra.

## 5. Foco

| Propiedad | Valor |
|---|---|
| Ancho | 2 px |
| Offset | 2 px |
| Estilo | `solid` |
| Color claro | `#4B2EA3` |
| Color oscuro | `#A98BFF` |

El foco siempre es visible y no se elimina con `outline: none` sin sustituto. En botones y enlaces, usa `outline` + `outline-offset`.

## 6. Movimiento

| Token | Valor | Uso |
|---|---|---|
| `fast` | 150 ms | Hover, color, opacidad. |
| `base` | 200 ms | Aparición de menús, tabs. |
| `slow` | 250 ms | Diálogos y sheets. |
| `slower` | 400 ms | Transiciones de página. |
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Curva por defecto. |
| `emphasized` | `cubic-bezier(0.2, 0, 0, 1.2)` | Apariciones con un pequeño rebote. |

Reglas:

- Respeta `prefers-reduced-motion: reduce`; el sistema pone las duraciones a `0ms`.
- No animes `width`, `height` ni `top/left`; usa `transform` y `opacity`.
- No uses animaciones de más de 400 ms en interacción.
- No hagas rebotes en texto ni en iconos de estado.

## 7. Ejemplo

```css
.card {
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-6);
  box-shadow: var(--ds-shadow-sm);
  transition: box-shadow var(--ds-duration-fast) var(--ds-ease-standard);
}

.card:hover {
  box-shadow: var(--ds-shadow-md);
}

.button {
  min-height: var(--ds-touch-target);
  padding: 0 var(--ds-space-5);
  border-radius: var(--ds-radius-md);
  font: 600 var(--ds-text-ui) / 1 var(--ds-font-sans);
}
```
