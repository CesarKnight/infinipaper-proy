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

- [x] `T-020` Implementar visores de imagen, PDF y ofimáticos modernos. <RF-04–RF-06d>
- [x] `T-021` Implementar reproductores de audio y video con más formatos. <RF-07, RF-08, RF-13>
- [x] `T-022` Integrar el render Markdown sanitizado. <RF-09>
- [x] `T-023` Implementar botones de volver y descargar. <RF-10>
- [x] `T-024` Implementar estados de carga y error. <RNF-02>
- [x] `T-025` Integrar acciones de transcripción en audio. <RF-07>
- [x] `T-026` Implementar marco visual, zoom/paneo y carga diferida. <RF-12, RF-14–RF-16>
- [x] `T-027` Ampliar extensiones ofimáticas y de video en backend. <RF-06d, RF-13>

## Fase 3 · Verificación

- [x] `T-030` Verificar imagen, PDF, audio y video. <CA-01, CA-02, CA-04, CA-05>
- [x] `T-031` Verificar previews ofimáticas y descarga de legacy/sin visor. <CA-03, CA-08, CA-13>
- [x] `T-032` Verificar DOCX, XLSX y PPTX reales en navegador. <CA-03>
- [x] `T-032` Verificar navegación de vuelta. <CA-07>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Colaboración en tiempo real. <G-01>
- [ ] `T-051` Render de `.doc/.xls/.ppt` legacy. <G-02>
- [ ] `T-052` Añadir tests de selección de visor, carga diferida y `Range`. <G-03>

## Verificación final

- [x] Criterios funcionales cubiertos por revisión y flujo manual.
- [x] Sin migraciones pendientes.
- [ ] Colaboración en tiempo real (G-01).
- [ ] Formatos legacy (G-02).
- [ ] Cobertura automatizada de visores (G-03).
