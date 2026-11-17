# Plan 021 · Mapas mentales

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-16` |

## 1. Resumen

Se añade `ContentGenerationJob`, `ResourceKind.MINDMAP` y una cola pg-boss. Un job toma una fuente (recurso, carpeta o proyecto), llama al servicio de agentes y guarda un JSON canónico en MinIO como recurso `MINDMAP`, con procedencia y estado `UNVERIFIED`.

## 2. Cambios

- Enums `ContentGenerationType` y `ResourceKind.MINDMAP`.
- Modelo `ContentGenerationJob`.
- Endpoints de creación, consulta y reintento de jobs.
- Agente `/v1/mindmaps/generate` con validación de nodos y aristas.
- Render SVG interactivo básico en el visor.
- Diálogo de generación desde carpeta o proyecto.

## 3. Pruebas

- E2E: generación desde carpeta, job `DONE`, recurso MINDMAP y JSON con nodos/aristas.
- Validación de que el apunte original no cambia.
- Build/lint/tests de agents y frontend.

## 4. Rollback

Revierte la migración y elimina jobs/recursos MINDMAP. Los objetos en MinIO deben borrarse con los recursos.
