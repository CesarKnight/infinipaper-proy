# Tasks 011 · Dashboard personal

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir tres categorías exclusivas y dashboard en `/`. <RF-01, RF-02>
- [x] `T-002` Definir carrusel, límite y "Ver todos". <RF-03, RF-07>

## Fase 1 · Datos

- [x] `T-010` Confirmar que no se requieren tablas nuevas. <RF-01>
- [x] `T-011` Definir consultas de propios, participados y públicos. <RF-02>
- [x] `T-012` Ordenar por `updatedAt` y limitar por categoría. <RF-06, RF-07>

## Fase 2 · Backend

- [x] `T-013` Implementar `GET /dashboard?limit=12` con contadores. <RF-01, RNF-01>
- [x] `T-014` Implementar exclusividad de categorías. <RF-02, CA-04, CA-05>
- [x] `T-015` Ampliar `GET /projects` con `scope=owned\|participating\|public\|all`. <RF-07, CA-11>

## Fase 3 · Frontend

- [x] `T-020` Implementar los tres carruseles. <RF-03, CA-06>
- [x] `T-021` Implementar `ProjectCard` con nombre, descripción, visibilidad, propietario y rol. <RF-04, CA-12>
- [x] `T-022` Implementar "Ver todos" y navegación por `scope`. <RF-07, CA-11>
- [x] `T-023` Implementar estados vacíos por categoría. <RF-08, CA-07, CA-08>
- [x] `T-024` Implementar aviso "Sin conexión" y reintento. <RF-09, CA-09>
- [x] `T-025` Proteger `/` y redirigir login/registro al dashboard. <RF-10, CA-10>

## Fase 4 · Verificación

- [x] `T-030` Verificar categorías y exclusividad. <CA-01, CA-02, CA-03, CA-04, CA-05>
- [x] `T-031` Verificar carrusel y tarjetas. <CA-06, CA-12>
- [x] `T-032` Verificar estados vacíos y sin conexión. <CA-07, CA-08, CA-09>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Añadir tests de exclusividad, límites y offline. <G-01>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Cobertura automatizada del dashboard (G-01).
