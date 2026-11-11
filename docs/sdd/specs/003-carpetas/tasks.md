# Tasks 003 · Carpetas

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir raíz real, jerarquía y reglas de borrado. <RF-01, RF-02>

## Fase 1 · Datos

- [x] `T-010` Crear `Folder` con `projectId`, `parentId`, `name` e `isRoot`. <RF-01, RF-02>
- [x] `T-011` Crear la raíz junto con el proyecto. <RF-01, CA-01>
- [x] `T-012` Configurar `@@unique([projectId, parentId, name])`. <RF-03>
- [x] `T-013` Configurar cascada de subcarpetas y recursos. <RF-05>

## Fase 2 · Backend

- [x] `T-014` Implementar creación y renombrado con permisos Editor+. <RF-03, RF-04, CA-02, CA-05>
- [x] `T-015` Implementar eliminación de subárbol y limpieza S3. <RF-05, CA-09>
- [x] `T-016` Implementar movimiento con validación de ciclos y raíz inmutable. <RF-01, RF-06, CA-06, CA-07>
- [x] `T-017` Implementar listado/árbol y detalle de carpeta. <RF-07, RF-08, RF-09>
- [x] `T-018` Implementar errores de nombre y permisos. <CA-03, CA-04, CA-08>

## Fase 3 · Frontend

- [x] `T-030` Construir el árbol de carpetas con raíz. <RF-01, RF-09>
- [x] `T-031` Implementar orden por nombre y fecha. <RF-07, CA-10>
- [x] `T-032` Implementar crear, renombrar y mover desde el workspace. <RF-02, RF-04>
- [x] `T-033` Implementar confirmación de borrado en cascada. <RF-05>
- [x] `T-034` Mostrar breadcrumbs y carpeta seleccionada. <RF-09>

## Fase 4 · Verificación

- [x] `T-040` Verificar creación de subcarpetas y navegación. <CA-01, CA-02>
- [x] `T-041` Verificar permisos de Viewer. <CA-08>
- [x] `T-042` Verificar rechazo de ciclos y raíz inmutable. <CA-07>
- [x] `T-043` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-044` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Añadir tests automatizados de ciclos, unicidad y cascada. <G-01>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Cobertura automatizada de carpetas (G-01).
