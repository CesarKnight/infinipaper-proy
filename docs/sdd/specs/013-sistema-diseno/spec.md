# Spec 013 · Sistema de diseño

| Campo | Valor |
|---|---|
| ID | `013` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Petición de crear un sistema de diseño a partir del *brand board v2* de `infinipaper-design/` |
| Dependencias | `spec 011` (dashboard, primer consumidor visual), `spec 012` (estructuración IA) |

## 1. Contexto y problema

El *brand board v2* vive hoy en tres páginas HTML de referencia dentro de `infinipaper-design/` (`Brand board`, `App icons` y `Logos and graphics`). Los valores de diseño —colores, tipografías, medidas, radios y arte del ratón— están embebidos en atributos `style` y en un `<svg>` con símbolos, no en un formato consumible por el proyecto.

Mientras tanto, el frontend usa una paleta terracota/marrón (`#92400e`, `#faf8f6`), Geist como tipografía de interfaz y no tiene iconos de aplicación, favicon propio ni manifiesto PWA. Esto produce tres problemas:

- No existe una fuente única de verdad para los valores de marca.
- Los assets de iconos y logos no se pueden usar directamente en Android, iOS, web o notificaciones.
- Cualquier implementación futura puede reinterpretar el board y divergir de él.

## 2. Objetivo

> Como **equipo de producto y desarrollo**, quiero **un sistema de diseño versionado con tokens, documentación y assets exportables** para **implementar la marca Infinipaper de forma consistente en web y aplicaciones móviles sin reinterpretar el board**.

El resultado esperado es una carpeta `infinipaper-design-system/` autónoma, con tokens consumibles, guías de uso y assets de iconos listos para Android, iOS, web y notificaciones.

## 3. Alcance

### Incluye

- Carpeta `infinipaper-design-system/` separada de los mockups de referencia.
- Tabla de colores de los modos **Paper & Ink** (claro) y **Midnight Study** (oscuro), con rol, valor, uso y contraste.
- Tokens en JSON, CSS, Tailwind v4 y TypeScript.
- Tipografía, escala, espaciado, radios, sombras y movimiento.
- SVG canónicos del ratón, marca corta (`mini`) y lockups horizontal/vertical en claro y oscuro.
- Assets Android: capas *adaptive* (fondo, frente y monocromo), *mipmaps* legacy y ficha de Play Store.
- Assets iOS: icono 1024 × 1024 en claro, oscuro y tintado, más capas para Icon Composer.
- Assets web: favicon, Apple Touch Icon, iconos PWA, *maskable*, manifiesto y tarjeta Open Graph.
- Assets de notificación: icono de barra de estado de 24 dp, icono de push y *badge* monocromo.
- Página de previsualización local del sistema.
- Scripts de generación y verificación de assets.
- Guía de accesibilidad, usos correctos/incorrectos y manifiesto de assets.
- Registro de la brecha entre el tema actual del frontend y la marca v2.

### No incluye

