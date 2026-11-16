# Spec 019 · Panel docente y estadísticas del proyecto

| Campo | Valor |
|---|---|
| ID | `019` |
| Estado | `Borrador` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `016`, `017`, `018` |

## 1. Contexto y problema

El dashboard actual es personal: muestra proyectos y participaciones, pero no ofrece una vista académica del curso. El docente no puede saber cuántos estudiantes participan, quién está pendiente, qué preguntas resultan difíciles o qué estudiantes necesitan apoyo.

El panel debe ser una vista del proyecto, respetando que el docente/editor ve su curso y el estudiante solo su propio progreso.

## 2. Objetivo

> Como **docente o editor**, quiero **ver un panel de estadísticas del proyecto** para **detectar pendientes, dificultades y estudiantes en riesgo**.
>
> Como **estudiante**, quiero **ver mi propio progreso** para **saber qué tareas me faltan**.

## 3. Alcance

### Incluye

- Panel por proyecto con métricas de participación y evaluación.
- Filtros por tarea, estudiante y periodo.
- Distribución de notas, promedio, mediana y porcentaje de completitud.
- Pendientes por estudiante y tareas en riesgo.
- Dificultad por pregunta.
- Exportación CSV.
- Vista de progreso personal para estudiantes.

### No incluye

- Comparación entre proyectos.
- Rankings públicos entre estudiantes.
- Predicción de abandono con modelos de IA.
- Analítica en tiempo real por websockets.
- Métricas de uso de recursos; viven en `023`.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El Owner/Editor ve un panel del proyecto con métricas académicas. | Must |
| RF-02 | El panel muestra estudiantes inscritos, activos y pendientes. | Must |
| RF-03 | El panel muestra tareas publicadas, cerradas y pendientes de calificar. | Must |
| RF-04 | El panel muestra promedio, mediana, mínimo, máximo y distribución de notas. | Must |
| RF-05 | El panel muestra completitud por tarea y por estudiante. | Must |
| RF-06 | El panel identifica estudiantes en riesgo según umbral configurable. | Should |
| RF-07 | El panel muestra dificultad por pregunta. | Should |
| RF-08 | El docente puede filtrar por tarea, estudiante y periodo. | Must |
| RF-09 | El docente puede exportar el panel a CSV. | Must |
| RF-10 | El estudiante ve solo su propio progreso y notas. | Must |
| RF-11 | Ningún estudiante ve notas de otros estudiantes. | Must |
| RF-12 | El panel respeta la privacidad del proyecto. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El panel responde en menos de 2 segundos con 200 estudiantes y 20 tareas. | Prueba de carga básica. |
| RNF-02 | Las agregaciones no exponen datos individuales a estudiantes. | Tests de permisos y contrato. |
| RNF-03 | El CSV respeta los filtros activos. | Test de exportación. |
| RNF-04 | La UI cubre estados de carga, vacío y error. | Revisión visual y build. |
| RNF-05 | El umbral de riesgo es configurable. | Revisión de configuración. |

## 6. Criterios de aceptación

### CA-01 · Panel del docente

- **Dado** un proyecto de curso con estudiantes y tareas,
- **cuando** el Owner abre el panel,
- **entonces** ve participación, completitud, promedios y pendientes.

### CA-02 · Filtro por tarea

- **Dado** un panel con varias tareas,
- **cuando** el docente filtra por una tarea,
- **entonces** todas las métricas se recalculan para esa tarea.

### CA-03 · Estudiante en riesgo

- **Dado** un estudiante con nota inferior al umbral o tareas pendientes,
- **cuando** el docente revisa el panel,
- **entonces** aparece marcado como “en riesgo” con el motivo.

### CA-04 · Dificultad por pregunta

- **Dado** una tarea con intentos,
- **cuando** el docente abre el detalle,
- **entonces** ve el porcentaje de acierto por pregunta.

### CA-05 · Exportación

- **Dado** un panel filtrado,
- **cuando** el docente exporta,
- **entonces** descarga un CSV coherente con los filtros.

### CA-06 · Progreso del estudiante

- **Dado** un estudiante inscrito,
- **cuando** abre su progreso,
- **entonces** ve sus tareas, notas y pendientes, sin datos de otros.

### CA-07 · Acceso ajeno

- **Dado** un usuario que no pertenece al proyecto,
- **cuando** intenta abrir el panel,
- **entonces** recibe `403` o `404`.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/projects/:id/analytics` | Owner/Editor | `?assignmentId=&studentId=&from=&to=` | Resumen agregado |
| `GET` | `/api/v1/projects/:id/analytics/tasks` | Owner/Editor | Filtros | Métricas por tarea |
| `GET` | `/api/v1/projects/:id/analytics/students` | Owner/Editor | Filtros | Métricas por estudiante |
| `GET` | `/api/v1/projects/:id/analytics/export` | Owner/Editor | Filtros | CSV |
| `GET` | `/api/v1/projects/:id/my-progress` | Estudiante | — | Progreso propio |

### Datos

- Sin tablas nuevas en v1; agregaciones sobre `QuizAssignment`, `QuizAttempt`, `QuizAnswer` y `ProjectMember`.
- Índices en `QuizAttempt(assignmentId, studentId)`, `QuizAnswer(questionId)`.
- Umbral de riesgo en `PROJECT_RISK_THRESHOLD` (por defecto 70%).

### UI

- Nueva pestaña “Panel” en el proyecto de curso.
- Tarjetas de resumen, tabla por estudiante y detalle por tarea.
- Filtros persistentes en la URL.
- Botón “Exportar CSV”.
- Vista “Mi progreso” para estudiantes.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Proyecto sin tareas | Mostrar estado vacío | `200` con métricas vacías |
| Tarea sin intentos | Mostrar “sin datos” sin dividir por cero | `200` |
| Estudiante sin intentos | Mostrar pendiente | `200` |
| Filtro inválido | Rechazar | `INVALID_FILTER` · 422 |
| Exportación demasiado grande | Limitar y pedir filtro | `EXPORT_TOO_LARGE` · 413 |
| Estudiante intenta ver panel general | Rechazar | `PROJECT_ROLE_REQUIRED` · 403 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Panel por proyecto, no panel global de cursos en v1. | Cerrada |
| D-02 | Agregaciones SQL en vivo; sin tabla de snapshots en v1. | Cerrada |
| D-03 | Umbral de riesgo configurable por env, por defecto 70%. | Cerrada |
| D-04 | Estudiantes ven solo su progreso. | Cerrada |
| Q-01 | ¿Se añadirán snapshots históricos? | Abierta (futuro) |
| Q-02 | ¿El editor puede exportar? | Abierta (v1: sí) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin comparación entre cursos. | El panel es por proyecto. | `T-060` |
| G-02 | Sin predicción de abandono. | El riesgo es una regla simple. | `T-061` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| — | Pendiente de implementación. | — |

> Plan y tareas: se crearán cuando esta spec pase a `Aprobada`.
