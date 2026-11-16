# 01 · Marca

## 1. La idea

Infinipaper convierte material de estudio disperso en apuntes y tarjetas que se pueden repasar. La marca usa un **ratón de biblioteca** dibujado con una línea continua: curioso, tranquilo y doméstico. El trazo se degrada de índigo a coral, como el paso del estudio individual a la comprensión compartida.

La identidad tiene dos modos:

- **Paper & Ink** (claro): papel cálido, tinta profunda, índigo para acciones y coral para acentos.
- **Midnight Study** (oscuro): noche profunda, superficies violeta, violeta para acciones y ámbar para destacados.

## 2. Elementos

| Elemento | Archivo | Uso |
|---|---|---|
| Ratón completo | `assets/logos/mark-fade.svg` | Marca principal. |
| Ratón monocromo | `mark-indigo.svg`, `mark-ink.svg`, `mark-white.svg` | Contextos de un solo color. |
| Marca `mini` | `mark-mini-ink.svg`, `mark-mini-white.svg` | Favicon, barra de estado y tamaños < 32 px. |
| Wordmark | `wordmark.svg`, `wordmark-ink.svg`, `wordmark-white.svg` | Solo texto, cuando el ratón ya aparece. |
| Lockup horizontal | `lockup-horizontal-light.svg`, `lockup-horizontal-dark.svg` | Cabeceras, web y material horizontal. |
| Lockup vertical | `lockup-stacked-light.svg`, `lockup-stacked-dark.svg` | Portadas, avatares y espacios cuadrados. |
| Lockup monocromo | `lockup-horizontal-ink.svg`, `lockup-horizontal-white.svg` | Impresión, sellos y fondos de un color. |

## 3. Construcción del lockup

- El ratón y el wordmark se separan por **24 px** en horizontal y **28 px** en vertical.
- La altura del ratón en horizontal es **95 px** para un wordmark de **64 px**.
- En vertical, el ratón mide **150 px** de ancho y el wordmark mantiene **64 px**.
- El wordmark usa Fraunces 600 con *tracking* `-0.01em`. En los SVG está convertido a trazados para no depender de la fuente.
- No se cambia la proporción, no se rota, no se inclina y no se separan los elementos.

## 4. Espacio de respeto

Deja libre el equivalente a la altura de la letra **i** del wordmark (aproximadamente 1/4 de la altura del ratón) alrededor del lockup. En la práctica:

- Lockup horizontal: mínimo **24 px** por cada lado.
- Lockup vertical: mínimo **32 px** por cada lado.
- Icono de app: respeta la zona segura de la plataforma (66 dp en Android; márgenes del 10–15 % en iOS).

## 5. Tamaños mínimos

| Elemento | Mínimo | Recomendado |
|---|---|---|
| Lockup horizontal | 160 px de ancho | 280 px o más |
| Lockup vertical | 120 px de ancho | 180 px o más |
| Ratón completo | 32 px | 48 px o más |
| Marca `mini` | 16 px | 24–64 px |
| Wordmark solo | 96 px de ancho | 160 px o más |

Por debajo de 32 px usa `mini`: el ratón completo pierde las espirales y el ojo.

## 6. Fondos

| Fondo | Lockup | Marca |
|---|---|---|
| Paper `#FAF6EE` | `lockup-horizontal-light` | `mark-fade` |
| Blanco `#FFFFFF` | `lockup-horizontal-light` | `mark-fade` |
| Night `#0C052C` | `lockup-horizontal-dark` | `mark-white` |
| Índigo `#4B2EA3` | `lockup-horizontal-white` | `mark-white` |
| Coral `#FF6B57` | `lockup-horizontal-ink` | `mark-ink` |
| Fotografía | Versión monocroma con velo | `mark-white` o `mark-ink` |

En fondos con poco contraste, usa la versión monocroma y añade un velo de tinta al 40–60 %.

## 7. Usos correctos

- Usa el SVG original; no lo reconstruyas con capturas.
- Mantén el degradado índigo → magenta → coral en la marca principal.
- Usa la versión oscura sobre night y la clara sobre paper.
- Deja respirar el lockup; el espacio vacío es parte de la marca.
- Para favicon y notificaciones, usa `mini` con trazos más gruesos.

## 8. Usos incorrectos

- No cambies los colores del degradado por colores de estado.
- No pongas el ratón sobre coral sin la versión de tinta.
- No uses el wordmark en Inter ni con otra fuente.
- No añadas sombras, biseles, contornos o efectos 3D.
- No recortes las orejas ni la cola del ratón.
- No uses el ratón completo a 16 px.
- No estires, comprimas ni rotes el lockup.
- No coloques el lockup sobre una foto sin velo.

## 9. Archivos fuente

Los SVG de `assets/logos/` se generan con [`scripts/generar-assets.py`](../scripts/generar-assets.py). El wordmark se convierte a trazados desde `assets/fonts/Fraunces-SemiBold.ttf`. Si cambias la geometría, edita el script y vuelve a generar; no retoques los PNG.
