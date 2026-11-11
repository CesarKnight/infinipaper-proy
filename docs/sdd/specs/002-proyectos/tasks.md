# Tasks 002 · Proyectos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir proyecto con Owner único y visibilidad. <RF-01, RF-02>
- [x] `T-002` Definir el contrato de listados por `scope`. <RF-07, RF-09>

## Fase 1 · Datos

- [x] `T-010` Crear modelo `Project` con `ownerId`, `name`, `description` y `visibility`. <RF-01, RF-02>
- [x] `T-011` Configurar relaciones en cascada con carpetas, miembros y recursos. <RF-05>
- [x] `T-012` Crear la carpeta raíz al crear el proyecto. <RF-03, CA-02>

## Fase 2 · Backend

- [x] `T-013` Implementar CRUD de proyectos con permisos de Owner. <RF-04, CA-04, CA-05>
- [x] `T-014` Implementar eliminación en cascada y limpieza de S3. <RF-05, CA-06>
- [x] `T-020` Implementar `GET /projects` con `scope=all\|owned\|participating\|public`. <RF-07, RF-09, CA-09>
- [x] `T-021` Implementar `GET /projects/public`. <RF-06, CA-07>
- [x] `T-022` Implementar detalle 404 para proyectos inexistentes. <RF-08, CA-08>

## Fase 3 · Frontend

- [x] `T-030` Crear listado `/projects` con tabs de `scope`. <RF-07>
- [x] `T-031` Crear workspace del proyecto. <RF-06>
- [x] `T-032` Crear pantalla de configuración con edición y borrado. <RF-04, RF-05>
- [x] `T-033` Reutilizar `ProjectCard` en listados y dashboard. <RNF-04>

## Fase 4 · Verificación

- [x] `T-040` Verificar creación, carpeta raíz y listados. <CA-01, CA-02, CA-09>
- [x] `T-041` Verificar permisos de edición y borrado. <CA-04, CA-05>
- [x] `T-042` Verificar acceso anónimo a proyecto público. <CA-07>
- [x] `T-043` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-044` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Añadir tests automatizados de proyectos y cascada S3. <G-01>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Cobertura automatizada de proyectos (G-01).
