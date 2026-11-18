# Plan 023 · Métricas de uso de recursos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-18` |

## 1. Resumen

Se añade `ResourceEvent` para registrar vistas, descargas, apariciones en búsqueda y uso en cuestionarios. `UsageService` agrega por proyecto y recurso, respeta permisos y exporta CSV. Los eventos no guardan contenido y usan `RESOURCE_EVENT_RETENTION_DAYS`.

## 2. Decisiones

| ID | Decisión | Motivo |
|---|---|---|
| D-01 | Registro en servidor en `GET /files/:id` y descarga con `?download=1`. | Evita depender de la UI. |
| D-02 | Agregados en vivo por proyecto. | Sin snapshots en v1. |
| D-03 | Metadata con nombre/tipo/origen/validación. | Conserva agregados si el recurso se elimina. |
| D-04 | Retención configurable, sin job automático en v1. | Se puede purgar con `UsageService.purgeExpired`. |

## 3. Cambios

- Enum `ResourceEventType` y modelo `ResourceEvent`.
- `UsageModule`, `UsageService`, endpoints de proyecto/recurso/CSV.
- Registro de eventos desde recursos y asignación de quizzes.
- Página `/projects/:id/usage`.

## 4. Pruebas

- E2E: vista + descarga, agregados, CSV y privacidad.
- Lint, tests y build.

## 5. Rollback

Revierte la migración; se pierden los eventos. No afecta a recursos.
