# Plan 020 · Trazabilidad y validación de recursos

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-16` |

## 1. Resumen

Se añade `Resource.origin`, `Resource.validationStatus`, campos de validación y `ResourceSource`. Un `ProvenanceService` consulta la procedencia, valida recursos, audita cambios y evita ciclos de fuentes. Los recursos generados por IA nacen `UNVERIFIED`.

## 2. Cambios

- Enums `ResourceOrigin`, `ValidationStatus`, `ResourceSourceRelation`.
- Campos y relaciones en `Resource`; modelo `ResourceSource`.
- Endpoints `/files/:id/provenance`, `/files/:id/validate`.
- Filtros `origin` y `validationStatus` en el listado.
- Origen asignado en subida, apunte, transcripción, estructuración, quiz manual e IA.
- UI: badges, filtros y panel lateral de procedencia.

## 3. Pruebas

- E2E: apunte `NOTE`, validación `VERIFIED`, procedencia y auditoría.
- Build/lint/tests.
- Revisión de ciclos y permisos.

## 4. Rollback

Revierte la migración `provenance_mindmaps_generation`. Se pierden estados de validación y fuentes.
