# Spec 017 · Cuestionarios como recursos

| Campo | Valor |
|---|---|
| ID | `017` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `003`, `005`, `008`, `009`, `016` |

## 1. Contexto y problema

La jerarquía actual solo admite documentos, imágenes, audio, video y apuntes Markdown. Los cuestionarios no existen. El requisito académico pide que un cuestionario sea un recurso más dentro de la carpeta, visible en el mismo listado y sujeto a los mismos permisos, búsqueda y trazabilidad.

Además, un cuestionario no es solo un archivo: tiene preguntas, opciones, puntajes, intentos y resultados. Necesitamos separar la **entrada en la jerarquía** de la **estructura evaluativa**.

## 2. Objetivo

> Como **docente o editor**, quiero **crear un cuestionario dentro de una carpeta y verlo como un recurso más** para **organizarlo junto al material del curso y reutilizarlo en tareas**.

## 3. Alcance

### Incluye

- `ResourceKind.QUIZ`.
- Cuestionario con preguntas de opción múltiple, verdadero/falso y respuesta corta.
- Opciones, respuesta correcta, puntaje y orden.
- Estados `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Configuración de intentos, tiempo, orden aleatorio y retroalimentación.
- Snapshot JSON en MinIO para exportación y versionado.
- Listado del cuestionario en la carpeta como recurso.
- Visibilidad restringida a docentes/editores mientras sea borrador.

### No incluye

- Asignación a estudiantes, intentos y calificación; eso vive en `018`.
- Preguntas con imágenes o audio.
- Fórmulas matemáticas o tipos avanzados.
- Importación desde Moodle, Canvas o QTI.
- Banco de preguntas compartido entre proyectos.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | `ResourceKind` incorpora `QUIZ` y el recurso se crea dentro de una carpeta. | Must |
| RF-02 | El cuestionario aparece en el listado de recursos con icono, estado y tipo. | Must |
| RF-03 | Un cuestionario contiene título, instrucciones, preguntas, opciones y puntajes. | Must |
| RF-04 | Tipos v1: opción múltiple, verdadero/falso y respuesta corta. | Must |
| RF-05 | Cada pregunta tiene al menos una respuesta correcta o criterio de corrección. | Must |
| RF-06 | El cuestionario nace en `DRAFT`; solo docentes/editores lo ven. | Must |
| RF-07 | Al publicar pasa a `PUBLISHED` y puede asignarse como tarea. | Must |
| RF-08 | Un cuestionario publicado y asignado solo es visible para estudiantes asignados. | Must |
| RF-09 | El cuestionario guarda un snapshot JSON en MinIO al guardar o publicar. | Must |
| RF-10 | El cuestionario se puede duplicar y archivar; con intentos no se borra físicamente. | Must |
| RF-11 | El editor puede crear y editar cuestionarios; el Owner conserva el control del curso. | Must |
| RF-12 | El snapshot excluye datos personales de estudiantes. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El editor valida la estructura antes de guardar. | Tests de DTO y servicio. |
| RNF-02 | El snapshot JSON es determinista y versionado. | Test de serialización. |
| RNF-03 | Los estudiantes no pueden acceder a borradores ni a cuestionarios no asignados. | Tests de permisos. |
| RNF-04 | El listado no degrada con cientos de recursos. | Revisión de índices y paginación. |
| RNF-05 | La UI muestra estados de carga, vacío y error. | Revisión visual y build. |

## 6. Criterios de aceptación

### CA-01 · Crear cuestionario

- **Dado** un docente o editor en una carpeta,
- **cuando** crea un cuestionario con título y una pregunta válida,
- **entonces** se crea un `Resource(kind=QUIZ)` y aparece en el listado.

### CA-02 · Validación de preguntas

- **Dado** un cuestionario con una pregunta sin respuesta correcta,
- **cuando** se intenta guardar o publicar,
- **entonces** recibe `QUIZ_INVALID` · 422.

### CA-03 · Borrador privado

- **Dado** un cuestionario en `DRAFT`,
- **cuando** un estudiante asignado o no asignado intenta abrirlo,
- **entonces** recibe `QUIZ_NOT_PUBLISHED` · 404.

### CA-04 · Publicación

- **Dado** un cuestionario válido en `DRAFT`,
- **cuando** el docente lo publica,
- **entonces** cambia a `PUBLISHED` y queda disponible para asignación.

### CA-05 · Visibilidad de estudiante

- **Dado** un estudiante no asignado a un cuestionario publicado,
- **cuando** intenta verlo,
- **entonces** recibe `QUIZ_NOT_ASSIGNED` · 403.

### CA-06 · Snapshot

- **Dado** un cuestionario guardado,
- **cuando** se inspecciona MinIO,
- **entonces** existe un JSON con preguntas y opciones, sin datos de estudiantes.

### CA-07 · Duplicar

- **Dado** un cuestionario existente,
- **cuando** el docente lo duplica,
- **entonces** se crea un nuevo `Resource` en `DRAFT` con las mismas preguntas y sin intentos.

### CA-08 · Archivar con intentos

- **Dado** un cuestionario con intentos,
- **cuando** el docente lo archiva,
- **entonces** deja de aceptar nuevos intentos pero conserva los resultados.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/folders/:folderId/quizzes` | Editor+ | `{ title, instructions?, settings }` | `Resource + Quiz` |
| `GET` | `/api/v1/quizzes/:quizId` | Editor+ / estudiante asignado | — | `Quiz` con preguntas |
| `PATCH` | `/api/v1/quizzes/:quizId` | Editor+ | Título, instrucciones, settings | `Quiz` |
| `PUT` | `/api/v1/quizzes/:quizId/questions` | Editor+ | Lista de preguntas | `Quiz` |
| `POST` | `/api/v1/quizzes/:quizId/publish` | Editor+ | — | `Quiz` |
| `POST` | `/api/v1/quizzes/:quizId/archive` | Editor+ | — | `Quiz` |
| `POST` | `/api/v1/quizzes/:quizId/duplicate` | Editor+ | `{ folderId? }` | `Resource + Quiz` |

