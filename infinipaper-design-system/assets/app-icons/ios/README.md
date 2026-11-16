# iOS

Contenido:

- `src/`: SVG canónicos de los iconos y de las capas.
- `AppIcon-1024.png`: copia del icono claro para herramientas que esperan un único archivo.
- `AppIcon-1024-light.png`: icono claro, 1024 × 1024, opaco.
- `AppIcon-1024-dark.png`: icono oscuro, 1024 × 1024, opaco.
- `AppIcon-1024-tinted.png`: icono tintado en grises, 1024 × 1024, opaco.
- `layers/background-*-1024.png`: fondos para Icon Composer.
- `layers/mark-*-1024.png`: arte transparente para Icon Composer.

Integración:

1. En Xcode, usa `AppIcon-1024-light.png` como icono principal.
2. Para iOS 18/26, añade las variantes `dark` y `tinted` en el asset catalog o construye el icono con Icon Composer usando `layers/`.
3. No redondees las esquinas: el sistema aplica la máscara.
4. Revisa el icono en escala de grises; si el ratón se lee, se leerá en todos los modos.

Los PNG se regeneran con `../scripts/generar-assets.py`; no los edites a mano.
