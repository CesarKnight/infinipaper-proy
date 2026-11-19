# Tasks 029 · Visor interactivo y exportable de mapas mentales

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea tiene ID `T-NNN` y cita los requisitos o criterios que satisface.
- No se marca una tarea como hecha solo porque el código existe: debe estar verificada.

## Fase 0 · Preparación

- [x] `T-001` Confirmar alcance y librerías. <RF-01–RF-17>
- [x] `T-002` Instalar `@xyflow/react`, `@dagrejs/dagre` y `html-to-image`. <RNF-07>

## Fase 1 · Layout y datos

- [x] `T-010` Implementar layout dagre determinista y fallback. <RF-02, RF-15, RNF-03>
- [x] `T-011` Filtrar aristas huérfanas y manejar múltiples raíces/ciclos. <RF-06, RF-15>
- [x] `T-012` Implementar persistencia local de posiciones por recurso. <RF-13, CA-08>

## Fase 2 · Canvas

- [x] `T-020` Reemplazar el SVG por React Flow con pan/zoom. <RF-01, CA-01>
- [x] `T-021` Añadir controles de zoom, minimapa y ajustar vista. <RF-02, RF-05, CA-02>
- [x] `T-022` Crear nodo personalizado con handles, label y descripción. <RF-06, RF-08, RF-09>
- [x] `T-023` Configurar aristas con flechas, etiquetas y z-index bajo nodos. <RF-06, RF-07, CA-05>
- [x] `T-024` Implementar arrastre de nodos y “Reorganizar”. <RF-03, RF-04, CA-03, CA-04>

## Fase 3 · Exportación y estados

- [x] `T-030` Implementar toolbar con ajustar, reorganizar y exportar. <RF-02, RF-04, RF-10>
- [x] `T-031` Exportar el diagrama completo a PNG de alta resolución. <RF-10, RF-11, CA-06>
- [x] `T-032` Aplicar tema claro/oscuro a nodos, aristas, minimapa y exportación. <RF-12, CA-07>
- [x] `T-033` Implementar estados de carga, vacío y error. <RF-14>
- [x] `T-034` Mantener título y contadores del mapa. <RF-16>
- [x] `T-035` Verificar compatibilidad con mapas existentes. <RF-17, CA-10>

## Fase 4 · Verificación

- [x] `T-040` Verificar layout con 100 nodos y nodos desconectados. <RF-15, CA-09>
- [x] `T-041` Probar exportación con nodos fuera del viewport y ambos temas. <RF-11, RF-12, CA-06, CA-07>
- [x] `T-042` Verificar pan, zoom, arrastre, recarga y reorganización. <CA-01–CA-04, CA-08>
- [x] `T-043` `npm run lint` y `npm run build` del frontend. <RNF-01–RNF-07>

## Fase 5 · Documentación y cierre

- [x] `T-050` Actualizar spec con evidencia y estado. <RNF-01–RNF-07>
- [x] `T-051` Actualizar índice, librerías y docs afectadas. <RNF-07>
- [x] `T-052` Registrar brechas `G-*`. <G-01–G-03>

## Fase 6 · Brechas diferidas

- [ ] `T-090` Exportación SVG/PDF. <G-01>
- [ ] `T-091` Edición de etiquetas/relaciones. <G-02>
- [ ] `T-092` Persistencia de layout en servidor. <G-03>

## Verificación final

- [x] Todos los `CA-*` tienen evidencia.
- [x] No quedan tareas obligatorias pendientes.
- [x] La spec está en el estado correcto.
- [x] El plan de rollback está documentado.
