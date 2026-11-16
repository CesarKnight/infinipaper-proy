# 06 · Accesibilidad

## 1. Contraste

El sistema cumple **WCAG 2.2 AA** en los pares texto/fondo documentados:

- Texto normal: **≥ 4.5:1**.
- Texto grande (≥ 24 px, o ≥ 19 px en negrita): **≥ 3:1**.
- Componentes de interfaz y foco: **≥ 3:1**.
- No se usa color como único indicador de estado.

Pares verificados:

| Modo | Par | Ratio |
|---|---|---:|
| Claro | Ink sobre Paper | 16.11:1 |
| Claro | Muted sobre Paper | 6.49:1 |
| Claro | Blanco sobre Indigo | 9.46:1 |
| Claro | Tinta sobre Coral | 6.20:1 |
| Oscuro | Blanco sobre Night | 19.56:1 |
| Oscuro | `#C9B6E6` sobre Night | 10.54:1 |
| Oscuro | Night sobre Violet | 7.29:1 |
| Oscuro | Night sobre Amber | 11.38:1 |

El coral **no** se usa como texto sobre paper (2.60:1). Si necesitas énfasis, usa índigo o un estado destructivo.

## 2. Foco

- Anillo de **2 px** con *offset* de 2 px.
- Color índigo `#4B2EA3` en claro y violeta `#A98BFF` en oscuro.
- Visible en todos los controles interactivos, incluidos enlaces, tabs, checkboxes y elementos de menú.
- No uses `outline: none` sin un sustituto visible.
- El foco no depende solo del color: añade un cambio de borde o de fondo cuando el contraste lo permita.

## 3. Tamaño táctil

- Objetivo mínimo: **44 × 44 px**.
- En móvil, separa controles al menos **8 px**.
- Los iconos de 16 px necesitan un área táctil mayor; usa padding o un contenedor de 44 px.
- No uses *hover* como única forma de revelar acciones importantes.

## 4. Movimiento

- Respeta `prefers-reduced-motion: reduce`.
- Evita animaciones automáticas, parallax y bucles.
- No muevas más de un elemento a la vez en una acción.
- Las transiciones no deben superar 400 ms.
- No uses *flashing* ni cambios de contraste rápidos.

## 5. Color y significado

- No uses solo rojo/verde para error/éxito: añade icono y texto.
- No uses solo el degradado para distinguir la marca; el ratón debe leerse en un solo color.
- Comprueba las capturas en **escala de grises** antes de cerrar un icono.
- En gráficos, usa la serie `chart-1…5` y etiquetas directas; no dependas de la leyenda de color.

## 6. Modo oscuro

- El texto principal es blanco puro; el secundario `#C9B6E6`.
- Las superficies elevadas usan `#291054` y `#3B2A6E`; no uses negro puro como superficie.
- Los bordes deben seguir siendo visibles (`#3B2A6E`).
- Revisa el modo oscuro con el mismo nivel de detalle que el claro.

## 7. Iconos y texto alternativo

- Los iconos decorativos llevan `aria-hidden="true"`.
- Los iconos que comunican una acción sin texto llevan `aria-label` o un `<span class="sr-only">`.
- El logo lleva `role="img"` y `aria-label="infinipaper"`.
- Los iconos de app no necesitan alt en la app; el nombre de la app es el texto.
- En la web, el favicon y el manifiesto no sustituyen al `<title>` de la página.

## 8. Formularios y errores

- Cada campo tiene `<label>` visible o asociado.
- El error se anuncia con texto y, si es posible, `aria-live="polite"`.
- El foco se mueve al primer campo con error.
- No uses el color del borde como único indicador; añade mensaje.
- Los placeholders no sustituyen a las etiquetas.

## 9. Checklist de revisión

- [ ] Todos los pares texto/fondo cumplen AA.
- [ ] El foco es visible en teclado.
- [ ] Los controles miden al menos 44 px.
- [ ] La información no depende solo del color.
- [ ] `prefers-reduced-motion` está cubierto.
- [ ] El modo oscuro se revisó por separado.
- [ ] Los iconos decorativos están ocultos a lectores de pantalla.
- [ ] Las imágenes tienen alt útil (o vacío si son decorativas).
- [ ] El zoom al 200 % no rompe la interfaz.
