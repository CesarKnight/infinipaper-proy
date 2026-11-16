# Spec 014 · Tema de marca en el frontend

| Campo | Valor |
|---|---|
| ID | `014` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Aprobación de la spec 013 y decisión de adoptar el tema del brand board v2 |
| Dependencias | `013` (sistema de diseño) |

## 1. Contexto y problema

El frontend usa una paleta terracota/marrón y Geist como tipografía de interfaz. El sistema de diseño 013 ya define la marca v2 (Paper & Ink / Midnight Study), pero la app sigue mostrando el tema anterior. Además, `globals.css` contiene tokens de fuente circulares (`--font-sans: var(--font-sans)`) y no hay favicon, iconos PWA, Apple Touch ni manifiesto propios.

Sin esta spec, el sistema de diseño queda como documentación y la app no refleja la marca.

## 2. Objetivo

> Como **usuario de Infinipaper**, quiero **una interfaz coherente con la marca v2 en claro y oscuro** para **reconocer el producto y navegar con la misma identidad en web y en la app instalable**.

## 3. Alcance

### Incluye

- Sustituir los tokens de color de `app/globals.css` por los de la spec 013.
- Cargar Inter con `next/font/google` y mantener Fraunces para títulos.
- Corregir el cableado de `--font-sans`, `--font-heading` y `--font-mono`.
- Actualizar radios, sombras, charts y sidebar a la marca.
- Actualizar los estilos del editor Markdown que referencian fuentes antiguas.
- Añadir favicon, icono SVG, Apple Touch, Open Graph y manifiesto PWA con los assets de 013.
- Añadir `viewport.themeColor` para claro y oscuro.
- Configurar `metadataBase` con `NEXT_PUBLIC_SITE_URL` opcional (fallback `http://localhost:3000`).
- Verificar contraste, `lint` y `build`.

### No incluye

- Cambiar la estructura, rutas, componentes o flujos de la app.
- Rediseñar pantallas más allá de los tokens.
- Añadir una app móvil.
- Cambiar el backend, la API o la base de datos.
- Introducir una dependencia nueva.
- Cambiar la mono Geist; el board no define una mono oficial.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El modo claro usa Paper `#FAF6EE`, Ink `#1B1633`, Indigo `#4B2EA3` y Coral `#FF6B57` como acento. | Must |
| RF-02 | El modo oscuro usa Night `#0C052C`, superficie `#291054`, Violeta `#A98BFF` y Ámbar `#FFB84D`. | Must |
| RF-03 | La interfaz carga Inter 400/500/600; los títulos usan Fraunces 600. | Must |
| RF-04 | `--font-sans`, `--font-heading` y `--font-mono` resuelven a fuentes reales, sin referencias circulares. | Must |
| RF-05 | Radios, sombras, charts y sidebar usan los tokens de la spec 013. | Should |
| RF-06 | El editor Markdown usa Inter/Fraunces/Geist Mono y los tokens semánticos nuevos. | Must |
| RF-07 | Existe favicon propio (`app/favicon.ico`), icono SVG (`app/icon.svg`) y Apple Touch (`app/apple-icon.png`). | Must |
| RF-08 | Existe `app/manifest.ts` con iconos 192/512/maskable y colores de marca. | Must |
| RF-09 | Existe `app/opengraph-image.png` de 1200 × 630 y su texto alternativo. | Should |
| RF-10 | `viewport.themeColor` declara `#FAF6EE` en claro y `#0C052C` en oscuro. | Should |
| RF-11 | El manifiesto y los iconos se sirven desde `public/icons/`. | Must |
| RF-12 | No se añaden dependencias ni se modifican backend/agents. | Must |
| RF-13 | `metadataBase` usa `NEXT_PUBLIC_SITE_URL` si existe y, si no, un fallback local; el build no emite el aviso de metadataBase. | Should |
| RF-14 | El header usa la marca del ratón en claro/oscuro en lugar del bloque genérico "I". | Should |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | Todos los pares texto/fondo mantienen WCAG AA. | Script de 013 + revisión visual. |
| RNF-02 | `npm run lint` y `npm run build` pasan. | Comandos en `infinipaper-frontend/`. |
| RNF-03 | No hay cambios de API ni de datos. La única variable nueva es `NEXT_PUBLIC_SITE_URL`, opcional y con fallback. | `git diff` y revisión de `.env.example`. |
| RNF-04 | Las fuentes se cargan con `next/font`; no se añade un `<link>` externo en el layout. | Revisión de `layout.tsx`. |
| RNF-05 | La app sigue funcionando sin conexión a Google Fonts en runtime (fuentes autohospedadas por Next). | Build y revisión. |
| RNF-06 | Los iconos no superan 8 MB (Open Graph) ni 1 MB (resto). | Verificación de 013. |

## 6. Criterios de aceptación

### CA-01 · Modo claro

- **Dado** un usuario con tema claro,
- **cuando** abre la app,
- **entonces** el fondo es Paper, el texto Ink y las acciones principales son índigo.

