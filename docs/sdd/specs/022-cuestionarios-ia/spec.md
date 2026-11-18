# Spec 022 · Generación de cuestionarios con IA

| Campo | Valor |
|---|---|
| ID | `022` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `012`, `017`, `020` |

## 1. Contexto y problema

Crear cuestionarios manualmente consume tiempo. El contenido del proyecto ya está organizado en apuntes, carpetas y recursos, y el servicio de agentes puede generar texto estructurado.

El requisito pide generar cuestionarios desde un proyecto, carpeta o apunte, pero el docente debe revisar el resultado antes de publicarlo. La IA no puede publicar evaluaciones automáticamente ni inventar fuentes.

## 2. Objetivo

> Como **docente o editor**, quiero **generar un borrador de cuestionario desde el contenido del proyecto** para **ahorrar tiempo de autoría y mantener control pedagógico sobre las preguntas**.

## 3. Alcance

### Incluye

- Generación asíncrona desde proyecto, carpeta o apunte.
- Configuración de cantidad, dificultad y tipos de pregunta.
- Resultado como `Resource(kind=QUIZ)` en estado `DRAFT`.
- Preguntas con referencias a las fuentes.
- Edición y publicación por docente/editor.
- Registro de modelo, prompt, usage y fuentes.
- Validación de estructura y deduplicación básica.

### No incluye

- Publicación automática.
- Generación de imágenes para preguntas.
- Evaluación automática de calidad pedagógica.
- Traducción automática.
- Generación desde PDFs: ampliada por la spec 027 para PDF, Office, imágenes, audio y video.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El docente/editor elige una fuente: proyecto, carpeta o apunte. | Must |
| RF-02 | Puede configurar cantidad (5–30), dificultad y tipos de pregunta. | Must |
| RF-03 | La generación se ejecuta como job asíncrono con estado. | Must |
| RF-04 | El resultado se crea como recurso `QUIZ` en `DRAFT` dentro de la carpeta destino. | Must |
| RF-05 | Cada pregunta referencia al menos una fuente. | Must |
| RF-06 | El cuestionario nace `UNVERIFIED` y no se publica automáticamente. | Must |
| RF-07 | El docente/editor puede editar preguntas, opciones y puntajes antes de publicar. | Must |
| RF-08 | Se registra el modelo, prompt y usage del job. | Must |
| RF-09 | Si la salida es inválida, se reintenta o falla con código claro. | Must |
| RF-10 | No se generan preguntas desde recursos sin permisos o vacíos. | Must |
| RF-11 | Se evitan preguntas duplicadas evidentes. | Should |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La salida cumple el esquema de cuestionario antes de guardarse. | Validación Pydantic + tests. |
| RNF-02 | El job respeta límites de entrada y salida. | Tests de límites. |
| RNF-03 | La UI muestra progreso y errores sin bloquear. | Revisión visual. |
| RNF-04 | Las fuentes se muestran y enlazan. | Test de contrato. |
| RNF-05 | El resultado no se publica sin acción humana. | Test de estado. |

## 6. Criterios de aceptación

### CA-01 · Generar desde apunte

- **Dado** un apunte válido,
- **cuando** el docente solicita 10 preguntas de dificultad media,
- **entonces** se crea un job y al terminar un cuestionario `DRAFT` con 10 preguntas.

### CA-02 · Generar desde carpeta

- **Dado** una carpeta con varios apuntes,
- **cuando** se genera el cuestionario,
- **entonces** las preguntas citan los recursos usados.

### CA-03 · Revisión humana

- **Dado** un cuestionario generado,
- **cuando** el docente lo abre,
- **entonces** puede editar preguntas y publicar solo después de revisar.

### CA-04 · Fuente no válida

- **Dado** un recurso vacío o sin permisos,
- **cuando** se intenta generar,
- **entonces** recibe `EMPTY_SOURCE` o `403`.

### CA-05 · Salida inválida

- **Dado** un modelo que devuelve JSON inválido,
- **cuando** termina el job,
- **entonces** se reintenta o falla con `AGENT_INVALID_OUTPUT`.

### CA-06 · Sin publicación automática

- **Dado** un cuestionario generado,
- **cuando** el job termina,
- **entonces** el estado es `DRAFT` y no aparece a estudiantes.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/folders/:folderId/quizzes/generate` | Editor+ | `{ source, count, difficulty, types, instructions? }` | `ContentGenerationJob` |
| `GET` | `/api/v1/generation-jobs/:id` | Editor+ | — | Estado y resultado |
| `POST` | `/api/v1/generation-jobs/:id/retry` | Editor+ | — | `ContentGenerationJob` |

### Datos

- `ContentGenerationJob`: tipo `QUIZ`, fuentes, configuración, estado, modelo, usage, resultado.
- `ResourceSource` con las fuentes.
- `Quiz` en `DRAFT`.
- `Resource.origin = AI_QUIZ`.

### UI

- Acción “Generar cuestionario con IA”.
- Selector de fuente y parámetros.
- Progreso con polling.
- Vista de revisión con fuentes y badges de validación.
- Aviso “Borrador generado por IA; revisa antes de publicar”.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Cantidad fuera de rango | Rechazar | `INVALID_QUIZ_CONFIG` · 422 |
| Fuente vacía | Rechazar | `EMPTY_SOURCE` · 422 |
| Fuente demasiado grande | Rechazar | `NOTE_TOO_LARGE` · 422 |
| JSON inválido | Reintentar o fallar | `AGENT_INVALID_OUTPUT` · 502 |
| Salida truncada | Fallar con código específico | `AGENT_OUTPUT_TRUNCATED` · 502 |
| Proyecto archivado | Rechazar | `PROJECT_ARCHIVED` · 423 |
| Preguntas duplicadas | Eliminar duplicados evidentes o advertir | `QUIZ_DUPLICATES` · 200 con warning |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | El resultado siempre es un borrador revisable. | Cerrada |
| D-02 | Se guarda como recurso `QUIZ` en la carpeta destino. | Cerrada |
| D-03 | Cada pregunta cita sus fuentes. | Cerrada |
| D-04 | Cantidad v1: 5–30 preguntas; tipos: opción múltiple, V/F y respuesta corta. | Cerrada |
| Q-01 | ¿Se añadirá evaluación automática de calidad? | Abierta (futuro) |
| Q-02 | ¿Se podrá generar desde PDFs? | Resuelta por la spec 027 |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin evaluación pedagógica automática. | La calidad depende de la revisión humana. | `T-060` |
| G-02 | Sin generación desde PDFs. | Resuelta por la spec 027 (fuentes multiformato). | `T-061` |

| G-03 | Edición avanzada de fuentes por pregunta. | La fuente se conserva, pero la UI no permite cambiarla. | `T-062` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01–CA-02 | Job `DONE` con 5 preguntas desde carpeta y fuentes citadas. | 2026-11-16 |
| CA-03 | El cuestionario nace `DRAFT` y se edita antes de publicar. | 2026-11-16 |
| CA-04–CA-06 | Fuente vacía, salida inválida y no publicación automática cubiertas por el backend. | 2026-11-16 |

> Plan y tareas: [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md).

> Diagramas: [UC-22](../../diagramas/casos-de-uso.md) · [Secuencia 022](../../diagramas/secuencia/022-cuestionarios-ia.md).
