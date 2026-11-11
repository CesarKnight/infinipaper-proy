# Plan 007 · Participantes

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

El módulo `members` expone listado, alta, cambio de rol y retirada. El Owner se resuelve desde `Project.ownerId`; los demás participantes son filas de `ProjectMember` con rol Editor o Viewer. La búsqueda reutiliza el endpoint de usuarios. La UI vive en la configuración del proyecto y en un panel de participantes junto al workspace.

## 2. Contexto técnico actual

- `members.controller.ts`, `members.service.ts` y DTOs.
- `ProjectMember` con unicidad por proyecto/usuario.
- `PermissionsService` para resolver el rol.
- `members-manager.tsx` y `participants-panel.tsx`.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Owner fuera de `ProjectMember` | Fila con rol Owner | Una única fuente de verdad |
| D-02 | Alta directa | Invitación con aceptación | Menos fricción en v1 |
| D-03 | Rol inicial Viewer | Editor por defecto | Principio de mínimo privilegio |
| D-04 | Reutilizar búsqueda de usuarios | Endpoint específico | Menos duplicación |

## 4. Cambios por capa

### Datos

- `ProjectMember` con `projectId`, `userId`, `role`.
- `@@unique([projectId, userId])`.
- Sin migración pendiente.

### Backend

- Listado, alta, cambio de rol y retirada.
- Validación de Owner y duplicados.
- Errores uniformes.

### Frontend

- Panel de participantes.
- Buscador y selector de rol.
- Confirmación de retirada.
- Invalidación de consultas tras cambios.

### Infraestructura

- Sin cambios.

## 5. Contratos

```http
POST /api/v1/projects/:projectId/members
{ "userId": "...", "role": "VIEWER" }
```

```http
DELETE /api/v1/projects/:projectId/members/:userId
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Alta, listado y retirada | Playwright |
| Unitario | Duplicados y permisos | Vitest (pendiente) |
| Integración | Revocación inmediata | Vitest (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Duplicar participante | Medio | Unicidad en base y servicio |
| Retirar al Owner | Alto | `OWNER_CANNOT_BE_REMOVED` |
| No-Owner gestiona | Alto | Guard de Owner |
| Acceso revocado sigue activo | Medio | Resolución de rol en cada request |

## 8. Rollback

- Revertir código.
- Las membresías existentes se conservan.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/members/*` | Controlador, servicio y DTOs |
| `infinipaper-backend/src/common/permissions/permissions.service.ts` | Rol efectivo |
| `infinipaper-frontend/components/project/members-manager.tsx` | Gestión |
| `infinipaper-frontend/components/project/participants-panel.tsx` | Listado |
| `infinipaper-frontend/app/projects/[projectId]/settings/page.tsx` | Configuración |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-09 | `T-010`, `T-011` |
| RF-02, RF-03 | `T-012`, `T-013` |
| RF-04, RF-05 | `T-014`, `T-015` |
| RF-06 | `T-016` |
| RF-07, RF-08 | `T-020`, `T-021` |
