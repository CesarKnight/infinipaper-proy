# Plan 013 · Creación de cuestionarios tarea (HU12)

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Aprobado` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

Se crea el módulo `quizzes` en NestJS junto con tres modelos relacionales en Prisma (`Quiz`, `QuizQuestion`, `QuizOption`). Solo los usuarios con `isTeacher = true` y permisos de edición (`Owner` o `Editor`) en un proyecto pueden crear y publicar cuestionarios. El frontend añade una sección de cuestionarios en el espacio de trabajo del proyecto y un formulario dinámico para redactar preguntas y marcar respuestas correctas.

## 2. Contexto técnico actual

- `ProjectAccessGuard` y `@RequireProjectRole()` validan la membresía y rol dentro de cada proyecto.
- El espacio de trabajo en frontend reside en `infinipaper-frontend/app/projects/[projectId]/(workspace)/`.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Tres tablas normalizadas (`Quiz`, `QuizQuestion`, `QuizOption`) | Guardar preguntas como JSON en `Quiz` | Facilita integridad referencial y calificación en HU13 |
| D-02 | Transacción Prisma (`$transaction`) al crear el cuestionario | Inserciones secuenciales sin transacción | Evita cuestionarios huérfanos o incompletos ante errores |
| D-03 | Sanitización de `isCorrect` en el servicio de lectura | Filtrar solo en el frontend | Garantiza que estudiantes no vean respuestas en red |

## 4. Cambios por capa

### Datos

- Añadir modelos `Quiz`, `QuizQuestion`, `QuizOption` y enum `QuizStatus` (`DRAFT`, `PUBLISHED`) en `schema.prisma`.
- Generar migración `add_quizzes_schema`.

### Backend

- Crear módulo `src/modules/quizzes/` (`quizzes.module.ts`, `quizzes.controller.ts`, `quizzes.service.ts`).
- Crear DTOs con validación anidada (`CreateQuizDto`, `CreateQuestionDto`, `CreateOptionDto`).
- Registrar `QuizzesModule` en `app.module.ts`.

### Frontend

- Añadir tipos `Quiz`, `QuizQuestion`, `QuizOption` en `lib/types.ts` y métodos en `lib/api.ts`.
- Crear página `/projects/[projectId]/(workspace)/quizzes/new/page.tsx` para creación.
- Mostrar listado de cuestionarios en el workspace del proyecto.

### Infraestructura

- Sin cambios de infraestructura requeridos.

## 5. Contratos

```http
POST /api/v1/projects/:projectId/quizzes
{
  "title": "Evaluación Tema 1",
  "description": "Repaso general",
  "status": "PUBLISHED",
  "questions": [
    {
      "text": "¿Qué es HTTP?",
      "points": 10,
      "options": [
        { "text": "Un protocolo de transferencia", "isCorrect": true },
        { "text": "Un lenguaje de estilos", "isCorrect": false }
      ]
    }
  ]
}
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Creación por docente, bloqueo a no docentes, ocultamiento de `isCorrect` | Swagger / Navegador |
| Unitario | Validación de al menos 1 opción correcta por pregunta | Vitest |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Filtración de respuestas correctas en API | Alto | Mapear explícitamente los campos devueltos si `userId !== quiz.creatorId` |
| Preguntas sin respuesta correcta | Medio | Validación personalizada en `QuizzesService.create` |

## 8. Rollback

- Desregistrar `QuizzesModule` y eliminar rutas `/quizzes` del frontend.
- Eliminar tablas `QuizOption`, `QuizQuestion`, `Quiz` si se revierte la migración.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/prisma/schema.prisma` | Modelos `Quiz`, `QuizQuestion`, `QuizOption` |
| `infinipaper-backend/src/app.module.ts` | Importar `QuizzesModule` |
| `infinipaper-backend/src/modules/quizzes/*` | Controlador, servicio y DTOs |
| `infinipaper-frontend/lib/types.ts` | Tipos de cuestionarios |
| `infinipaper-frontend/lib/api.ts` | Endpoints de creación y listado |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/*` | Listado y formulario de creación |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01 | `T-011` |
| RF-02, RF-03, RF-04 | `T-010`, `T-012` |
| RF-05 | `T-013` |
