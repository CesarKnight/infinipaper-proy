# Tasks · Tema de marca en el frontend

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea cita los requisitos o criterios que satisface.

## Fase 0 · Preparación

- [x] `T-001` Confirmar la adopción de la paleta y de Inter. `<RF-01>`
- [x] `T-002` Revisar `globals.css`, `layout.tsx` y las convenciones de metadata de Next 16. `<RNF-02>`

## Fase 1 · Tokens y tipografía

- [x] `T-010` Sustituir los tokens de color claro/oscuro en `app/globals.css`. `<RF-01>, <RF-02>, <RF-05>`
- [x] `T-011` Actualizar sombras, radios, charts y sidebar. `<RF-05>`
- [x] `T-012` Cargar Inter y Fraunces, corregir `--font-*` y actualizar `layout.tsx`. `<RF-03>, <RF-04>`
- [x] `T-013` Actualizar los estilos de MDXEditor a las fuentes y tokens nuevos. `<RF-06>`

## Fase 2 · Metadatos y assets

- [x] `T-020` Copiar favicon, icon SVG, Apple Touch y Open Graph a `app/`. `<RF-07>, <RF-09>`
- [x] `T-021` Copiar iconos PWA a `public/icons/`. `<RF-11>`
- [x] `T-022` Crear `app/manifest.ts` y `viewport.themeColor`. `<RF-08>, <RF-10>`
- [x] `T-023` Sustituir el bloque "I" del header por la marca del sistema. `<RF-14>`

## Fase 3 · Verificación

- [x] `T-030` Ejecutar `infinipaper-design-system/scripts/verificar-assets.py`. `<CA-07>`
- [x] `T-031` Ejecutar `npm run lint` en el frontend. `<CA-08>`
- [x] `T-032` Ejecutar `npm run build` en el frontend. `<CA-08>`
- [x] `T-033` Revisar claro/oscuro, títulos, favicon, manifest, OG y header en navegador. `<CA-01>–<CA-06>, <CA-10>`
- [x] `T-034` Confirmar que no hay cambios en backend, agents ni dependencias. `<RF-12>, <RNF-03>`

## Fase 4 · Cierre

- [x] `T-040` Registrar evidencia y estado en `spec.md`. `<CA-01>–<CA-08>`
- [ ] `T-041` Validar los estados derivados con producto. `<G-02>`
- [x] `T-042` Actualizar el índice de specs. `<RNF-03>`

## Verificación final

- [x] Todos los `CA-*` tienen evidencia.
- [x] `lint` y `build` pasan.
- [x] La spec está en el estado correcto.
