# 07 · Manifiesto de assets

Todos los PNG se generan desde los SVG con `python3 scripts/generar-assets.py`. Los SVG de `assets/logos/` y `assets/app-icons/*/src/` son las fuentes editables; los PNG de `res/`, `layers/`, `web/` y `notifications/` son entregables.

## 1. Logos

| Archivo | Formato | Uso |
|---|---|---|
| `assets/logos/mark-fade.svg` | SVG | Marca principal con degradado. |
| `assets/logos/mark-indigo.svg` | SVG | Marca monocroma índigo. |
| `assets/logos/mark-ink.svg` | SVG | Marca monocroma tinta. |
| `assets/logos/mark-white.svg` | SVG | Marca monocroma blanca. |
| `assets/logos/mark-mini-ink.svg` | SVG | `mini` para tamaños pequeños en claro. |
| `assets/logos/mark-mini-white.svg` | SVG | `mini` para tamaños pequeños en oscuro. |
| `assets/logos/wordmark.svg` | SVG | Wordmark con `currentColor`. |
| `assets/logos/wordmark-ink.svg` | SVG | Wordmark tinta. |
| `assets/logos/wordmark-white.svg` | SVG | Wordmark blanco. |
| `assets/logos/lockup-horizontal-light.svg` | SVG | Lockup horizontal claro. |
| `assets/logos/lockup-horizontal-dark.svg` | SVG | Lockup horizontal oscuro. |
| `assets/logos/lockup-horizontal-ink.svg` | SVG | Lockup horizontal monocromo tinta. |
| `assets/logos/lockup-horizontal-white.svg` | SVG | Lockup horizontal monocromo blanco. |
| `assets/logos/lockup-stacked-light.svg` | SVG | Lockup vertical claro. |
| `assets/logos/lockup-stacked-dark.svg` | SVG | Lockup vertical oscuro. |

## 2. Android

| Archivo | Tamaño | Uso |
|---|---|---|
| `assets/app-icons/android/src/ic_launcher_background.svg` | 108 dp | Capa de fondo *adaptive*. |
| `assets/app-icons/android/src/ic_launcher_foreground.svg` | 108 dp | Capa de frente, zona segura 66 dp. |
| `assets/app-icons/android/src/ic_launcher_monochrome.svg` | 108 dp | Capa monocroma para *themed icons*. |
| `assets/app-icons/android/src/guia-zona-segura.svg` | 108 dp | Guía de zona segura (no usar en producción). |
| `assets/app-icons/android/src/ic_launcher_legacy.svg` | 100 × 100 | Fuente legacy cuadrada. |
| `assets/app-icons/android/src/ic_launcher_round.svg` | 100 × 100 | Fuente legacy redonda. |
| `assets/app-icons/android/src/ic_launcher_playstore.svg` | 100 × 100 | Fuente de Play Store. |
| `assets/app-icons/android/res/drawable-mdpi/ic_launcher_foreground.png` | 108 × 108 | Frente mdpi. |
| `assets/app-icons/android/res/drawable-hdpi/ic_launcher_foreground.png` | 162 × 162 | Frente hdpi. |
| `assets/app-icons/android/res/drawable-xhdpi/ic_launcher_foreground.png` | 216 × 216 | Frente xhdpi. |
| `assets/app-icons/android/res/drawable-xxhdpi/ic_launcher_foreground.png` | 324 × 324 | Frente xxhdpi. |
| `assets/app-icons/android/res/drawable-xxxhdpi/ic_launcher_foreground.png` | 432 × 432 | Frente xxxhdpi. |
| `assets/app-icons/android/res/drawable-*/ic_launcher_background.png` | 108–432 | Fondo por densidad. |
| `assets/app-icons/android/res/drawable-*/ic_launcher_monochrome.png` | 108–432 | Monocromo por densidad. |
| `assets/app-icons/android/res/mipmap-mdpi/ic_launcher.png` | 48 × 48 | Legacy mdpi. |
| `assets/app-icons/android/res/mipmap-mdpi/ic_launcher_round.png` | 48 × 48 | Legacy redondo mdpi. |
| `assets/app-icons/android/res/mipmap-hdpi/ic_launcher.png` | 72 × 72 | Legacy hdpi. |
| `assets/app-icons/android/res/mipmap-hdpi/ic_launcher_round.png` | 72 × 72 | Legacy redondo hdpi. |
| `assets/app-icons/android/res/mipmap-xhdpi/ic_launcher.png` | 96 × 96 | Legacy xhdpi. |
| `assets/app-icons/android/res/mipmap-xhdpi/ic_launcher_round.png` | 96 × 96 | Legacy redondo xhdpi. |
| `assets/app-icons/android/res/mipmap-xxhdpi/ic_launcher.png` | 144 × 144 | Legacy xxhdpi. |
| `assets/app-icons/android/res/mipmap-xxhdpi/ic_launcher_round.png` | 144 × 144 | Legacy redondo xxhdpi. |
| `assets/app-icons/android/res/mipmap-xxxhdpi/ic_launcher.png` | 192 × 192 | Legacy xxxhdpi. |
| `assets/app-icons/android/res/mipmap-xxxhdpi/ic_launcher_round.png` | 192 × 192 | Legacy redondo xxxhdpi. |
| `assets/app-icons/android/res/mipmap-anydpi-v26/ic_launcher.xml` | — | Adaptive icon. |
| `assets/app-icons/android/res/mipmap-anydpi-v26/ic_launcher_round.xml` | — | Adaptive icon redondo. |
| `assets/app-icons/android/res/mipmap-anydpi-v33/ic_launcher.xml` | — | Adaptive icon con monocromo (Android 13+). |
| `assets/app-icons/android/res/mipmap-anydpi-v33/ic_launcher_round.xml` | — | Adaptive icon redondo con monocromo. |
| `assets/app-icons/android/play-store-icon-512.png` | 512 × 512 | Ficha de Play Store. |
| `assets/app-icons/android/guia-zona-segura-512.png` | 512 × 512 | Guía visual de zona segura. |

