# Plan · Tema de marca en el frontend

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-15` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se sustituyen los tokens de `app/globals.css` por la paleta Paper & Ink / Midnight Study, se cambia Geist por Inter en la interfaz y se añaden los metadatos de iconos, manifiesto y Open Graph usando los assets de `infinipaper-design-system/`. No se modifica la estructura de la app ni se añaden dependencias.

## 2. Contexto técnico actual

- `app/globals.css`: tema terracota, fuentes circulares y estilos de MDXEditor.
- `app/layout.tsx`: Geist + Geist Mono + Fraunces; metadatos mínimos.
- `app/favicon.ico`: favicon genérico de 25 KB.
- No hay `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png` ni `app/manifest.ts`.
- `public/`: iconos genéricos de Next.js.
- Next 16: `metadata` y `viewport` son exportaciones separadas; `themeColor` va en `viewport`.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | Copiar los tokens semánticos directamente a `globals.css`. | Importar el CSS del sistema de diseño. | Evita una dependencia de build entre carpetas y mantiene el theme en el lugar que shadcn espera. |
| D-02 | Inter con `next/font/google`, Fraunces 600 y Geist Mono. | Inter por `<link>`; usar Geist. | `next/font` autohospeda y evita FOUT; Inter es la fuente del board. |
| D-03 | Usar `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico` y `app/opengraph-image.png`. | Solo `metadata.icons`. | Aprovecha las convenciones de Next 16 y genera las etiquetas automáticamente. |
| D-04 | `app/manifest.ts` con iconos en `public/icons/`. | Manifiesto estático en `public/`. | Tipado y coherente con App Router. |
| D-05 | Mantener la estructura de componentes y clases. | Rediseñar pantallas. | El cambio es de tema, no de flujo. |
| D-06 | No añadir dependencias. | Instalar `next-themes` de nuevo o una librería de iconos. | Ya están disponibles. |

## 4. Cambios por capa

### Datos

Sin cambios.

### Backend

Sin cambios.

### Frontend

- `app/globals.css`: reemplazar `:root`, `.dark`, `@theme inline`, sombras, radios, charts y sidebar; corregir fuentes; actualizar MDXEditor.
- `app/layout.tsx`: Inter/Fraunces/Geist Mono, `metadata` ampliado, `viewport.themeColor`.
- `app/manifest.ts`: manifiesto PWA.
- `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`, `app/opengraph-image.png`, `app/opengraph-image.alt.txt`.
- `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`.

### Infraestructura

Sin cambios de servicios. Se documenta `NEXT_PUBLIC_SITE_URL` como variable opcional para `metadataBase`; si no existe, se usa `http://localhost:3000`. No hay dependencias nuevas.

## 5. Contratos

Sin cambios de API. El manifiesto cumple `MetadataRoute.Manifest`:

```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Infinipaper",
    short_name: "Infinipaper",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6EE",
    theme_color: "#4B2EA3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Estático | Contraste de tokens, iconos y manifiesto. | `infinipaper-design-system/scripts/verificar-assets.py` |
| Build | Tipos, fuentes, metadata y rutas. | `npm run build` |
| Lint | Reglas del proyecto. | `npm run lint` |
| Manual | Claro/oscuro, títulos, iconos de pestaña y manifiesto. | Navegador |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El build no descarga Inter | Baja | Alto | Verificar red; Next cachea las fuentes. |
| Cambian sombras/radios y se ve distinto | Media | Medio | Revisión visual de pantallas principales. |
| El favicon SVG no se ve en algún navegador | Baja | Bajo | Se mantiene `favicon.ico`. |
| El manifiesto apunta a rutas inexistentes | Baja | Medio | Verificación de `public/icons/` antes del build. |
| El tema oscuro no aplica por `next-themes` | Baja | Bajo | Mantener `.dark` como selector. |

## 8. Rollback

- Revertir `app/globals.css`, `app/layout.tsx` y los archivos de metadata.
- Restaurar el `app/favicon.ico` anterior desde git.
- Eliminar `public/icons/`.
- No hay datos ni migraciones.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-frontend/app/globals.css` | Modificar |
| `infinipaper-frontend/app/layout.tsx` | Modificar |
| `infinipaper-frontend/app/manifest.ts` | Crear |
| `infinipaper-frontend/app/icon.svg` | Crear |
| `infinipaper-frontend/app/apple-icon.png` | Crear |
| `infinipaper-frontend/app/favicon.ico` | Reemplazar |
| `infinipaper-frontend/app/opengraph-image.png` | Crear |
| `infinipaper-frontend/app/opengraph-image.alt.txt` | Crear |
| `infinipaper-frontend/public/icons/*` | Crear |
| `infinipaper-frontend/public/brand/*` | Crear |
| `infinipaper-frontend/components/app-header.tsx` | Usar la marca |
| `infinipaper-frontend/.env.example` | Añadir `NEXT_PUBLIC_SITE_URL` opcional |
| `docs/README.md` | Actualizar índice y variable |
| `docs/sdd/specs/014-tema-marca-frontend/*` | Crear |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02, RF-05 | `T-010`, `T-011` |
| RF-03, RF-04 | `T-012` |
| RF-06 | `T-013` |
| RF-07, RF-08, RF-09, RF-10, RF-11 | `T-020`, `T-021`, `T-022` |
| RF-12 | `T-030`, `T-034` |
| RF-13 | `T-022`, `T-032` |
| RF-14 | `T-023` |
| CA-01–CA-09 | `T-030`, `T-031`, `T-032`, `T-033` |
| CA-10 | `T-023`, `T-033` |
