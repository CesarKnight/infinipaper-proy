# Plan 008 · Permisos y roles de proyecto

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

La autorización se centraliza en `PermissionsService`, que resuelve el rol efectivo de un usuario (o anónimo) en un proyecto. `ProjectAccessGuard` usa ese servicio y el decorador `@RequireProjectRole` para exigir un mínimo. El Owner se resuelve desde `Project.ownerId`; los demás desde `ProjectMember`. Los proyectos públicos permiten lectura anónima.

## 2. Contexto técnico actual

- `common/permissions/permissions.service.ts`.
- `common/guards/project-access.guard.ts`.
- `common/decorators/require-project-role.decorator.ts`.
- `Project.ownerId`, `ProjectMember.role` y `Project.visibility`.
- Guards aplicados en proyectos, carpetas, recursos, miembros y transcripciones.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Un único `PermissionsService` | Lógica duplicada por módulo | Consistencia y menor riesgo |
| D-02 | Guard que resuelve el proyecto desde el parámetro | Guards específicos por recurso | Reutilización |
| D-03 | Jerarquía owner > editor > viewer > público | Permisos aditivos complejos | Simplicidad |
| D-04 | Ocultar acciones en UI solo como refuerzo | Confiar en la UI | La seguridad vive en servidor |

## 4. Cambios por capa

### Datos

- `Project.ownerId`, `ProjectMember.role`, `Project.visibility`.
- Índices por propietario, miembro y visibilidad.
- Sin migración pendiente.

### Backend

- `PermissionsService.resolveRole`.
- `ProjectAccessGuard`.
- `@RequireProjectRole`.
- Aplicación en todos los controladores restringidos.

### Frontend

- `canEdit` en el workspace.
- Selector de rol en configuración.
- Ocultación de acciones no permitidas.

### Infraestructura

- Sin cambios.

## 5. Contratos

El contrato de gestión es el de la spec 007. La autorización se expresa en el backend:

```ts
@RequireProjectRole('editor')
@UseGuards(ProjectAccessGuard)
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual | Owner, Editor, Viewer y anónimo | Playwright |
| Unitario | `resolveRole` y jerarquía | Vitest (pendiente) |
| E2E | Endpoints restringidos con cada rol | Vitest e2e (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Viewer escribe por endpoint no protegido | Alto | Guard global en controladores y tests de matriz |
| Owner tratado como miembro | Medio | Resolución prioritaria de `ownerId` |
| Público permite escritura | Alto | Solo lectura para anónimo |
| Cambio de rol no aplica | Medio | Resolución por request, sin caché de rol |

## 8. Rollback

- Revertir código.
- Los roles persisten en `ProjectMember`.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/common/permissions/*` | Resolución de rol |
| `infinipaper-backend/src/common/guards/project-access.guard.ts` | Guard |
| `infinipaper-backend/src/common/decorators/require-project-role.decorator.ts` | Decorador |
| `infinipaper-backend/src/modules/members/members.service.ts` | Cambio de rol |
| `infinipaper-frontend/app/projects/[projectId]/settings/page.tsx` | Selector de rol |
| `infinipaper-frontend/components/project/workspace-context.tsx` | `canEdit` |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-010`, `T-011` |
| RF-03, RF-09 | `T-012` |
| RF-04, RF-07 | `T-013`, `T-014` |
| RF-05 | `T-015` |
| RF-06 | `T-016` |
| RF-08 | `T-017` |
