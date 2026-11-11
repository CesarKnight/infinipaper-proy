# Tasks 006 · Visualización multimedia

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir la matriz de visores por `kind`. <RF-01>
- [x] `T-002` Definir vista dedicada y navegación de vuelta. <RF-02, RF-10>

## Fase 1 · Backend

- [x] `T-010` Implementar metadatos de recurso para elegir visor. <RF-01>
- [x] `T-011` Implementar contenido con `Accept-Ranges` y `Content-Range`. <RF-03, RNF-01>
- [x] `T-012` Aplicar permisos de lectura. <RF-11, CA-09>

## Fase 2 · Frontend

- [x] `T-020` Implementar visores de imagen, PDF y descarga ofimática. <RF-04, RF-05, RF-06>
- [x] `T-021` Implementar reproductores de audio y video. <RF-07, RF-08>
- [x] `T-022` Integrar el render Markdown sanitizado. <RF-09>
- [x] `T-023` Implementar botones de volver y descargar. <RF-10>
- [x] `T-024` Implementar estados de carga y error. <RNF-02>
- [x] `T-025` Integrar acciones de transcripción en audio. <RF-07>

## Fase 3 · Verificación

- [x] `T-030` Verificar imagen, PDF, audio y video. <CA-01, CA-02, CA-04, CA-05>
- [x] `T-031` Verificar descarga de ofimáticos y formatos sin visor. <CA-03, CA-08>
- [x] `T-032` Verificar navegación de vuelta. <CA-07>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Evaluar zoom y paneo de imágenes. <G-01>
- [ ] `T-051` Añadir tests de selección de visor y `Range`. <G-02>

## Verificación final

- [x] Criterios funcionales cubiertos por revisión y flujo manual.
- [x] Sin migraciones pendientes.
- [ ] Zoom de imágenes (G-01).
- [ ] Cobertura automatizada de visores (G-02).