- Modificar `infinipaper-frontend/app/globals.css`, componentes, fuentes o metadatos de la aplicación.
- Migrar el tema actual a la nueva paleta; se propone una spec posterior.
- Crear proyectos Android Studio o Xcode; solo se entregan los assets y las capas.
- Diseñar ilustraciones, iconografía de producto adicional o un set de iconos de interfaz.
- Crear una librería de Figma o un paquete npm publicado.
- Cambios de backend, API, base de datos o infraestructura.
- Animaciones complejas o *motion design* de producto.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Debe existir `infinipaper-design-system/` como fuente única de verdad, separada de `infinipaper-design/`. | Must |
| RF-02 | El sistema debe definir tokens semánticos para modo claro y oscuro a partir del board. | Must |
| RF-03 | Debe incluir una tabla de colores con nombre, hex, rol, modo y contraste WCAG calculado. | Must |
| RF-04 | Debe documentar tipografía (Fraunces 600 e Inter 400/500/600), escala, pesos, *fallbacks* y uso. | Must |
| RF-05 | Debe documentar espaciado, radios, sombras, bordes y movimiento derivados del board. | Must |
| RF-06 | Debe incluir SVG canónicos del ratón, marca `mini`, wordmark y lockups claro/oscuro, horizontal/vertical. | Must |
| RF-07 | Debe generar iconos Android *adaptive* de 108 dp (fondo, frente y monocromo) con zona segura de 66 dp. | Must |
| RF-08 | Debe generar *mipmaps* legacy Android en mdpi, hdpi, xhdpi, xxhdpi y xxxhdpi, en variante cuadrada y redonda. | Must |
| RF-09 | Debe generar el icono de Play Store de 512 × 512 px. | Must |
| RF-10 | Debe generar iconos iOS de 1024 × 1024 px en claro, oscuro y tintado, sin esquinas redondeadas. | Must |
| RF-11 | Debe entregar capas separadas de fondo y arte para iOS 26 / Icon Composer. | Should |
| RF-12 | Debe generar favicon SVG/ICO/16/32, Apple Touch Icon 180, PWA 192/512, *maskable* 512 y manifiesto web. | Must |
| RF-13 | Debe generar una tarjeta Open Graph de 1200 × 630 px con la marca. | Should |
| RF-14 | Debe generar icono de barra de estado Android de 24 dp, icono de push 192 y *badge* monocromo. | Must |
| RF-15 | Debe entregar tokens en `design-tokens.json`, `tokens.css`, `tailwind.css` y `tokens.ts`. | Must |
| RF-16 | Debe incluir una página de previsualización local con colores, tipografía, logos e iconos. | Should |
| RF-17 | Debe incluir un script reproducible de generación de assets y otro de verificación. | Must |
| RF-18 | Debe incluir un manifiesto de assets con ruta, tamaño, formato y caso de uso. | Must |
| RF-19 | Debe documentar la diferencia entre el tema actual del frontend y la marca v2 como brecha, sin aplicarla. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Todo texto sobre fondo debe cumplir WCAG AA: ≥ 4.5:1 para texto normal y ≥ 3:1 para texto grande. | Script de contraste y tabla de evidencia. |
| RNF-02 | Los PNG se generan desde SVG canónicos; no se editan a mano. | `scripts/generar-assets.sh` reproducible. |
| RNF-03 | Los SVG no dependen de red, fuentes externas ni recursos locales para renderizar la marca. | Revisión de SVG y render aislado. |
| RNF-04 | Los PNG se exportan en sRGB, sin metadatos innecesarios y con transparencia solo donde corresponda. | Verificación con `identify`/PIL. |
| RNF-05 | Los iconos no superan 1 MB por archivo y los favicons no superan 100 KB. | Script de verificación. |
| RNF-06 | La documentación y los nombres visibles se escriben en español; los nombres de archivo siguen el estilo del repositorio. | Revisión. |
| RNF-07 | La carpeta no añade dependencias al `package.json` del frontend ni del backend. | Revisión de `git diff`. |
| RNF-08 | Los assets se pueden regenerar en Linux con `rsvg-convert`, ImageMagick y Python 3. | Ejecución en un entorno limpio. |
| RNF-09 | Las fuentes se documentan con su licencia OFL y enlace oficial; no se redistribuyen archivos binarios sin licencia. | Revisión de `docs/03-tipografia.md`. |
| RNF-10 | La previsualización funciona sin servidor y sin conexión, con *fallbacks* tipográficos. | Abrir `examples/preview.html` con `file://`. |

## 6. Criterios de aceptación

### CA-01 · Fuente única de verdad

- **Dado** el repositorio,
- **cuando** se revisa `infinipaper-design-system/`,
- **entonces** existe un README que indexa tokens, documentación, assets y scripts, y el frontend mantiene una copia sincronizada que el verificador compara con los tokens canónicos.

### CA-02 · Tabla de colores completa

- **Dado** el board v2,
- **cuando** se consulta `docs/02-color.md`,
- **entonces** todos los colores del board aparecen con nombre, hex, rol, modo y contraste, y las reglas de uso (coral solo para rellenos, etc.) están explícitas.

### CA-03 · Tokens claros y oscuros

