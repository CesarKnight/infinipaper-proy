# Tokens

Cuatro formatos con los mismos valores. `design-tokens.json` es la referencia; `tokens.css`, `tailwind.css` y `tokens.ts` deben coincidir.

| Archivo | Para qué |
|---|---|
| `design-tokens.json` | Fuente estructurada, documentación y herramientas. |
| `tokens.css` | Variables CSS y clases de tema (`.dark`). |
| `tailwind.css` | Mapeo a utilidades de Tailwind v4. |
| `tokens.ts` | Consumo tipado en React/TS. |

## Orden de importación

```css
@import "infinipaper-design-system/tokens/tokens.css";
@import "infinipaper-design-system/tokens/tailwind.css";
```

`tailwind.css` ya importa `tokens.css`; si usas el segundo, no dupliques el primero.

## Tema oscuro

`tokens.css` aplica el modo oscuro con `.dark` o `[data-theme="dark"]`:

```html
<html class="dark">
  ...
</html>
```

`next-themes` añade `.dark` al elemento `<html>`; no necesitas configuración extra.

## Nombres

- Primitivos: `--ds-*` (paper, ink, indigo, coral, night, violet, amber…).
- Semánticos shadcn/Base UI: `--background`, `--foreground`, `--primary`, etc.
- Tipografía: `--ds-font-*`, `--ds-text-*`, `--ds-leading-*`.
- Radios: `--ds-radius-*`.
- Sombras: `--ds-shadow-*`.
- Movimiento: `--ds-duration-*`, `--ds-ease-*`.

No uses un primitivo directamente en componentes de producto; usa el semántico. Los primitivos son para arte, gráficos y casos excepcionales.

## Sincronización

`python3 scripts/verificar-assets.py` (desde la raíz del sistema) comprueba que:

- Los valores de `design-tokens.json` coinciden con `tokens.css`.
- La copia de `infinipaper-frontend/app/globals.css` coincide con los tokens semánticos.
- Los pares de contraste cumplen AA.
- Los archivos de assets existen y tienen las dimensiones esperadas.
- Los SVG no contienen `http://`, `https://` ni `@import`.
