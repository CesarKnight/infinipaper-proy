# Tasks 007 · Participantes

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir Owner fuera de `ProjectMember` y rol inicial Viewer. <RF-01, RF-03>
- [x] `T-002` Definir alta directa sin invitación. <RF-08>

## Fase 1 · Datos

- [x] `T-010` Crear `ProjectMember` con `@@unique([projectId, userId])`. <RF-04>
- [x] `T-011` Configurar cascada al eliminar proyecto o usuario. <RF-05>

## Fase 2 · Backend

- [x] `T-012` Implementar listado de participantes. <RF-07>
- [x] `T-013` Implementar alta con rol Viewer por defecto. <RF-02, RF-03, CA-02>
- [x] `T-014` Implementar rechazo de duplicados. <RF-04, CA-03>
- [x] `T-015` Implementar retirada y revocación. <RF-05, CA-06>
- [x] `T-016` Implementar protección del Owner. <RF-06, CA-07>
- [x] `T-017` Implementar cambio de rol (con spec 008). <RF-09>

## Fase 3 · Frontend

- [x] `T-020` Crear panel de participantes junto al workspace. <RF-07, CA-08>
- [x] `T-021` Crear gestor con búsqueda, alta, rol y retirada. <RF-02, RF-03, RF-09>
- [x] `T-022` Implementar confirmación de retirada y errores. <RF-05>
- [x] `T-023` Invalidar consultas tras cambios. <RNF-04>

## Fase 4 · Verificación

- [x] `T-030` Verificar alta y listado. <CA-01, CA-02, CA-08>
- [x] `T-031` Verificar duplicados y usuario inexistente. <CA-03, CA-04>
- [x] `T-032` Verificar restricción a Owner. <CA-05>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Añadir tests de alta, duplicado y retirada. <G-01>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Cobertura automatizada de participantes (G-01).