### Datos

- `ResourceKind.QUIZ`.
- `Quiz`: `resourceId @unique`, `status`, `settings`, `createdById`.
- `QuizQuestion`: `quizId`, `type`, `prompt`, `points`, `order`.
- `QuizOption`: `questionId`, `text`, `isCorrect`, `order`.
- `Resource` conserva `s3Key` apuntando al snapshot JSON.
- `mimeType = application/vnd.infinipaper.quiz+json`.

### UI

- Acción “Nuevo cuestionario” junto a “Nuevo apunte” y “Subir archivo”.
- Tarjeta de recurso con icono de cuestionario y badge de estado.
- Editor de preguntas con vista previa.
- Aviso de que un borrador no es visible para estudiantes.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Pregunta sin opciones | Rechazar | `QUIZ_INVALID` · 422 |
| Opción múltiple con una sola opción | Rechazar | `QUIZ_INVALID` · 422 |
| Puntaje total cero | Rechazar | `QUIZ_INVALID` · 422 |
| Editar cuestionario publicado con intentos | Crear nueva versión o bloquear edición | `QUIZ_HAS_ATTEMPTS` · 409 |
| Estudiante no asignado | No revelar el cuestionario | `QUIZ_NOT_ASSIGNED` · 403 |
| Borrar cuestionario con intentos | Archivar en lugar de borrar | `QUIZ_HAS_ATTEMPTS` · 409 |
| Snapshot falla en S3 | No publicar y reintentar | `QUIZ_SNAPSHOT_FAILED` · 502 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | El cuestionario es un `Resource(kind=QUIZ)` dentro de la carpeta. | Cerrada |
| D-02 | Preguntas y opciones viven en tablas relacionales; el JSON es snapshot de exportación. | Cerrada |
| D-03 | Tipos v1: opción múltiple, verdadero/falso y respuesta corta. | Cerrada |
| D-04 | Solo estudiantes asignados ven cuestionarios publicados. | Cerrada |
| D-05 | El editor puede crear y editar cuestionarios; el Owner controla el curso. | Cerrada |
| Q-01 | ¿La edición de un cuestionario con intentos crea versión nueva o bloquea? | Abierta (v1: bloquear) |
| Q-02 | ¿Se permite puntaje parcial en opción múltiple? | Abierta (v1: no) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin UI para duplicar/archivar quizzes. | El backend lo soporta, pero falta acción visual. | `T-060` |
| G-02 | La edición de preguntas es por reemplazo completo. | No se edita una pregunta individual de forma aislada. | `T-061` |
| G-03 | Sin tests automatizados de quiz/snapshot. | La cobertura es E2E manual. | `T-062` |
| G-04 | Sin banco de preguntas compartido ni importación QTI/Moodle. | Cada cuestionario se edita por separado. | `T-063` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01–CA-04 | Quiz creado como `Resource(kind=QUIZ)`, preguntas guardadas y publicación. | 2026-11-15 |
| CA-05 | Estudiante asignado recibe el quiz sin `isCorrect`/`correctText`; no asignado queda fuera del listado. | 2026-11-15 |
| CA-06–CA-08 | Snapshot JSON generado; archivo con intentos bloqueado. | 2026-11-15 |

> Plan y tareas: [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md).
