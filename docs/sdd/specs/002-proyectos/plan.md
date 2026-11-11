# Plan 002 · Proyectos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

El módulo `projects` expone CRUD y listados con filtro `scope`. Al crear un proyecto se crea en la misma operación una carpeta raíz. La lectura usa `ProjectAccessGuard` para resolver el rol efectivo, incluyendo el acceso anónimo de solo lectura a proyectos públicos. La eliminación recopila las claves S3 de los recursos y las borra después de eliminar el proyecto en cascada.

## 2. Contexto técnico actual

- `projects.controller.ts` y `projects.service.ts`.
- `ProjectAccessGuard` y `PermissionsService`.
- Relaciones `Folder`, `Resource`, `ProjectMember` con `onDelete: Cascade`.
- `StorageService` para limpiar objetos.
- `ProjectCard` en frontend para dashboard y listados.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Crear la carpeta raíz en la misma transacción que el proyecto | Crearla de forma diferida | Evita proyectos sin raíz |
| D-02 | Owner en `Project.ownerId` | Fila Owner en `ProjectMember` | Una única fuente de verdad |
| D-03 | Filtro `scope` en el backend | Filtrar en cliente | Paginación y contadores correctos |
| D-04 | Limpiar S3 después del borrado en base | Borrar S3 primero | Evita dejar referencias rotas si falla la base |

## 4. Cambios por capa

### Datos

- `Project` con `ownerId`, `name`, `description`, `visibility`.
- `Folder` raíz con `isRoot`.
- Sin migraciones pendientes.

### Backend

- CRUD de proyectos.
- Listados `all`, `owned`, `participating`, `public`.
- Creación de carpeta raíz.
- Eliminación en cascada y limpieza S3.

### Frontend

- `/projects` con tabs de `scope`.
- `/projects/[projectId]` como workspace.
- `/projects/[projectId]/settings` con edición y borrado.
- `ProjectCard` reutilizable.

### Infraestructura

- Sin cambios.

## 5. Contratos

```http
POST /api/v1/projects
{ "name": "Álgebra lineal", "description": "...", "visibility": "PRIVATE" }
```

```http
GET /api/v1/projects?scope=owned&cursor=&limit=20

{
  "items": [ { "id": "...", "name": "...", "visibility": "PRIVATE", "owner": { ... } } ],
  "nextCursor": null
}
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Crear, editar, listar y eliminar proyecto | Playwright |
| Unitario | `scope` y permisos | Vitest (pendiente) |
| Integración | Cascada y limpieza S3 | Vitest + MinIO (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Proyecto sin carpeta raíz | Alto | Creación transaccional |
| Borrado deja objetos S3 | Medio | Recopilar claves antes del borrado y limpiar después |
| Filtro `scope` incorrecto | Medio | Tests de consultas y revisión de índices |
| Acceso anónimo indebido | Alto | `ProjectAccessGuard` y visibilidad |

## 8. Rollback

- Revertir código.
- Si se revierte la creación de la carpeta raíz, los proyectos existentes conservan su raíz.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/projects/*` | Controlador, servicio y DTOs |
| `infinipaper-backend/src/common/guards/project-access.guard.ts` | Resolución de rol |
| `infinipaper-backend/src/common/permissions/permissions.service.ts` | Rol efectivo |
| `infinipaper-frontend/app/projects/page.tsx` | Listado con `scope` |
| `infinipaper-frontend/app/projects/[projectId]/settings/page.tsx` | Edición y borrado |
| `infinipaper-frontend/components/project/project-card.tsx` | Tarjeta |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-010`, `T-011` |
| RF-03 | `T-012` |
| RF-04, RF-05 | `T-013`, `T-014` |
| RF-06, RF-07, RF-09 | `T-020`, `T-021` |
| RF-08 | `T-022` |
