# Tasks 010 · Transcripción de audio

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir job asíncrono con `pg-boss` y Whisper local. <RF-04, RF-05>
- [x] `T-002` Definir polling y guardado como apunte. <RF-07, RF-09>

## Fase 1 · Datos

- [x] `T-010` Crear `TranscriptionJob` con estado, idioma, texto y error. <RF-04>
- [x] `T-011` Añadir índices por recurso y estado. <RNF-02>

## Fase 2 · Backend

- [x] `T-012` Validar que el recurso sea audio. <RF-01, RF-02, CA-02>
- [x] `T-013` Implementar encolado y worker con `pg-boss`. <RF-04, CA-03>
- [x] `T-014` Implementar llamada HTTP a Whisper y actualización de estado. <RF-05, CA-04>
- [x] `T-015` Implementar idioma configurable. <RF-06>
- [x] `T-016` Implementar consulta de estado y listado por proyecto. <RF-07>
- [x] `T-017` Aplicar permisos Editor+ a todas las rutas. <RF-10, CA-10>
- [x] `T-018` Implementar errores `ASR_NO_SPEECH` y `ASR_SERVICE_ERROR`. <RF-11, RF-12, CA-05, CA-06>
- [x] `T-019` Implementar guardado como apunte reutilizando la spec 009. <RF-09, CA-08, CA-09>

## Fase 3 · Frontend

- [x] `T-020` Implementar botón "Transcribir" en el visor de audio. <RF-01>
- [x] `T-021` Implementar polling del job y estados visuales. <RF-07, RNF-05>
- [x] `T-022` Implementar editor del texto y guardado como apunte. <RF-08, RF-09>
- [x] `T-023` Manejar errores de ASR y permisos. <RF-10, RF-12>

## Fase 4 · Verificación

- [x] `T-030` Verificar encolado y procesamiento con Whisper. <CA-01, CA-03, CA-04>
- [x] `T-031` Verificar guardado como apunte. <CA-08>
- [x] `T-032` Verificar errores de formato y permisos. <CA-02, CA-10>
- [x] `T-033` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-034` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Validar duración y tamaño antes de encolar. <G-01>
- [ ] `T-051` Detectar audio corrupto con código específico. <G-02>
- [ ] `T-052` Añadir tests del worker, estados y guardado. <G-03>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [ ] Límites de audio validados en backend (G-01).
- [ ] Cobertura automatizada de transcripción (G-03).