## 3. iOS

| Archivo | Tamaño | Uso |
|---|---|---|
| `assets/app-icons/ios/AppIcon-1024-light.png` | 1024 × 1024 | Icono claro. |
| `assets/app-icons/ios/AppIcon-1024-dark.png` | 1024 × 1024 | Icono oscuro. |
| `assets/app-icons/ios/AppIcon-1024-tinted.png` | 1024 × 1024 | Icono tintado en grises. |
| `assets/app-icons/ios/AppIcon-1024.png` | 1024 × 1024 | Copia del claro. |
| `assets/app-icons/ios/layers/background-light-1024.png` | 1024 × 1024 | Fondo claro para Icon Composer. |
| `assets/app-icons/ios/layers/background-dark-1024.png` | 1024 × 1024 | Fondo oscuro. |
| `assets/app-icons/ios/layers/mark-light-1024.png` | 1024 × 1024 | Arte claro transparente. |
| `assets/app-icons/ios/layers/mark-dark-1024.png` | 1024 × 1024 | Arte oscuro transparente. |
| `assets/app-icons/ios/layers/mark-tinted-1024.png` | 1024 × 1024 | Arte tintado transparente. |
| `assets/app-icons/ios/src/AppIcon-light.svg` | 100 × 100 | Fuente del icono claro. |
| `assets/app-icons/ios/src/AppIcon-dark.svg` | 100 × 100 | Fuente del icono oscuro. |
| `assets/app-icons/ios/src/AppIcon-tinted.svg` | 100 × 100 | Fuente del icono tintado. |

## 4. Web

| Archivo | Tamaño | Uso |
|---|---|---|
| `assets/web/favicon.svg` | vector | Favicon moderno. |
| `assets/web/favicon.ico` | 16/32/48/64 | Favicon clásico. |
| `assets/web/favicon-16.png` | 16 × 16 | Pestaña. |
| `assets/web/favicon-32.png` | 32 × 32 | Pestaña/retina. |
| `assets/web/favicon-48.png` | 48 × 48 | Windows/Android. |
| `assets/web/favicon-64.png` | 64 × 64 | Alta densidad. |
| `assets/web/apple-touch-icon-180.png` | 180 × 180 | Inicio iOS. |
| `assets/web/icon-192.png` | 192 × 192 | PWA. |
| `assets/web/icon-512.png` | 512 × 512 | PWA. |
| `assets/web/maskable-512.png` | 512 × 512 | PWA *maskable*. |
| `assets/web/site.webmanifest` | — | Manifiesto web. |
| `assets/web/og-image.png` | 1200 × 630 | Open Graph. |
| `assets/web/og-image.svg` | 1200 × 630 | Fuente del Open Graph. |

## 5. Notificaciones

| Archivo | Tamaño | Uso |
|---|---|---|
| `assets/notifications/status-bar-24dp.svg` | 24 dp | Barra de estado Android. |
| `assets/notifications/status-bar-24dp-24.png` | 24 × 24 | mdpi. |
| `assets/notifications/status-bar-24dp-48.png` | 48 × 48 | hdpi. |
| `assets/notifications/status-bar-24dp-72.png` | 72 × 72 | xhdpi. |
| `assets/notifications/status-bar-24dp-96.png` | 96 × 96 | xxhdpi. |
| `assets/notifications/notification-192.png` | 192 × 192 | Push web/iOS. |
| `assets/notifications/badge-96.png` | 96 × 96 | Badge monocromo. |
| `assets/notifications/notification-avatar-40.png` | 40 × 40 | Avatar circular. |

## 6. Fuentes

| Archivo | Uso |
|---|---|
| `assets/fonts/Fraunces-SemiBold.ttf` | Wordmark y títulos; generación de SVG. |
| `assets/fonts/Inter-Regular.ttf` | Interfaz 400. |
| `assets/fonts/Inter-Medium.ttf` | Interfaz 500. |
| `assets/fonts/Inter-SemiBold.ttf` | Interfaz 600. |
| `assets/fonts/OFL-Fraunces.txt` | Licencia OFL 1.1. |
| `assets/fonts/OFL-Inter.txt` | Licencia OFL 1.1. |

## 7. Criterios de aceptación de assets

- Los PNG de app son cuadrados y con el tamaño exacto indicado.
- Los iconos iOS de 1024 son opacos (sin canal alfa).
- Las capas iOS de arte sí tienen transparencia.
- Los iconos `maskable` dejan el arte dentro del 75 % central.
- El icono de barra de estado es blanco sobre transparente.
- El favicon y el Apple Touch usan `mini`; los PWA usan el ratón completo.
- Los SVG no tienen referencias externas ni fuentes embebidas.
- Los nombres y rutas coinciden con este manifiesto.