- **Dado** el sistema de tokens,
- **cuando** se aplica `.light` o `.dark` en la previsualización,
- **entonces** fondo, texto, superficies, primario, acento, borde y foco cambian a los valores del board.

### CA-04 · Iconos Android

- **Dado** el conjunto Android,
- **cuando** se revisan los archivos,
- **entonces** existen capas *adaptive* de 108 dp con arte dentro de 66 dp, *mipmaps* en las cinco densidades y Play Store 512, con nombres y tamaños correctos.

### CA-05 · Iconos iOS

- **Dado** el conjunto iOS,
- **cuando** se revisan los archivos,
- **entonces** existen 1024 × 1024 px opacos en claro y oscuro, una variante tintada en escala de grises y capas de fondo/arte, sin esquinas redondeadas.

### CA-06 · Assets web y PWA

- **Dado** el conjunto web,
- **cuando** se revisan los archivos,
- **entonces** existen favicon SVG/ICO/16/32, Apple Touch 180, PWA 192/512, *maskable* 512 y un manifiesto válido.

### CA-07 · Notificaciones

- **Dado** el conjunto de notificaciones,
- **cuando** se revisa el icono de barra de estado,
- **entonces** es de 24 dp, blanco plano sobre fondo transparente, sin degradado, y el *badge* monocromo también es válido.

### CA-08 · Coherencia de tokens

- **Dado** los cuatro formatos de tokens,
- **cuando** se ejecuta el script de verificación,
- **entonces** los valores de color, radio, espaciado y tipografía coinciden entre JSON, CSS, Tailwind y TypeScript.

### CA-09 · Previsualización

- **Dado** `examples/preview.html`,
- **cuando** se abre en un navegador,
- **entonces** muestra swatches, escala tipográfica, lockups, iconos y estados claro/oscuro sin errores de consola.

### CA-10 · Verificación automatizada

- **Dado** el conjunto de assets,
- **cuando** se ejecuta `scripts/verificar-assets.py`,
- **entonces** valida dimensiones, formato, transparencia, contraste y presencia de archivos, y termina con código 0.

### CA-11 · Guía de uso

- **Dado** un desarrollador nuevo,
- **cuando** lee la documentación,
- **entonces** encuentra tamaños mínimos, espacio de respeto, usos correctos/incorrectos y cómo consumir los tokens.

### CA-12 · Sin cambios de runtime

- **Dado** esta spec,
- **cuando** se revisa el diff,
- **entonces** no se modifica ningún archivo de `infinipaper-frontend/`, `infinipaper-backend/` ni `infinipaper-agents/`.

## 7. Contratos e interfaces

### API

No aplica. Esta spec no añade endpoints.

### Datos

No aplica. No hay cambios de base de datos ni migraciones.

### Estructura de archivos

```text
infinipaper-design-system/
├── README.md
├── docs/
│   ├── 01-marca.md
│   ├── 02-color.md
│   ├── 03-tipografia.md
│   ├── 04-espaciado-radios-sombras.md
│   ├── 05-iconografia.md
│   ├── 06-accesibilidad.md
│   └── 07-assets.md
├── tokens/
│   ├── design-tokens.json
│   ├── tokens.css
│   ├── tailwind.css
│   ├── tokens.ts
│   └── README.md
├── assets/
│   ├── logos/
│   ├── app-icons/android/
│   ├── app-icons/ios/
│   ├── web/
│   └── notifications/
├── examples/
│   └── preview.html
└── scripts/
    ├── generar-assets.sh
    └── verificar-assets.py
```

### UI

