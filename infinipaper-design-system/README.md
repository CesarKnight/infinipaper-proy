# Infinipaper · Sistema de diseño

> **Versión:** 2.0 · **Fuente:** brand board v2 (`infinipaper-design/`) · **Actualizado:** 2026-11-15

Este directorio es la **fuente única de verdad** de la marca y de los assets visuales de Infinipaper. Traduce el *brand board v2* a tokens consumibles, documentación, logos vectoriales e iconos listos para web, Android, iOS y notificaciones. El frontend mantiene una copia sincronizada en `app/globals.css` y `verificar-assets.py` comprueba que coincide.

No es un proyecto ejecutable ni un paquete publicado: es un repositorio de diseño que el frontend, las apps móviles y el material de producto consumen.

## Contenido

| Ruta | Qué contiene |
|---|---|
| [`docs/01-marca.md`](./docs/01-marca.md) | Narrativa, lockups, espacio de respeto y usos correctos/incorrectos. |
| [`docs/02-color.md`](./docs/02-color.md) | Tabla completa de colores, roles y contrastes WCAG. |
| [`docs/03-tipografia.md`](./docs/03-tipografia.md) | Fraunces, Inter, escala y *fallbacks*. |
| [`docs/04-espaciado-radios-sombras.md`](./docs/04-espaciado-radios-sombras.md) | Espaciado, radios, sombras, foco y movimiento. |
| [`docs/05-iconografia.md`](./docs/05-iconografia.md) | Ratón, marca `mini`, iconos Android/iOS/web y notificaciones. |
| [`docs/06-accesibilidad.md`](./docs/06-accesibilidad.md) | Contraste, foco, tamaños táctiles y movimiento reducido. |
| [`docs/07-assets.md`](./docs/07-assets.md) | Manifiesto de assets: ruta, tamaño, formato y uso. |
| [`tokens/`](./tokens/) | Tokens en JSON, CSS, Tailwind v4 y TypeScript. |
| [`assets/logos/`](./assets/logos/) | SVG del ratón, wordmark y lockups. |
| [`assets/app-icons/android/`](./assets/app-icons/android/) | Capas *adaptive*, *mipmaps* legacy y Play Store. |
| [`assets/app-icons/ios/`](./assets/app-icons/ios/) | Iconos 1024 claro/oscuro/tintado y capas. |
| [`assets/web/`](./assets/web/) | Favicon, Apple Touch, PWA, *maskable*, manifiesto y Open Graph. |
| [`assets/notifications/`](./assets/notifications/) | Barra de estado, *badge* y *push*. |
| [`assets/fonts/`](./assets/fonts/) | Fuentes de referencia con licencia OFL para previsualización/generación. |
| [`examples/preview.html`](./examples/preview.html) | Previsualización local de tokens, tipografía, logos e iconos. |
| [`scripts/generar-assets.py`](./scripts/generar-assets.py) | Genera SVG y PNG de forma reproducible. |
| [`scripts/verificar-assets.py`](./scripts/verificar-assets.py) | Valida dimensiones, formato, transparencia y coherencia de tokens. |

## Inicio rápido

```bash
# Regenerar todos los assets desde los SVG
cd infinipaper-design-system
python3 scripts/generar-assets.py

# Verificar que todo está en su sitio
python3 scripts/verificar-assets.py

# Abrir la previsualización (funciona con file://)
xdg-open examples/preview.html
```

Requisitos para regenerar: Python 3 con Pillow y `fontTools`, y `rsvg-convert`.

En Debian/Ubuntu:

```bash
sudo apt install librsvg2-bin python3-pil
pip install --user fonttools
```

## Consumo de tokens

### CSS

```css
@import "infinipaper-design-system/tokens/tokens.css";

.mi-boton {
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: var(--ds-radius-md);
  font-family: var(--ds-font-sans);
}
```

### Tailwind v4

```css
@import "infinipaper-design-system/tokens/tailwind.css";
```

Expone `bg-paper`, `text-ink`, `bg-indigo`, `text-muted-foreground`, `font-heading`, `text-display`, `rounded-xl`, etc.

### TypeScript

```ts
import { colors, typography, spacing } from "./tokens/tokens";

const fondo = colors.light.background; // "#FAF6EE"
```

## Reglas rápidas

- **Paper & Ink** es el modo claro; **Midnight Study** el oscuro.
- El **índigo** es la acción principal en claro; el **violeta** en oscuro.
- El **coral** es relleno y *badge*, nunca texto de cuerpo.
- En oscuro, el texto principal es blanco puro y el secundario `#C9B6E6`.
- Los iconos iOS se entregan **cuadrados y opacos**; el sistema aplica la máscara.
- Android usa capas *adaptive* de 108 dp con el arte dentro de 66 dp.
- A tamaños pequeños (< 32 px) se usa la marca `mini`, no el ratón completo.
- Los PNG se generan desde SVG; no se editan a mano.

## Estado en el frontend

La app ya usa la paleta Paper & Ink / Midnight Study, Inter para la interfaz y Fraunces para títulos desde la spec [`014-tema-marca-frontend`](../docs/sdd/specs/014-tema-marca-frontend/spec.md). La mono sigue siendo Geist Mono porque el board no define una mono oficial.

## Licencias

Fraunces e Inter se distribuyen bajo SIL Open Font License 1.1. Los textos de licencia están en [`assets/fonts/`](./assets/fonts/). El resto de assets son propiedad del proyecto.
