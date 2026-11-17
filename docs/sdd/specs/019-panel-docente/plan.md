# Plan 019 · Panel docente y estadísticas del proyecto

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-16` |

## 1. Resumen

Se añade un módulo `analytics` que agrega en vivo datos de `ProjectMember`, `QuizAssignment`, `QuizAttempt` y `QuizAnswer`. Expone resumen, tareas, estudiantes, preguntas, CSV y progreso personal. No hay tablas nuevas.

## 2. Decisiones

| ID | Decisión | Motivo |
|---|---|---|
| D-01 | Agregaciones SQL en vivo, sin snapshots. | Simplicidad y datos actualizados. |
| D-02 | Panel solo para Owner/Editor; estudiante usa `/my-progress`. | Privacidad. |
| D-03 | Umbral de riesgo por `PROJECT_RISK_THRESHOLD`. | Configurable sin migración. |
| D-04 | Último intento enviado/calificado por tarea y estudiante. | Evita duplicar notas por reintentos. |

## 3. Cambios

- `AnalyticsModule`, `AnalyticsService`, `AnalyticsController`.
- `AnalyticsQueryDto` con `assignmentId`, `studentId`, `from`, `to`.
- Cálculo de promedio, mediana, mínimo, máximo, distribución, completitud, pendientes y dificultad por pregunta.
- CSV con filtros activos.
- UI `/projects/:id/analytics` y `/projects/:id/my-progress`.

## 4. Pruebas

- E2E con curso, quiz generado, asignación, intento y panel.
- Build/lint/tests de backend y frontend.
- Validación de CSV y progreso personal.

## 5. Riesgos y rollback

- Riesgo de consultas costosas con muchos intentos; índices existentes y filtros acotan.
- Rollback: eliminar el módulo y las rutas; no hay migración.