Solo la página de previsualización. No se modifican pantallas de producto.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| No están instaladas las fuentes Fraunces/Inter | La previsualización usa *fallbacks* `serif`/`sans-serif`; los SVG de marca no dependen de fuentes. | N/A |
| No está instalado `rsvg-convert` | El script de generación muestra un error accionable y no genera PNG parciales. | Exit 1 |
| Se ejecuta la verificación sin assets | Lista los archivos faltantes y termina con error. | Exit 1 |
| Un PNG tiene dimensiones incorrectas | La verificación falla e indica ruta, esperado y obtenido. | Exit 1 |
| Un SVG tiene referencias externas | La verificación falla para garantizar assets autocontenidos. | Exit 1 |
| El modo tintado de iOS se confunde con el oscuro | La documentación explica que es una capa en escala de grises y que el sistema aplica el color. | N/A |
| Se usa el logo `mini` a 64 px o más | Se documenta que debe usarse el ratón completo a partir de 32–48 px. | N/A |
| Se usa coral para texto de cuerpo | Se marca como uso incorrecto; solo rellenos y badges con tinta. | N/A |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Crear `infinipaper-design-system/` en la raíz, separada de los mockups de `infinipaper-design/`. | Cerrada |
| D-02 | Los SVG son la fuente canónica; los PNG se generan con script y se versionan. | Cerrada |
| D-03 | Los valores del board son la fuente de verdad; cualquier valor derivado se marcará como tal. | Cerrada |
| D-04 | La tipografía oficial es Fraunces 600 + Inter 400/500/600, aunque el frontend use Geist hoy. | Cerrada |
| D-05 | Esta spec no modifica el frontend; la adopción del tema se hará en una spec posterior. | Cerrada |
| D-06 | Los iconos iOS se entregan cuadrados, opacos y sin máscara; el sistema aplica las esquinas. | Cerrada |
| D-07 | Android usa capas *adaptive* de 108 dp con contenido dentro de 66 dp. | Cerrada |
| D-08 | Los nombres de assets y carpetas van en inglés; la documentación va en español. | Cerrada |
| Q-01 | ¿Se migra el frontend a la paleta Paper & Ink / Midnight Study en la siguiente entrega? | Abierta |
| Q-02 | ¿Se sustituye Geist por Inter en la interfaz o se mantiene Geist como excepción? | Abierta |
| Q-03 | ¿El wordmark de los lockups se entrega como texto vivo o convertido a trazados? | Abierta |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | El frontend usaba terracota y Geist, no la paleta ni Inter del board. | Resuelta por la spec 014: el frontend ya usa Paper & Ink / Midnight Study e Inter. | `T-055` |
| G-02 | No hay app móvil en el repositorio; los iconos quedan preparados para una entrega futura. | No se puede validar en un proyecto Android/iOS real. | `T-056` |
| G-03 | El board no define colores de error/éxito/advertencia. | Las pantallas de estado necesitan una decisión posterior. | `T-057` |
| G-04 | El board no define una escala de movimiento ni sombras detalladas. | Se proponen valores mínimos marcados como derivados. | `T-058` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01 | `infinipaper-design-system/README.md` indexa docs, tokens, assets y scripts; `verificar-assets.py` compara la copia de `infinipaper-frontend/app/globals.css` con los tokens canónicos. | `2026-11-15` |
| CA-02 | `docs/02-color.md` incluye todos los colores del board con rol y contraste; verificación automática de pares AA. | `2026-11-15` |
| CA-03 | `examples/preview.html` muestra ambos modos con los tokens de `tokens.css`. | `2026-11-15` |
| CA-04 | 5 densidades legacy + 5 densidades adaptive; `verificar-assets.py` valida 185 comprobaciones. | `2026-11-15` |
| CA-05 | `AppIcon-1024-{light,dark,tinted}.png` opacos y capas de 1024. | `2026-11-15` |
| CA-06 | Favicon SVG/ICO/16/32/48/64, Apple Touch 180, PWA 192/512, maskable 512 y manifiesto. | `2026-11-15` |
| CA-07 | `status-bar-24dp.svg` blanco sobre transparente; badge 96 monocromo. | `2026-11-15` |
| CA-08 | `verificar-assets.py` compara JSON/CSS y valida muestras de TS. | `2026-11-15` |
| CA-09 | `examples/preview.html` abierto en Firefox: 0 errores de consola. | `2026-11-15` |
| CA-10 | `python3 scripts/verificar-assets.py` → 190 ok, 0 errores. | `2026-11-15` |
| CA-11 | `docs/01-marca.md`, `docs/05-iconografia.md` y `docs/06-accesibilidad.md`. | `2026-11-15` |
| CA-12 | No se modificó backend ni agents; frontend se modificó solo en la spec 014. | `2026-11-15` |
