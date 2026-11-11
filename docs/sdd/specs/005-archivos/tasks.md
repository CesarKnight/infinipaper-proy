# Tasks 005 · Gestión de archivos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir subida proxeada y límite centralizado. <RF-01, RF-02>
- [x] `T-002` Definir formatos y mapeo a `kind`. <RF-03, RF-05>

## Fase 1 · Datos

- [x] `T-010` Confirmar `Resource` con metadatos y `@@unique([folderId, name])`. <RF-04, RF-06>
- [x] `T-011` Configurar `MAX_UPLOAD_SIZE_MB` y exponerlo en `/config`. <RF-02, RNF-01, CA-08>

## Fase 2 · Backend

- [x] `T-012` Implementar validación de extensión/MIME y asignación de `kind`. <RF-03, RF-05, CA-02>
- [x] `T-013` Implementar checksum, clave S3 y creación del `Resource`. <RF-04>
- [x] `T-014` Implementar unicidad de nombre con `suggestedName`. <RF-06, CA-07>
- [x] `T-015` Aplicar permisos Editor+ a subida, renombrado y borrado. <RF-07, CA-04>
- [x] `T-016` Implementar listado y descarga con `Range`. <RF-08, RF-10>
- [x] `T-017` Implementar borrado de recurso y objeto S3. <RF-09, CA-06>
- [x] `T-018` Implementar error de tamaño con el límite en el mensaje. <CA-03>

## Fase 3 · Frontend

- [x] `T-020` Implementar listado con icono, autor y tamaño. <RF-08>
- [x] `T-021` Implementar subida con input, estado y errores. <RF-01, RF-07>
- [x] `T-022` Implementar renombrado y eliminación para Editor+. <RF-07, RF-09>
- [x] `T-023` Implementar orden por nombre, fecha y tipo. <RNF-04>

## Fase 4 · Verificación

- [x] `T-030` Verificar subida, listado y descarga. <CA-01, CA-05>
- [x] `T-031` Verificar formatos no admitidos y límite. <CA-02, CA-03>
- [x] `T-032` Verificar duplicados y sugerencia. <CA-07>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Evaluar arrastrar y soltar en la UI. <G-01>
- [ ] `T-051` Añadir tests automatizados de límites, formatos y S3. <G-02>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Drag & drop disponible (G-01).
- [ ] Cobertura automatizada de archivos (G-02).
