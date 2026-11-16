# Android

Contenido:

- `src/`: SVG canónicos (fondo, frente, monocromo, legacy, round y guía).
- `res/`: recursos listos para copiar a `app/src/main/res/` de un proyecto Android.
  - `mipmap-*/`: iconos legacy cuadrados y redondos (48–192 px).
  - `drawable-*/`: capas adaptive (108–432 px) para fondo, frente y monocromo.
  - `mipmap-anydpi-v26/`: adaptive icon sin monocromo.
  - `mipmap-anydpi-v33/`: adaptive icon con `<monochrome>` para Android 13+.
- `play-store-icon-512.png`: ficha de Play Store.
- `guia-zona-segura-512.png`: referencia visual (no usar en producción).

Integración:

1. Copia `res/` sobre `app/src/main/res/`.
2. Verifica que `AndroidManifest.xml` use `@mipmap/ic_launcher` y `@mipmap/ic_launcher_round`.
3. Prueba en un emulador con máscara circular, *squircle* y cuadrada.
4. Para *themed icons*, confirma que `mipmap-anydpi-v33` se resuelve en Android 13+.

El arte debe quedar dentro del círculo de 66 dp. No edites los PNG: regenera con `../scripts/generar-assets.py`.
