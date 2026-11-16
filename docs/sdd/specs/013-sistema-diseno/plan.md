# Plan · Sistema de diseño

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-15` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se crea una carpeta `infinipaper-design-system/` autocontenida que traduce el *brand board v2* a cuatro capas: documentación de marca, tokens consumibles, assets vectoriales/ráster y herramientas de verificación. Los SVG del ratón y de los lockups se extraen de los mockups y se limpian; a partir de ellos un script genera todos los PNG de Android, iOS, web y notificaciones. La adopción en el frontend queda fuera de esta spec y se documenta como brecha.

## 2. Contexto técnico actual

- `infinipaper-design/Brand board-html/Main.dc.html`: paleta, tipografía, escala, radios, botones y reglas de uso.
- `infinipaper-design/App icons-html/Icons.dc.html`: geometría *adaptive* Android (108 dp, zona segura 66 dp), iconos iOS 1024, variantes claro/oscuro/tintado y marca `mini` para tamaños pequeños.
- `infinipaper-design/Logos and graphics-html/Logos.dc.html`: lockups horizontal/vertical claro/oscuro, favicon 16/32/64/180, icono de notificación 24 dp y push.
- `infinipaper-frontend/app/globals.css`: tema actual terracota/marrón con tokens shadcn (`--background`, `--primary`, etc.) que no coincide con el board.
- `infinipaper-frontend/app/layout.tsx`: Geist + Fraunces; el board pide Inter para interfaz.
- `infinipaper-frontend/public/`: solo iconos genéricos de Next.js; no hay favicon ni manifiesto propios.
- Herramientas disponibles en el entorno: `rsvg-convert`, ImageMagick (`convert`/`magick`), Inkscape y Python 3 con Pillow.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | Carpeta raíz `infinipaper-design-system/`. | `docs/design-system/` o meterlo en `infinipaper-design/`. | Es un activo de producto, no documentación SDD; separarlo de los mockups evita mezclar referencia y fuente de verdad. |
| D-02 | SVG canónico + PNG generado y versionado. | Solo SVG; solo PNG; generar en CI. | Los SVG son editables y los PNG están listos para usar sin depender de herramientas en cada build. |
| D-03 | Tokens en JSON como fuente primaria y exportaciones CSS/Tailwind/TS generadas o sincronizadas. | Duplicar valores a mano en cada formato. | Evita deriva entre formatos; el script de verificación compara los cuatro. |
| D-04 | Paleta del board sin reinterpretación; valores derivados marcados con `derived: true`. | Inventar una paleta nueva. | La marca v2 es la referencia aprobada. |
| D-05 | Inter oficial para interfaz; Geist queda como deuda del frontend actual. | Mantener Geist como oficial. | El board especifica Inter 400/500/600 explícitamente. |
| D-06 | iOS sin esquinas redondeadas; Android con capas *adaptive*. | Exportar iconos ya redondeados. | Cada plataforma aplica su máscara; redondear antes recorta el arte. |
| D-07 | Marca `mini` para tamaños < 32 px; ratón completo a partir de 32–48 px. | Usar el ratón completo siempre. | A 16 px los trazos y espirales no se leen; el board ya define una versión simplificada. |
| D-08 | Scripts en Bash + Python 3; sin dependencias npm nuevas. | Añadir `sharp` o un pipeline Node. | El repositorio no necesita otra dependencia y el entorno ya tiene las herramientas. |
| D-09 | Generar también capas separadas para iOS 26 / Icon Composer. | Solo el PNG plano de 1024. | Permite construir el icono por capas cuando se cree el proyecto Xcode. |
| D-10 | No tocar el frontend en esta spec. | Migrar `globals.css` y fuentes ahora. | Mantiene el cambio revisable y separa assets de adopción de tema. |

## 4. Cambios por capa

### Datos

- Sin cambios de base de datos ni migraciones.
- Rollback: no aplica.

### Backend

- Sin cambios.

### Frontend

- Sin cambios de runtime en esta spec.
- Se documenta en `docs/01-marca.md` y en `G-01` la brecha entre el tema actual y el board.
- La futura adopción (spec posterior) consistirá en sustituir tokens de `app/globals.css`, cargar Inter con `next/font` y añadir metadatos de iconos/manifest.

### Infraestructura

- No hay variables de entorno ni servicios nuevos.
- No se añaden dependencias a los `package.json`.
- Se documentan las herramientas locales necesarias para regenerar assets: `rsvg-convert`, ImageMagick y Python 3 + Pillow.

### Assets y tokens

- `assets/logos/`: `mark-fade.svg`, `mark-indigo.svg`, `mark-ink.svg`, `mark-white.svg`, `mark-mini.svg`, `wordmark.svg`, lockups horizontal/vertical claro/oscuro y versiones PNG de respaldo.
- `assets/app-icons/android/`: capas *adaptive* 108 dp, *mipmaps* 48/72/96/144/192 cuadrados y redondos, Play Store 512, previsualización de máscaras.
- `assets/app-icons/ios/`: 1024 claro/oscuro/tintado, capas de fondo/arte, sin esquinas.
- `assets/web/`: favicon SVG/ICO/16/32, Apple Touch 180, PWA 192/512, *maskable* 512, `site.webmanifest`, Open Graph 1200 × 630.
- `assets/notifications/`: barra de estado 24 dp blanco, push 192 y *badge* monocromo.
- `tokens/`: JSON, CSS, Tailwind v4 y TypeScript con los mismos valores.
- `docs/`: marca, color, tipografía, espaciado/radios/sombras, iconografía, accesibilidad y manifiesto de assets.
- `examples/preview.html`: página autocontenida con *swatches*, escala, logos e iconos.
- `scripts/generar-assets.sh`: regenera PNG desde SVG y valida herramientas.
- `scripts/verificar-assets.py`: valida archivos, dimensiones, transparencia, contraste, referencias externas y coherencia de tokens.

## 5. Contratos

### Tokens

```json
{
  "color": {
    "light": {
      "paper": { "value": "#FAF6EE", "role": "background" },
      "ink": { "value": "#1B1633", "role": "text" },
      "indigo": { "value": "#4B2EA3", "role": "primary" },
      "coral": { "value": "#FF6B57", "role": "accent-fill" }
    },
    "dark": {
      "night": { "value": "#0C052C", "role": "background" },
      "violet": { "value": "#A98BFF", "role": "primary" },
      "amber": { "value": "#FFB84D", "role": "highlight" }
    }
  }
}
```

### CSS

```css
:root {
  --color-paper: #faf6ee;
  --color-ink: #1b1633;
  --color-indigo: #4b2ea3;
  --color-coral: #ff6b57;
}
.dark {
  --color-night: #0c052c;
  --color-violet: #a98bff;
  --color-amber: #ffb84d;
}
```

### Nombres de assets

- `ic_launcher.png`, `ic_launcher_round.png` y `ic_launcher_foreground.png` para Android.
- `AppIcon-1024-light.png`, `AppIcon-1024-dark.png`, `AppIcon-1024-tinted.png` para iOS.
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `maskable-512.png` para web.
- `status-bar-24dp.png` y `notification-192.png` para notificaciones.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Unitario | Coherencia de tokens entre JSON/CSS/Tailwind/TS; cálculo de contraste. | `scripts/verificar-assets.py` |
| Assets | Dimensiones, formato, transparencia, opacidad de iOS, ausencia de referencias externas. | Python + Pillow + `identify` |
| Visual | Swatches, tipografía, lockups, iconos Android/iOS/web y modos claro/oscuro. | `examples/preview.html` en navegador |
| Manual | Lectura de guías, tamaños mínimos, espacio de respeto y usos incorrectos. | Revisión |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El wordmark depende de Fraunces y no renderiza igual sin la fuente. | Media | Medio | Convertir el wordmark a trazados o incluir una versión con texto y otra con paths; documentar la fuente. |
| `rsvg-convert` no está en otra máquina. | Media | Medio | El script comprueba herramientas y documenta alternativa con Inkscape/ImageMagick. |
| Los PNG se desincronizan de los SVG. | Media | Alto | Generación reproducible + verificación de hashes/fechas en el manifiesto. |
| El arte se recorta en la máscara Android. | Baja | Alto | Mantener el arte dentro de 66 dp y validar la capa *adaptive*. |
| El modo tintado iOS se interpreta mal. | Media | Medio | Documentar que es una capa en grises y que el sistema aplica el color. |
| El coral no cumple contraste como texto. | Baja | Medio | Regla explícita: coral solo relleno, nunca texto de cuerpo; validar pares. |
| La paleta nueva no se adopta y el frontend queda inconsistente. | Alta | Medio | Registrar `G-01` y proponer spec de migración inmediatamente después. |

## 8. Rollback

- Eliminar `infinipaper-design-system/`.
- Revertir la fila `013` en `docs/sdd/specs/README.md`.
- Revertir esta carpeta de spec.
- No hay datos, migraciones ni variables de entorno que restaurar.
- Los mockups originales de `infinipaper-design/` no se modifican.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-design-system/**` | Crear |
| `docs/sdd/specs/013-sistema-diseno/spec.md` | Crear |
| `docs/sdd/specs/013-sistema-diseno/plan.md` | Crear |
| `docs/sdd/specs/013-sistema-diseno/tasks.md` | Crear |
| `docs/sdd/specs/README.md` | Añadir fila `013` |
| `docs/README.md` | Enlazar el sistema de diseño si aplica |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01 | `T-001`, `T-010` |
| RF-02, RF-03 | `T-011`, `T-012` |
| RF-04, RF-05 | `T-013`, `T-014` |
| RF-06 | `T-020` |
| RF-07, RF-08, RF-09 | `T-021`, `T-022`, `T-023` |
| RF-10, RF-11 | `T-024`, `T-025` |
| RF-12, RF-13 | `T-026`, `T-027` |
| RF-14 | `T-028` |
| RF-15 | `T-015` |
| RF-16 | `T-040` |
| RF-17, RF-18 | `T-041`, `T-042`, `T-043` |
| RF-19 | `T-050` |
| CA-01–CA-12 | `T-044`, `T-051`, `T-052` |
