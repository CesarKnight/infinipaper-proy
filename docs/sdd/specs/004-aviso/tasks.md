# Tasks 004 · Aviso en el listado de carpeta

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir el aviso como `Resource` Markdown con nombre configurable. <RF-01, RF-11>
- [x] `T-002` Definir detección por `noticeResourceId` y render al tope. <RF-03>

## Fase 1 · Datos

- [x] `T-010` Confirmar que no se requiere tabla nueva. <RF-01>
- [x] `T-011` Añadir `AVISO_FILENAME` a la configuración. <RF-11, CA-07>

## Fase 2 · Backend

- [x] `T-012` Incluir `noticeResourceId` en el detalle de carpeta. <RF-03, RF-04>
- [x] `T-013` Implementar creación del aviso con permisos Editor+. <RF-05, CA-02, CA-03>
- [x] `T-014` Reutilizar lectura y guardado de contenido Markdown. <RF-09>

## Fase 3 · Frontend

- [x] `T-020` Crear `notice-panel` con render, creación y edición. <RF-03, RF-05, RF-06>
- [x] `T-021` Renderizar GFM y sanitizar el HTML. <RF-08, CA-04, CA-05>
- [x] `T-022` Manejar contenido inválido sin romper la vista. <RF-10, CA-08>
- [x] `T-023` Integrar autoguardado del editor compartido. <RF-09>
- [x] `T-024` Mantener el aviso visible en el listado de archivos. <RF-02>

## Fase 4 · Verificación

- [x] `T-030` Verificar creación y render al tope. <CA-01, CA-02>
- [x] `T-031` Verificar permisos de Viewer. <CA-03>
- [x] `T-032` Verificar que un nombre distinto no se trata como aviso. <CA-06>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Resolver imágenes y enlaces relativos a archivos de la carpeta. <G-01>
- [ ] `T-051` Añadir tests de detección, sanitización y permisos. <G-02>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Medios relativos resueltos (G-01).
- [ ] Cobertura automatizada del aviso (G-02).
