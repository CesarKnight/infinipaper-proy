# 02 · Color

Los valores de esta tabla salen del brand board v2. Las filas marcadas como **derivado** cubren estados que el board no define (error, éxito, advertencia, sombras) y deben validarse antes de usarse en producto.

## 1. Papel e tinta (modo claro)

| Token | Hex | Rol | Uso |
|---|---|---|---|
| `paper` | `#FAF6EE` | Fondo de página | Lienzo principal en claro. |
| `paper-raised` | `#FFFFFF` | Superficie elevada | Tarjetas, diálogos y campos. |
| `paper-sunken` | `#F3ECDD` | Fondo atenuado | Zonas secundarias, *skeleton*, hover suave. |
| `ink` | `#1B1633` | Texto principal | Títulos, cuerpo y bordes fuertes. |
| `muted` | `#5B5575` | Texto secundario | Metadatos, ayudas y placeholders. |
| `border` | `#E6DECF` | Bordes | Separadores, tarjetas y campos. |
| `indigo` | `#4B2EA3` | Acción principal | Botones, enlaces, foco y selección. |
| `indigo-soft` | `#E9E2FA` | Superficie de marca | Badges, fondos de selección y chips. |
| `coral` | `#FF6B57` | Acento | Rellenos, badges y destacados. **Nunca texto de cuerpo.** |

## 2. Noche y estudio (modo oscuro)

| Token | Hex | Rol | Uso |
|---|---|---|---|
| `night` | `#0C052C` | Fondo de página | Lienzo principal en oscuro. |
| `surface` | `#291054` | Superficie elevada | Tarjetas, diálogos y menús. |
| `surface-2` | `#3B2A6E` | Superficie secundaria | Badges, bordes y hover. |
| `white` | `#FFFFFF` | Texto principal | Títulos y cuerpo. |
| `secondary-text` | `#C9B6E6` | Texto secundario | Metadatos y ayudas. |
| `violet` | `#A98BFF` | Acción principal | Botones, enlaces, foco y selección. |
| `amber` | `#FFB84D` | Acento | Chips, highlights y pequeños estados. |
| `border` | `#3B2A6E` | Bordes | Separadores y campos. |

## 3. Tokens semánticos

### Paper & Ink

| Token | Valor | Sobre | Contraste | AA |
|---|---|---|---|---:|
| `background` | `#FAF6EE` | — | — | — |
| `foreground` | `#1B1633` | `background` | **16.11:1** | Sí |
| `card` | `#FFFFFF` | `background` | 1.08:1 | No aplica (superficie) |
| `card-foreground` | `#1B1633` | `card` | **17.37:1** | Sí |
| `primary` | `#4B2EA3` | `background` | **8.78:1** | Sí |
| `primary-foreground` | `#FFFFFF` | `primary` | **9.46:1** | Sí |
| `secondary` | `#E9E2FA` | `background` | 1.17:1 | No aplica (superficie) |
| `secondary-foreground` | `#4B2EA3` | `secondary` | **7.54:1** | Sí |
| `muted` | `#F3ECDD` | `background` | 1.09:1 | No aplica (superficie) |
| `muted-foreground` | `#5B5575` | `muted` | **5.95:1** | Sí |
| `muted-foreground` | `#5B5575` | `background` | **6.49:1** | Sí |
| `accent` | `#FF6B57` | `background` | 2.60:1 | Solo relleno |
| `accent-foreground` | `#1B1633` | `accent` | **6.20:1** | Sí |
| `destructive` | `#B3261E` | `background` | 6.06:1 | Sí (texto) |
| `destructive-foreground` | `#FFFFFF` | `destructive` | **6.54:1** | Sí |
| `success` | `#1F7A4D` | `background` | 4.93:1 | Sí |
| `success-foreground` | `#FFFFFF` | `success` | **5.32:1** | Sí |
| `warning` | `#B45309` | `background` | 4.66:1 | Sí |
| `warning-foreground` | `#FFFFFF` | `warning` | **5.02:1** | Sí |
| `ring` | `#4B2EA3` | `background` | **8.78:1** | Sí |

