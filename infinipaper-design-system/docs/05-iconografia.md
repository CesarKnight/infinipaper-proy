# 05 · Iconografía y assets de aplicación

## 1. El ratón

El ratón es la marca, no un icono de interfaz. Se dibuja con una línea de **4 px** sobre un `viewBox` de 100 × 100 y un degradado de índigo a coral. La versión `mini` reduce las espirales, engrosa el trazo a **7 px** y aumenta el ojo a **4 px** para que se lea a 16–24 px.

| Versión | Archivo | Cuándo |
|---|---|---|
| Completa | `assets/logos/mark-fade.svg` | ≥ 32 px, fondos claros. |
| Completa monocroma | `mark-indigo.svg`, `mark-ink.svg`, `mark-white.svg` | Un solo color. |
| `mini` | `mark-mini-ink.svg`, `mark-mini-white.svg` | Favicon, barra de estado, < 32 px. |

## 2. Android

Android usa iconos *adaptive*: una capa de fondo y una de frente, ambas de **108 × 108 dp**. El sistema recorta a una máscara (círculo, *squircle* o cuadrado redondeado). El arte debe caber en el círculo central de **66 dp**; el cuadrado visible es de 72 dp.

| Recurso | Ruta | Tamaño |
|---|---|---|
| Fondo | `assets/app-icons/android/src/ic_launcher_background.svg` | 108 dp |
| Frente | `assets/app-icons/android/src/ic_launcher_foreground.svg` | 108 dp, zona segura 66 dp |
| Monocromo | `assets/app-icons/android/src/ic_launcher_monochrome.svg` | 108 dp |
| Guía | `assets/app-icons/android/src/guia-zona-segura.svg` | 108 dp |
| Legacy cuadrado | `res/mipmap-*/ic_launcher.png` | 48–192 px |
| Legacy redondo | `res/mipmap-*/ic_launcher_round.png` | 48–192 px |
| Adaptive XML | `res/mipmap-anydpi-v26/ic_launcher.xml` | — |
| Adaptive XML + monocromo | `res/mipmap-anydpi-v33/ic_launcher.xml` | — |
| Play Store | `assets/app-icons/android/play-store-icon-512.png` | 512 px |

Densidades:

| Carpeta | Legacy | Adaptive |
|---|---|---|
| `mdpi` | 48 px | 108 px |
| `hdpi` | 72 px | 162 px |
| `xhdpi` | 96 px | 216 px |
| `xxhdpi` | 144 px | 324 px |
| `xxxhdpi` | 192 px | 432 px |

Para integrarlo en un proyecto Android, copia `assets/app-icons/android/res/` sobre `app/src/main/res/`. El XML *adaptive* ya referencia las capas.

El icono monocromo se usa en Android 13+ con *themed icons*. El sistema toma el canal alfa y aplica su propio color; por eso el arte es una silueta plana sin degradado.

## 3. iOS

iOS requiere un icono **1024 × 1024 px**, opaco y **sin esquinas redondeadas**: el sistema aplica su propia máscara. Para iOS 18/26 se entregan también variantes oscura y tintada, y capas separadas para **Icon Composer**.

| Archivo | Uso |
|---|---|
| `assets/app-icons/ios/AppIcon-1024-light.png` | Icono claro por defecto. |
| `assets/app-icons/ios/AppIcon-1024-dark.png` | Variante oscura. |
| `assets/app-icons/ios/AppIcon-1024-tinted.png` | Variante tintada (grises). |
| `assets/app-icons/ios/AppIcon-1024.png` | Copia del claro para herramientas que esperan un único archivo. |
| `assets/app-icons/ios/layers/background-*.png` | Capa de fondo para Icon Composer. |
| `assets/app-icons/ios/layers/mark-*.png` | Capa de arte para Icon Composer. |

Reglas:

- No redondees las esquinas.
- No dejes transparencia en el PNG final de 1024.
- Mantén el ratón centrado y con margen; las esquinas se recortan.
- Comprueba primero la versión en grises: si el ratón se lee, se leerá en todos los modos.
- En iOS 26, construye el icono en Xcode con las capas de `layers/`; el fondo y el arte van separados.

## 4. Web

| Archivo | Tamaño | Uso |
|---|---|---|
| `assets/web/favicon.svg` | vector | Favicon moderno. |
| `assets/web/favicon.ico` | 16/32/48/64 | Navegadores antiguos y pestañas. |
| `assets/web/favicon-16.png` | 16 | Pestaña. |
| `assets/web/favicon-32.png` | 32 | Pestaña/retina. |
| `assets/web/apple-touch-icon-180.png` | 180 | Pantalla de inicio iOS. |
| `assets/web/icon-192.png` | 192 | PWA. |
| `assets/web/icon-512.png` | 512 | PWA y splash. |
| `assets/web/maskable-512.png` | 512 | PWA *maskable*. |
| `assets/web/site.webmanifest` | — | Manifiesto. |
| `assets/web/og-image.png` | 1200 × 630 | Open Graph. |

El favicon y el Apple Touch usan la marca `mini` sobre el tile oscuro, como en el board. Los iconos PWA usan el ratón completo sobre paper. El *maskable* deja el arte dentro del 75 % central para que ninguna máscara lo recorte.

Manifiesto recomendado:

```json
{
  "name": "Infinipaper",
  "short_name": "Infinipaper",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF6EE",
  "theme_color": "#4B2EA3",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 5. Notificaciones

| Archivo | Tamaño | Uso |
|---|---|---|
| `assets/notifications/status-bar-24dp.svg` | 24 dp | Icono de barra de estado Android. |
| `assets/notifications/status-bar-24dp-*.png` | 24/48/72/96 | Densidades. |
| `assets/notifications/notification-192.png` | 192 | Push web / iOS. |
| `assets/notifications/badge-96.png` | 96 | *Badge* monocromo web. |
| `assets/notifications/notification-avatar-40.png` | 40 | Avatar circular en una notificación. |

El icono de barra de estado es **blanco plano sobre transparente**, sin degradado. El color de acento de la notificación es índigo `#4B2EA3`. Para web push, envía `notification-192.png` y un *badge* monocromo.

## 6. Iconos de interfaz

La UI usa `lucide-react` (ya instalado). Reglas:

- Tamaños: 16 px (compacto), 20 px (por defecto), 24 px (destacado).
- Trazo: 1.75–2 px; no mezcles grosores en el mismo grupo.
- Color: `currentColor`, alineado con el texto.
- No uses el ratón como icono de acción; reserva la marca para identidad.
- No inventes iconos de marca para funciones que Lucide ya cubre.
- En botones, el icono va a 16–20 px y con `aria-hidden="true"` si el texto ya describe la acción.

## 7. Regenerar

```bash
cd infinipaper-design-system
python3 scripts/generar-assets.py
python3 scripts/verificar-assets.py
```

Los SVG de `assets/app-icons/*/src/` son las fuentes. Los PNG de `res/`, `layers/`, `assets/web/` y `assets/notifications/` se generan; no los edites a mano.
