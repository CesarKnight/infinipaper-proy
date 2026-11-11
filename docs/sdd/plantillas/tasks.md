# Tasks · <título corto del cambio>

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Borrador` \| `En ejecución` \| `Completado` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea tiene ID `T-NNN` y cita los requisitos o criterios que satisface.
- No se marca una tarea como hecha solo porque el código existe: debe estar verificado.
- Las tareas de brechas (`G-*`) se añaden al final y no bloquean el cierre si se aceptan explícitamente.

## Fase 0 · Preparación

- [ ] `T-001` Leer spec, plan y constitución. <RF/CA>
- [ ] `T-002` Confirmar alcance y resolver preguntas abiertas. <RF/CA>

## Fase 1 · Datos

- [ ] `T-010` <Modelo, campo o migración>. <RF/CA>
- [ ] `T-011` <Rollback o verificación de migración>. <RNF/CA>

## Fase 2 · Backend

- [ ] `T-020` <DTO / validación>. <RF/CA>
- [ ] `T-021` <Servicio / lógica de negocio>. <RF/CA>
- [ ] `T-022` <Controlador / contrato>. <RF/CA>
- [ ] `T-023` <Guard / permisos>. <RF/CA>
- [ ] `T-024` <Errores y códigos>. <RF/CA>

## Fase 3 · Frontend

- [ ] `T-030` <Componente / ruta>. <RF/CA>
- [ ] `T-031` <Hook / estado / cliente API>. <RF/CA>
- [ ] `T-032` <Estados de carga, vacío y error>. <RNF/CA>
- [ ] `T-033` <Accesibilidad y tema>. <RNF/CA>

## Fase 4 · Pruebas y verificación

- [ ] `T-040` Tests unitarios. <CA>
- [ ] `T-041` Tests e2e o verificación manual registrada. <CA>
- [ ] `T-042` Casos de permisos y errores. <CA>
- [ ] `T-043` Backend: `npm run lint && npm test && npm run build`. <RNF>
- [ ] `T-044` Frontend: `npm run lint && npm run build`. <RNF>

## Fase 5 · Documentación y cierre

- [ ] `T-050` Actualizar `spec.md` con evidencia y estado. <RNF>
- [ ] `T-051` Actualizar `docs/README.md` y docs afectadas. <RNF>
- [ ] `T-052` Registrar brechas `G-*` o confirmar que no hay. <RNF>

## Verificación final

- [ ] Todos los `CA-*` tienen evidencia.
- [ ] No quedan tareas obligatorias pendientes.
- [ ] La spec está en el estado correcto.
- [ ] El plan de rollback está documentado.