### CA-02 · Modo oscuro

- **Dado** un usuario con tema oscuro,
- **cuando** abre la app,
- **entonces** el fondo es Night, las tarjetas `#291054` y las acciones principales violeta.

### CA-03 · Tipografía

- **Dado** cualquier título con `font-heading`,
- **cuando** se inspecciona,
- **entonces** usa Fraunces; el cuerpo usa Inter.

### CA-04 · Iconos

- **Dado** el HTML generado,
- **cuando** se revisa el `<head>`,
- **entonces** incluye favicon, icono SVG, Apple Touch y manifiesto.

### CA-05 · Manifiesto

- **Dado** `/manifest.webmanifest`,
- **cuando** se solicita,
- **entonces** devuelve los iconos 192/512/maskable y los colores de marca.

### CA-06 · Open Graph

- **Dado** una vista previa social,
- **cuando** se solicita la imagen,
- **entonces** devuelve 1200 × 630 con el lockup de marca.

### CA-07 · Contraste

- **Dado** los tokens aplicados,
- **cuando** se ejecuta el verificador,
- **entonces** los pares principales cumplen AA.

### CA-08 · Calidad

- **Dado** el cambio,
- **cuando** se ejecutan `npm run lint` y `npm run build`,
- **entonces** terminan sin errores.

### CA-09 · metadataBase

- **Dado** el build de producción,
- **cuando** se revisa la salida,
- **entonces** no aparece el aviso de `metadataBase` y las URLs de Open Graph usan el sitio configurado o el fallback local.

### CA-10 · Marca en el header

- **Dado** una página con `AppHeader`,
- **cuando** se muestra en claro u oscuro,
- **entonces** el logo es el ratón de la marca (fade en claro, blanco en oscuro) y no un bloque genérico.

## 7. Contratos e interfaces

### API

No aplica.

### Datos

No aplica.

### UI

- `app/globals.css`: tokens de tema.
- `app/layout.tsx`: fuentes, metadatos y viewport.
- `app/manifest.ts`: manifiesto PWA.
- `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png`: iconos.
- `public/icons/`: copias de PWA.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| El navegador no soporta SVG favicon | Usa `favicon.ico`. | N/A |
| El usuario instala la PWA | Usa iconos 192/512 y maskable. | N/A |
| `next/font` no puede descargar la fuente en build | El build falla; se revisa la red. | N/A |
| El tema oscuro se activa con `next-themes` | `.dark` aplica los tokens de Midnight Study. | N/A |
| Un componente usa coral como texto | Se detecta en revisión; no se permite. | N/A |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Adoptar la paleta y las fuentes de la spec 013 ahora. | Cerrada |
| D-02 | Mantener Geist Mono para código; no hay mono en el board. | Cerrada |
| D-03 | No cambiar la estructura de componentes; solo tokens y metadatos. | Cerrada |
| D-04 | Usar `next/font/google` para Inter y Fraunces. | Cerrada |
| D-05 | Copiar los assets web a `public/icons/` y usar las convenciones de metadata de Next 16. | Cerrada |
| Q-01 | ¿Se adoptará también la tipografía en correos o documentos externos? | Abierta |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No se valida en un dispositivo iOS/Android real. | Los iconos se validan por dimensiones y formato. | `T-040` |
| G-02 | Los colores de error/éxito/advertencia son derivados. | Requieren validación de producto. | `T-041` |
| G-03 | La mono sigue siendo Geist. | Diferencia menor con el board, que no define mono. | Aceptada |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01 | Captura de `/login` en claro: fondo Paper, botón índigo, texto Ink. | `2026-11-15` |
| CA-02 | Captura de `/login` con `.dark`: fondo Night, tarjeta `#291054`, botón violeta. | `2026-11-15` |
| CA-03 | `document.fonts.check("16px Inter")` y `("600 30px Fraunces")` → `true`; body computa `Inter`. | `2026-11-15` |
| CA-04 | `<head>` incluye `favicon.ico`, `icon.svg`, `apple-icon.png` y `manifest.webmanifest`. | `2026-11-15` |
| CA-05 | `GET /manifest.webmanifest` → 200 con iconos 192/512/maskable y `theme_color #4B2EA3`. | `2026-11-15` |
| CA-06 | `GET /opengraph-image.png` → 200, 1200 × 630, con lockup. | `2026-11-15` |
| CA-07 | `infinipaper-design-system/scripts/verificar-assets.py` → 190 ok, 0 errores. | `2026-11-15` |
| CA-08 | `npm run lint` y `npm run build` → exit 0; build de Next 16 con 13 rutas. | `2026-11-15` |
| CA-09 | Build sin aviso de `metadataBase`; `metadataBase` usa `NEXT_PUBLIC_SITE_URL` o `http://localhost:3000`. | `2026-11-15` |
| CA-10 | Capturas de `/users` en claro y oscuro: el header muestra el ratón fade/blanco. | `2026-11-15` |
