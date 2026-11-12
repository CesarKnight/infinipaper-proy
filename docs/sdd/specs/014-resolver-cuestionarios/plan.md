# Plan 014 · Resolver cuestionarios (HU13)

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Aprobado` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

Se amplía el módulo `quizzes` y el esquema de base de datos con los modelos `QuizSubmission` y `QuizAnswer` para registrar las entregas de los participantes. Al recibir las respuestas, el backend valida que el cuestionario esté publicado y vigente, verifica que el usuario no tenga entregas previas, calcula el puntaje total comparando contra `QuizOption.isCorrect` y persiste el resultado.

## 2. Contexto técnico actual

- Módulo `QuizzesModule` y modelos `Quiz`, `QuizQuestion`, `QuizOption` creados en Spec 013.
- `ProjectAccessGuard` permite validar que el usuario pertenece al proyecto (`Owner`, `Editor` o `Viewer`).

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Restricción única `@@unique([quizId, userId])` en BD | Validar solo en memoria antes de insertar | Evita condiciones de carrera ante envíos simultáneos |
| D-02 | Cálculo de nota en transacción en backend | Calcular puntaje en frontend | Previene manipulación de calificaciones |
| D-03 | Guardar `isCorrect` en cada `QuizAnswer` | Recalcular dinámicamente al consultar | Mantiene histórico exacto de la evaluación |

## 4. Cambios por capa

### Datos

- Añadir modelos `QuizSubmission` y `QuizAnswer` en `schema.prisma` con `@@unique([quizId, userId])`.
- Generar migración `add_quiz_submissions`.

### Backend

- Crear `SubmitQuizDto` en `src/modules/quizzes/dto/`.
- Añadir endpoints `POST /api/v1/projects/:projectId/quizzes/:quizId/submit` y `GET .../my-submission` en `QuizzesController`.
- Implementar lógica de calificación y validación de expiración en `QuizzesService`.

### Frontend

- Añadir tipos `QuizSubmission` y `QuizAnswer` en `lib/types.ts` y funciones en `lib/api.ts`.
- Crear vista interactiva `/projects/[projectId]/(workspace)/quizzes/[quizId]/page.tsx` para responder y visualizar la nota obtenida.

### Infraestructura

- Sin cambios de infraestructura requeridos.

## 5. Contratos

```http
POST /api/v1/projects/:projectId/quizzes/:quizId/submit
{
  "answers": [
    { "questionId": "uuid-q1", "selectedOptionId": "uuid-opt1" }
  ]
}
```

Respuesta exitosa (`201 Created`):
```json
{
  "id": "uuid-sub",
  "score": 10,
  "maxScore": 10,
  "submittedAt": "2026-11-11T20:15:00.000Z"
}
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Envío de respuestas, cálculo de puntaje, bloqueo de segundo intento y cuestionario vencido | Swagger / Navegador |
| Unitario | Cálculo de `score` y `maxScore` en `QuizzesService.submit` | Vitest |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Envío de opciones que no pertenecen a la pregunta | Medio | Validar correspondencia `option.questionId === question.id` |
| Doble clic en botón de enviar | Medio | Deshabilitar botón en UI durante carga + restricción `@@unique` en BD |

## 8. Rollback

- Eliminar endpoints `/submit` y `/my-submission` en `QuizzesController` y la vista de resolución en frontend.
- Eliminar tablas `QuizAnswer` y `QuizSubmission`.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/prisma/schema.prisma` | Modelos `QuizSubmission` y `QuizAnswer` |
| `infinipaper-backend/src/modules/quizzes/*` | DTO, rutas y lógica de calificación |
| `infinipaper-frontend/lib/types.ts` | Tipos de envío y respuestas |
| `infinipaper-frontend/lib/api.ts` | Llamadas HTTP de envío y consulta |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/quizzes/[quizId]/page.tsx` | Pantalla para resolver cuestionario |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-04 | `T-011` |
| RF-02 | `T-010`, `T-012` |
| RF-03 | `T-013` |
| RF-05 | `T-014`, `T-020` |
