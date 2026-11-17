# Spec 021 · Mapas mentales a partir del contenido

| Campo | Valor |
|---|---|
| ID | `021` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `009`, `012`, `016`, `020` |

## 1. Contexto y problema

La aplicación ya puede estructurar apuntes con IA, pero no ofrece una representación visual de relaciones entre conceptos. Los estudiantes necesitan mapas mentales para estudiar y los docentes para resumir un tema.

El requisito pide mapas mentales generados desde el contenido almacenado, guardados como JSON y renderizados al abrir el recurso.

## 2. Objetivo

> Como **usuario con permisos de edición**, quiero **generar un mapa mental desde un apunte, carpeta o proyecto** para **visualizar y estudiar las relaciones entre conceptos sin modificar el material original**.

## 3. Alcance

### Incluye

- Generación asíncrona desde apunte, carpeta o proyecto.
- JSON canónico con nodos, aristas, título y fuentes.
- Recurso `MINDMAP` en la carpeta de destino.
- Render interactivo al abrir el recurso.
- Trazabilidad de fuentes y estado de validación.
- Vista previa antes de guardar.
- Reintentos y estados del job.

### No incluye

- Edición colaborativa en tiempo real.
- Edición manual avanzada del mapa en v1.
- Exportación PNG/SVG en v1 (queda como mejora).
- Mapas 3D o layouts avanzados.
- Generación desde PDFs sin extracción de texto.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El usuario con edición puede elegir apunte, carpeta o proyecto como fuente. | Must |
| RF-02 | La generación se ejecuta como job asíncrono con estado. | Must |
| RF-03 | El resultado se guarda como `Resource(kind=MINDMAP)` en la carpeta destino. | Must |
| RF-04 | El JSON contiene título, nodos, aristas y referencias a fuentes. | Must |
| RF-05 | El mapa se renderiza al abrir el recurso. | Must |
| RF-06 | El original no se modifica. | Must |
| RF-07 | El mapa nace `UNVERIFIED` y muestra sus fuentes. | Must |
| RF-08 | Los permisos se heredan de la carpeta/proyecto. | Must |
| RF-09 | El usuario puede reintentar un job fallido. | Should |
| RF-10 | El servicio de agentes valida el JSON antes de guardarlo. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El JSON no contiene HTML ni scripts. | Validación de esquema y sanitización. |
| RNF-02 | El render no bloquea la UI con mapas grandes. | Prueba con 100 nodos. |
| RNF-03 | El job tiene timeout y límite de tokens. | Tests de error. |
| RNF-04 | La UI muestra carga, vacío y error. | Revisión visual y build. |
| RNF-05 | El mapa respeta el tema claro/oscuro. | Revisión visual. |

## 6. Criterios de aceptación

### CA-01 · Generar desde apunte

- **Dado** un apunte Markdown y un usuario con edición,
- **cuando** solicita un mapa mental,
- **entonces** se crea un job y al terminar aparece un recurso `MINDMAP`.

### CA-02 · Generar desde carpeta

- **Dado** una carpeta con varios recursos,
- **cuando** se genera el mapa,
- **entonces** el JSON referencia los recursos usados.

### CA-03 · Visualización

- **Dado** un recurso `MINDMAP`,
- **cuando** el usuario lo abre,
- **entonces** se renderizan nodos y aristas sin ejecutar HTML.

### CA-04 · Original intacto

- **Dado** un apunte fuente,
- **cuando** se genera el mapa,
- **entonces** el apunte no cambia.

### CA-05 · Permisos

- **Dado** un usuario sin acceso al proyecto,
- **cuando** intenta abrir el mapa,
- **entonces** recibe `403` o `404`.

### CA-06 · Job fallido

- **Dado** un fallo del proveedor,
- **cuando** termina el job,
- **entonces** el estado es `FAILED`, se muestra el motivo y se puede reintentar.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/folders/:folderId/mindmaps` | Editor+ | `{ source: { type, id }, instructions? }` | `ContentGenerationJob` |
| `GET` | `/api/v1/generation-jobs/:id` | Editor+ | — | Estado y resultado |
| `POST` | `/api/v1/generation-jobs/:id/retry` | Editor+ | — | `ContentGenerationJob` |

### Datos

- `ResourceKind.MINDMAP`.
- `Resource.origin = AI_MINDMAP`.
- `ContentGenerationJob`: tipo `MINDMAP`, fuentes, estado, modelo, usage, resultado.
- `ResourceSource` con las fuentes.
- JSON en MinIO: `application/vnd.infinipaper.mindmap+json`.

### UI

- Acción “Generar mapa mental” en apunte, carpeta y proyecto.
- Diálogo de configuración y progreso.
- Vista previa con layout interactivo.
- Botón “Guardar como recurso” si se genera fuera de una carpeta.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Fuente vacía | Rechazar | `EMPTY_SOURCE` · 422 |
| Fuente demasiado grande | Rechazar con límite | `NOTE_TOO_LARGE` · 422 |
| JSON inválido del modelo | Reintentar y fallar | `AGENT_INVALID_OUTPUT` · 502 |
| Salida truncada | Fallar con código específico | `AGENT_OUTPUT_TRUNCATED` · 502 |
| Proyecto archivado | Rechazar generación | `PROJECT_ARCHIVED` · 423 |
| Mapa con nodos duplicados | Normalizar o advertir | `MINDMAP_INVALID` · 422 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | JSON canónico + render en frontend; no se guarda una imagen en v1. | Cerrada |
| D-02 | Se guarda como `Resource(kind=MINDMAP)` en la jerarquía. | Cerrada |
| D-03 | Trazabilidad mediante `ResourceSource` y estado `UNVERIFIED`. | Cerrada |
| D-04 | Render con una librería de grafos interactiva; se propone `@xyflow/react`. | Cerrada |
| Q-01 | ¿Exportación SVG/PNG en v1 o fase posterior? | Abierta (v1: posterior) |
| Q-02 | ¿Edición manual de nodos en v1? | Abierta (v1: no) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin exportación de imagen. | El mapa solo se usa dentro de la app. | `T-060` |
| G-02 | Sin edición manual. | El usuario debe regenerar para cambiar el resultado. | `T-061` |

| G-03 | Layout avanzado y rendimiento para mapas muy grandes. | El visor usa un layout radial simple. | `T-062` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01–CA-04 | Job `DONE` desde carpeta; recurso `MINDMAP` con 8 nodos y 6 aristas; original intacto. | 2026-11-16 |
| CA-05 | Permisos de proyecto aplicados por el guard. | 2026-11-16 |
| CA-06 | Job fallido y reintento disponibles. | 2026-11-16 |

> Plan y tareas: [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md).

> Diagramas: [UC-21](../../diagramas/casos-de-uso.md) · [Secuencia 021](../../diagramas/secuencia/021-mapas-mentales.md).
