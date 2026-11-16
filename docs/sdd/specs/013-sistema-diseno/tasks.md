# Tasks · Sistema de diseño

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea tiene ID `T-NNN` y cita los requisitos o criterios que satisface.
- No se marca una tarea como hecha solo porque el archivo existe: debe estar verificado.
- Las tareas de brechas (`G-*`) se añaden al final y no bloquean el cierre si se aceptan explícitamente.

## Fase 0 · Preparación

- [x] `T-001` Confirmar alcance, nombre de carpeta y decisiones `D-01`–`D-10`. `<RF-01>`
- [x] `T-002` Crear el árbol base de `infinipaper-design-system/` y su README. `<RF-01>`
- [x] `T-003` Extraer y limpiar los SVG del ratón y `mini` desde los mockups. `<RF-06>`

## Fase 1 · Tokens y documentación

- [x] `T-010` Definir tokens primitivos y semánticos de color para claro/oscuro. `<RF-02>`
- [x] `T-011` Calcular contrastes WCAG de todos los pares texto/fondo. `<RF-03>`
- [x] `T-012` Redactar `docs/02-color.md` con tabla, roles y reglas de uso. `<RF-03>, <CA-02>`
- [x] `T-013` Redactar `docs/03-tipografia.md` con familias, pesos, escala y *fallbacks*. `<RF-04>`
- [x] `T-014` Redactar `docs/04-espaciado-radios-sombras.md` con valores del board y derivados marcados. `<RF-05>`
- [x] `T-015` Crear `design-tokens.json`, `tokens.css`, `tailwind.css` y `tokens.ts`. `<RF-15>, <CA-08>`
- [x] `T-016` Redactar `docs/01-marca.md` con narrativa, lockups, espacio de respeto y usos incorrectos. `<RF-19>`
- [x] `T-017` Redactar `docs/06-accesibilidad.md`. `<RNF-01>`

## Fase 2 · Assets vectoriales

- [x] `T-020` Crear SVG de marca: ratón completo, `mini`, wordmark y lockups horizontal/vertical claro/oscuro. `<RF-06>`
- [x] `T-021` Crear capas *adaptive* Android: fondo, frente, monocromo y guía de zona segura. `<RF-07>`
- [x] `T-022` Crear SVG base de icono iOS claro, oscuro y tintado, más capas para Icon Composer. `<RF-10>, <RF-11>`
- [x] `T-023` Crear SVG de favicon, PWA, *maskable*, Apple Touch y Open Graph. `<RF-12>, <RF-13>`
- [x] `T-024` Crear SVG de notificaciones: barra de estado 24 dp, push 192 y *badge*. `<RF-14>`

## Fase 3 · Exportación de assets

- [x] `T-030` Generar *mipmaps* Android mdpi–xxxhdpi cuadrados y redondos. `<RF-08>, <CA-04>`
- [x] `T-031` Generar Play Store 512 y previsualizaciones de máscara. `<RF-09>, <CA-04>`
- [x] `T-032` Generar iOS 1024 claro/oscuro/tintado y capas. `<RF-10>, <RF-11>, <CA-05>`
- [x] `T-033` Generar favicon SVG/ICO/16/32, Apple Touch 180, PWA 192/512, *maskable* 512 y Open Graph. `<RF-12>, <RF-13>, <CA-06>`
- [x] `T-034` Generar notificaciones 24 dp, push 192 y *badge*. `<RF-14>, <CA-07>`
- [x] `T-035` Crear `site.webmanifest`. `<RF-12>`

## Fase 4 · Herramientas y previsualización

- [x] `T-040` Crear `examples/preview.html` con swatches, tipografía, logos e iconos. `<RF-16>, <CA-09>`
- [x] `T-041` Crear `scripts/generar-assets.sh` reproducible con comprobación de herramientas. `<RF-17>`
- [x] `T-042` Crear `scripts/verificar-assets.py` para dimensiones, formato, transparencia, contraste y referencias externas. `<RF-17>, <CA-10>`
- [x] `T-043` Crear `docs/07-assets.md` con manifiesto de rutas, tamaños y usos. `<RF-18>`
- [x] `T-044` Ejecutar la verificación completa y corregir fallos. `<CA-10>`

## Fase 5 · Documentación y cierre

- [x] `T-050` Documentar la brecha entre el tema actual del frontend y la marca v2. `<RF-19>, <G-01>`
- [x] `T-051` Actualizar `README.md` del sistema con índice y guía de consumo. `<CA-01>`
- [x] `T-052` Añadir `013` a `docs/sdd/specs/README.md` y enlazar desde `docs/README.md` si aplica. `<CA-01>`
- [x] `T-053` Registrar evidencia de cada `CA-*` en la spec. `<CA-01>–<CA-12>`
- [x] `T-054` Revisar que no hay cambios en `infinipaper-frontend/`, `infinipaper-backend/` ni `infinipaper-agents/`. `<CA-12>`
- [x] `T-055` Abrir spec de adopción del tema en el frontend o aceptar la brecha. `<G-01>`
- [ ] `T-056` Validar los iconos en un proyecto Android/iOS real cuando exista. `<G-02>`
- [ ] `T-057` Decidir colores de error/éxito/advertencia. `<G-03>`
- [ ] `T-058` Validar la escala de movimiento y sombras derivadas. `<G-04>`

## Verificación final

- [x] Todos los `CA-*` tienen evidencia.
- [x] No quedan tareas obligatorias pendientes.
- [x] La spec está en el estado correcto.
- [x] El plan de rollback está documentado.
