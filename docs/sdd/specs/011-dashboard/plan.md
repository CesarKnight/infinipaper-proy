# Plan 011 · Dashboard personal

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

El endpoint `GET /dashboard` agrega en una sola llamada los proyectos propios, las participaciones y los públicos, con contadores. La exclusividad se resuelve en las consultas: propios por `ownerId`; participados por membresía y `ownerId != userId`; públicos por visibilidad y sin membresía. El frontend renderiza tres carruseles shadcn/embla con tarjetas reutilizables, estados vacíos y un aviso de desconexión con reintento.

## 2. Contexto técnico actual

- `dashboard.controller.ts`, `dashboard.service.ts` y `DashboardQueryDto`.
- `Project`, `ProjectMember` y `User`.
- `ProjectCard` y `Carousel` en frontend.
- `app/page.tsx` como dashboard.
- `proxy.ts` protege `/`.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Endpoint agregado | Tres llamadas desde el cliente | Menos latencia y contadores consistentes |
| D-02 | Exclusividad en consultas | Filtrar en cliente | Evita duplicados y páginas incorrectas |
| D-03 | Carrusel shadcn/embla | Scroll horizontal con CSS | Accesibilidad y arrastre |
| D-04 | Dashboard en `/` | `/dashboard` | Es la vista inicial natural |
| D-05 | Públicos recientes | Recomendación | Fuera de alcance v1 |

## 4. Cambios por capa

### Datos

- Sin tablas nuevas.
- Consultas sobre `Project` y `ProjectMember`.

### Backend

- `GET /dashboard?limit=12`.
- Cálculo de categorías y contadores.
- Orden por `updatedAt`.
- `scope` en `GET /projects`.

### Frontend

- `app/page.tsx` con tres secciones.
- `ProjectCard` y `Carousel`.
- Skeletons, estados vacíos y aviso de desconexión.
- Enlaces "Ver todos" a `/projects?scope=...`.

### Infraestructura

- Sin cambios.

## 5. Contratos

```http
GET /api/v1/dashboard?limit=12
```

```json
{
  "owned": [],
  "participating": [],
  "public": [],
  "counts": { "owned": 0, "participating": 0, "public": 0 }
}
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Categorías, carrusel, vacíos y reintento | Playwright |
| Unitario | Exclusividad y contadores | Vitest (pendiente) |
| Integración | `scope` y paginación | Vitest (pendiente) |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Duplicados entre categorías | Alto | Exclusividad en consultas |
| Dashboard lento | Medio | Una sola llamada, `take` y orden indexado |
| API caída | Medio | Aviso y reintento sin recargar |
| Públicos irrelevantes | Bajo | Se documenta como recientes, no recomendados |

## 8. Rollback

- Revertir código.
- `/projects` sigue funcionando como listado completo.
- No hay migración pendiente.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/src/modules/dashboard/*` | Controlador, servicio y DTO |
| `infinipaper-backend/src/modules/projects/dto/list-projects.dto.ts` | `scope` |
| `infinipaper-backend/src/modules/projects/projects.service.ts` | Filtros |
| `infinipaper-frontend/app/page.tsx` | Dashboard |
| `infinipaper-frontend/app/projects/page.tsx` | Listado completo |
| `infinipaper-frontend/components/project/project-card.tsx` | Tarjeta |
| `infinipaper-frontend/components/ui/carousel.tsx` | Carrusel |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-010`, `T-011` |
| RF-03, RF-04, RF-05 | `T-020`, `T-021` |
| RF-06, RF-07 | `T-012`, `T-022` |
| RF-08, RF-09 | `T-023`, `T-024` |
| RF-10, RF-11 | `T-013`, `T-025` |
