# Tasks 009 · Apuntes Markdown con editor WYSIWYG y autoguardado

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea cita los requisitos o criterios que satisface.
- Las tareas de brechas (`G-*`) están al final y quedan pendientes de decisión.

## Fase 0 · Preparación

- [x] `T-001` Revisar el modelo `Resource`, los permisos y los endpoints existentes. <RF-01, RF-08>
- [x] `T-002` Confirmar alcance v1: sin colaboración en tiempo real, sin historial de versiones. <RF-12>

## Fase 1 · Datos

- [x] `T-010` Confirmar que no se requiere migración: el apunte reutiliza `Resource` con `kind=MARKDOWN`. <RF-01>
- [x] `T-011` Verificar `@@unique([folderId, name])` para evitar duplicados. <RF-01, RF-11>

## Fase 2 · Backend

- [x] `T-020` Crear `CreateNoteDto` con `name` 1–255 y `content` hasta 1.000.000 de caracteres. <RF-01, RNF-06>
- [x] `T-021` Crear `UpdateContentDto` con límite de contenido. <RF-04, RNF-06>
- [x] `T-022` Implementar `POST /folders/:folderId/notes` y normalización `.md`. <RF-01, RF-11, CA-09>
- [x] `T-023` Implementar `createMarkdown`: validar carpeta, subir a MinIO y crear `Resource`. <RF-01, RF-14>
- [x] `T-024` Implementar `GET /files/:fileId/text` y `PUT /files/:fileId/content`. <RF-04, RF-15>
- [x] `T-025` Actualizar `size` y `checksum` en cada guardado. <RNF-07>
- [x] `T-026` Implementar `PATCH /files/:fileId` para renombrar y `DELETE /files/:fileId` con limpieza de MinIO. <RF-13, RF-14>
- [x] `T-027` Aplicar `ProjectAccessGuard` y `@RequireProjectRole('viewer'|'editor')` en las rutas. <RF-08, RF-09, CA-04>
- [x] `T-028` Devolver errores uniformes para carpeta, recurso y tipo no soportado. <CA-05>
- [x] `T-029` Verificar que un `.md` subido también se puede leer y editar como apunte. <RF-02>

## Fase 3 · Frontend

- [x] `T-030` Crear `MarkdownEditor` con carga dinámica (`ssr: false`). <RNF-01>
- [x] `T-031` Configurar MDXEditor con toolbar, modo fuente y plugins. <RF-03>
- [x] `T-032` Integrar el editor en el diálogo “Nuevo apunte”. <RF-01, RF-02>
- [x] `T-033` Implementar `useAutosave` con *debounce* de 1200 ms y comparación con el último guardado. <RF-04, RF-05, RNF-03>
- [x] `T-034` Mostrar `Guardando…` / `Guardado` / `Error al guardar`. <RF-06, CA-02>
- [x] `T-035` Integrar edición y autoguardado en el visor de `.md`. <RF-04, RF-15>
- [x] `T-036` Renderizar la vista de solo lectura con `react-markdown` + `rehype-sanitize`. <RF-07, RNF-02, CA-06>
- [x] `T-037` Ocultar acciones de escritura a Viewer y respetar `canEdit`. <RF-08>
- [x] `T-038` Aplicar tokens de tema al editor y revisar accesibilidad básica. <RNF-04, RNF-05>
- [x] `T-039` Reutilizar el editor y el autoguardado en el aviso del proyecto. <RF-03, D-04>

## Fase 4 · Pruebas y verificación

- [x] `T-040` Verificación manual con Playwright: crear, editar, autoguardar y reabrir. <CA-01, CA-02, CA-03>
- [x] `T-041` Verificar cero errores de consola durante el flujo del editor. <RNF-01>
- [x] `T-042` Revisar `ProjectAccessGuard` para el caso Viewer. <CA-04>
- [x] `T-043` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-044` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-045` Añadir tests automatizados del hook y del servicio. <G-05>
- [ ] `T-046` Probar sanitización XSS con un apunte malicioso. <CA-06, RNF-02>
- [ ] `T-047` Probar límite de contenido y contenido vacío. <CA-10>

## Fase 5 · Documentación y cierre

- [x] `T-050` Migrar los apuntes a esta spec y retirar la documentación anterior. <P-09>
- [x] `T-051` Actualizar `docs/sdd/referencia/librerias.md` con el editor y sus dependencias. <RNF>
- [x] `T-052` Registrar brechas conocidas en `spec.md`. <P-09>

## Fase 6 · Brechas pendientes

- [ ] `T-060` Añadir diálogo de confirmación antes de eliminar un apunte. <G-01, CA-07>
- [ ] `T-061` Añadir UI de renombrado de apunte usando `PATCH /files/:fileId`. <G-02, RF-13>
- [ ] `T-062` Decidir y alinear los códigos de error o actualizar la spec. <G-03, Q-01>
- [ ] `T-063` Decidir si el límite es 1 MB binario o 1.000.000 de caracteres y alinear validación. <G-04, Q-02>
- [ ] `T-064` Añadir tests automatizados de apuntes. <G-05>
- [ ] `T-065` Evitar pérdida de la última edición al salir antes del *debounce*. <G-06>

## Verificación final

- [x] Los criterios CA-01, CA-02, CA-03 tienen evidencia manual.
- [ ] Todos los `CA-*` tienen evidencia automatizada o manual registrada.
- [ ] No quedan tareas obligatorias pendientes (G-01, G-02 y G-05 afectan criterios).
- [x] La spec está en estado `Implementada con brechas`.
- [x] El plan de rollback está documentado.