> `accent` coral no se usa como color de texto sobre paper: su contraste es 2.80:1. Para texto destacado usa `primary` o `destructive`. El coral sí se usa como fondo con tinta (`accent-foreground`), badge o botón de énfasis.

### Midnight Study

| Token | Valor | Sobre | Contraste | AA |
|---|---|---|---|---:|
| `background` | `#0C052C` | — | — | — |
| `foreground` | `#FFFFFF` | `background` | **19.56:1** | Sí |
| `card` | `#291054` | `background` | 1.21:1 | No aplica (superficie) |
| `card-foreground` | `#FFFFFF` | `card` | **16.20:1** | Sí |
| `primary` | `#A98BFF` | `background` | **7.29:1** | Sí |
| `primary-foreground` | `#0C052C` | `primary` | **7.29:1** | Sí |
| `secondary` | `#3B2A6E` | `background` | 1.62:1 | No aplica (superficie) |
| `secondary-foreground` | `#FFFFFF` | `secondary` | **12.05:1** | Sí |
| `muted` | `#1E0B46` | `background` | 1.11:1 | No aplica (superficie) |
| `muted-foreground` | `#C9B6E6` | `muted` | **9.50:1** | Sí |
| `muted-foreground` | `#C9B6E6` | `background` | **10.54:1** | Sí |
| `accent` | `#FFB84D` | `background` | 11.38:1 | Sí |
| `accent-foreground` | `#0C052C` | `accent` | **11.38:1** | Sí |
| `destructive` | `#FF8A80` | `background` | 8.57:1 | Sí |
| `destructive-foreground` | `#0C052C` | `destructive` | **8.57:1** | Sí |
| `success` | `#6EE7B7` | `background` | 12.83:1 | Sí |
| `success-foreground` | `#0C052C` | `success` | **12.83:1** | Sí |
| `warning` | `#FFB84D` | `background` | 11.38:1 | Sí |
| `warning-foreground` | `#0C052C` | `warning` | **11.38:1** | Sí |
| `ring` | `#A98BFF` | `background` | **7.29:1** | Sí |

## 4. Degradados

| Token | Valor | Uso |
|---|---|---|
| `brand-fade` | `linear-gradient(135deg, #4B2EA3 0%, #A1349F 55%, #F0504F 100%)` | Ratón, línea de marca, detalles. |
| `icon-light` | `linear-gradient(180deg, #FDFAF3 0%, #F3ECDD 100%)` | Fondo de iconos en claro. |
| `icon-dark` | `linear-gradient(180deg, #4A3470 0%, #291054 14%, #1E0B46 55%, #0F0630 100%)` | Fondo de iconos en oscuro. |

El degradado del ratón va de `#4B2EA3` en la cola a `#F0504F` en la oreja. No se invierte ni se sustituye por colores de estado.

## 5. Reglas de uso

- **Coral** es relleno y badge. No se usa para párrafos, enlaces ni texto sobre paper.
- **Índigo** es la acción principal en claro; **violeta** en oscuro. No mezcles ambos en el mismo modo.
- **Ámbar** es un acento pequeño en oscuro (chips, indicadores). No es el color principal.
- En oscuro, el texto principal es **blanco puro**; el secundario es `#C9B6E6`. No uses grises azulados fríos.
- Los bordes en claro son `#E6DECF`; en oscuro, `#3B2A6E`. No uses el texto como borde.
- Los estados de error/éxito/advertencia son **derivados** y están pendientes de validación en producto (`G-03`).
- Para gráficos, usa la serie `chart-1…5`; no inventes una paleta categórica nueva.

## 6. Contraste y accesibilidad

Todos los pares texto/fondo de la tabla cumplen **WCAG AA** (≥ 4.5:1 para texto normal). Los textos grandes (≥ 24 px o ≥ 19 px en negrita) pueden usar ≥ 3:1, pero el sistema no baja de 4.5:1 salvo en elementos decorativos.

El script [`verificar-assets.py`](../scripts/verificar-assets.py) recalcula los contrastes y falla si algún par baja de 4.5:1.
