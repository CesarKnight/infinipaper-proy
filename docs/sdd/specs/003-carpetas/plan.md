# Plan 003 · Carpetas

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

El módulo `folders` gestiona la jerarquía dentro de un proyecto. La raíz se crea con el proyecto y se marca `isRoot`; el resto de carpetas cuelgan de `parentId`. La creación y el renombrado validan nombre y duplicados; el movimiento valida que el destino no sea un descendiente. El borrado recopila los recursos del subárbol para limpiar S3 y elimina la carpeta en cascada.

## 2. Contexto técnico actual

- `folders.controller.ts` y `folders.service.ts`.
- `Folder` con auto-relación `parent/children`.
- `ProjectAccessGuard` con roles viewer/editor.
- `StorageService` para objetos de recursos.
- `folder-tree.tsx` y workspace en frontend.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Raíz como `Folder` real | Raíz virtual calculada | Simplifica relaciones y permisos |
| D-02 | Validar ciclos en servicio | Confiar solo en la base | Prisma no impone ausencia de ciclos |
| D-03 | Borrado en cascada con limpieza S3 | Borrado lógico | El alcance v1 no requiere papelera |
| D-04 | Orden en backend y cliente | Solo cliente | Coherencia entre vistas |

## 4. Cambios por capa

### Datos

- `Folder` con `projectId`, `parentId`, `name`, `isRoot`.
- Índices y unicidad por padre.
- Sin migraciones pendientes.

### Backend

- CRUD de carpetas.
- Validación de raíz inmutable, duplicados y ciclos.
- Borrado en cascada y limpieza S3.
- Endpoint de árbol y detalle.

### Frontend

- Árbol de carpetas con raíz.
- Breadcrumbs y selección.
- Crear, renombrar, mover y eliminar.
- Confirmación destructiva.

### Infraestructura

- Sin cambios.

## 5. Contratos

```http
POST /api/v1/projects/:projectId/folders
{ "name": "Unidad 1", "parentId": "..." }
```

```http
PATCH /api/v1/folders/:folderId/move
{ "parentId": "..." }
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Crear, renombrar, mover y eliminar | Playwright |
| Unitario | Ciclos, duplicados y raíz inmutable | Vitest (pendiente) |
| Integración | Cascada y limpieza S3 | Vitest + MinIO (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Ciclo en el árbol | Alto | Validación de descendientes antes de mover |
| Nombres duplicados por mayúsculas | Medio | Comparación case-insensitive |
| Objetos S3 huérfanos | Medio | Recopilar claves antes de borrar |
| Eliminar la raíz | Alto | `FOLDER_ROOT_IMMUTABLE` |

## 8. Rollback

- Revertir código.
- Los datos existentes conservan su jerarquía.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/folders/*` | Controlador, servicio y DTOs |
| `infinipaper-backend/src/common/guards/project-access.guard.ts` | Rol por proyecto |
| `infinipaper-frontend/components/project/folder-tree.tsx` | Árbol |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/page.tsx` | Workspace |
| `infinipaper-frontend/components/project/workspace-context.tsx` | Carpeta seleccionada |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01 | `T-010`, `T-011` |
| RF-02, RF-03 | `T-012`, `T-013` |
| RF-04 | `T-014`, `T-030` |
| RF-05 | `T-015` |
| RF-06 | `T-016` |
| RF-07, RF-09 | `T-031` |
| RF-08 | `T-017` |
