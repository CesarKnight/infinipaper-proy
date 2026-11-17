# Plan 022 · Cuestionarios con IA

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-16` |

## 1. Resumen

Se reutiliza `ContentGenerationJob` para generar cuestionarios desde apuntes. El agente devuelve preguntas con fuentes; el backend crea un `Resource(kind=QUIZ)` y un `Quiz` en `DRAFT`, asigna `origin=AI_QUIZ`, guarda `sourceRefs` por pregunta y nunca publica automáticamente.

## 2. Cambios

- Endpoint `/folders/:id/quizzes/generate`.
- Agente `/v1/quizzes/generate` con configuración de cantidad, dificultad y tipos.
- Persistencia de `sourceRefs` en `QuizQuestion`.
- Validación y deduplicación de preguntas.
- UI de generación y aviso de borrador.

## 3. Pruebas

- E2E: generación de 5 preguntas, estado DRAFT, asignación, intento y panel.
- Verificación de que el estudiante no ve respuestas correctas.
- Build/lint/tests.

## 4. Rollback

Revierte la migración y elimina jobs; los quizzes generados pueden borrarse como recursos. No se publican automáticamente.
