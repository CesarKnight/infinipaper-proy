# Tasks 008 · Permisos y roles de proyecto

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir jerarquía Owner > Editor > Viewer > público. <RF-09>
- [x] `T-002` Definir permisos a nivel de proyecto. <RF-03>

## Fase 1 · Datos

- [x] `T-010` Usar `Project.ownerId` para Owner y `ProjectMember.role` para el resto. <RF-02, RF-03>
- [x] `T-011` Añadir índices por propietario, miembro y visibilidad. <RNF-04>

## Fase 2 · Backend

- [x] `T-012` Implementar `PermissionsService.resolveRole`. <RF-09, RNF-01>
- [x] `T-013` Implementar `ProjectAccessGuard` para `:projectId`, `:folderId` y `:fileId`. <RF-04, RNF-02>
- [x] `T-014` Aplicar `@RequireProjectRole` en todos los endpoints restringidos. <RF-04, RF-07>
- [x] `T-015` Garantizar que el cambio de rol aplique en la siguiente petición. <RF-05, CA-08>
- [x] `T-016` Proteger al Owner de autodegradación. <RF-06>
- [x] `T-017` Permitir lectura anónima solo en proyectos públicos. <RF-08, CA-07>

## Fase 3 · Frontend

- [x] `T-020` Exponer `canEdit` según el rol. <RF-07>
- [x] `T-021` Implementar selector de rol en configuración. <RF-01>
- [x] `T-022` Ocultar acciones no permitidas. <RF-07, RNF-04>

## Fase 4 · Verificación

- [x] `T-030` Verificar Owner, Editor, Viewer y anónimo. <CA-01, CA-03, CA-04, CA-07>
- [x] `T-031` Verificar restricción de gestión al Owner. <CA-05>
- [x] `T-032` Verificar proyecto privado sin acceso. <CA-06>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Añadir tests de la matriz de permisos. <G-01>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Cobertura automatizada de permisos (G-01).
