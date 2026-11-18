# Spec 024 · Procesamiento semántico y búsqueda

| Campo | Valor |
|---|---|
| ID | `024` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `005`, `009`, `010`, `017`, `020` |

## 1. Contexto y problema

La búsqueda actual se limita a navegar carpetas y recursos. El estudiante no puede preguntar “dónde se explica la diferencia entre sprint y revisión” y obtener los apuntes relevantes.

El requisito pide procesamiento semántico y búsqueda dentro del material almacenado, respetando la privacidad del proyecto y los permisos.

## 2. Objetivo

> Como **participante**, quiero **buscar en lenguaje natural dentro de un proyecto o carpeta** para **encontrar material relacionado aunque no recuerde las palabras exactas**.

## 3. Alcance

### Incluye

- Chunking de recursos de texto.
- Embeddings mediante abstracción de proveedor.
- Almacenamiento vectorial con `pgvector`.
- Búsqueda híbrida: vectorial + texto completo.
- Indexación asíncrona al crear, editar o borrar recursos.
- Reindexación manual por administrador/Owner.
- Filtros por tipo, origen y validación.
- Resultados con fragmento y recurso fuente.

### No incluye

- OCR de imágenes.
- Extracción de texto de PDFs en v1.
- Búsqueda entre proyectos no autorizados.
- Búsqueda en tiempo real con streaming.
- Respuestas generativas con citas; solo recuperación.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | La extensión `pgvector` está habilitada en PostgreSQL. | Must |
| RF-02 | Los recursos de texto se dividen en chunks con solapamiento. | Must |
| RF-03 | Cada chunk guarda su embedding y metadatos. | Must |
| RF-04 | La búsqueda combina similitud vectorial y texto completo. | Must |
| RF-05 | La búsqueda se limita a proyectos/carpetas accesibles. | Must |
| RF-06 | Los resultados incluyen fragmento, recurso, score y enlace. | Must |
| RF-07 | La indexación se encola al crear/editar/borrar un recurso. | Must |
| RF-08 | Un job de reindexación permite reconstruir un proyecto. | Must |
| RF-09 | Si el proveedor de embeddings falla, se usa búsqueda léxica con aviso. | Should |
| RF-10 | Se indexan Markdown, transcripciones y texto de cuestionarios. | Must |
| RF-11 | Los filtros por origen/validación se aplican después de recuperar. | Must |
| RF-12 | No se indexan recursos sin permisos o vacíos. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La búsqueda responde en menos de 2 segundos con 10 000 chunks. | Prueba de carga. |
| RNF-02 | Los embeddings usan una abstracción de proveedor configurable. | Test de factory. |
| RNF-03 | La reindexación es idempotente y reintentable. | Test de job. |
| RNF-04 | Los resultados respetan permisos en servidor. | Tests de acceso cruzado. |
| RNF-05 | La UI muestra carga, vacío y error. | Revisión visual. |

## 6. Criterios de aceptación

### CA-01 · Indexación de apunte

- **Dado** un apunte Markdown,
- **cuando** se crea o edita,
- **entonces** se encola su indexación y se generan chunks con embeddings.

### CA-02 · Búsqueda semántica

- **Dado** un proyecto con apuntes indexados,
- **cuando** el usuario busca una paráfrasis,
- **entonces** recibe resultados relevantes con fragmento y recurso.

### CA-03 · Permisos

- **Dado** un usuario sin acceso a un proyecto privado,
- **cuando** busca,
- **entonces** no aparecen recursos de ese proyecto.

### CA-04 · Filtros

- **Dado** resultados de varios tipos,
- **cuando** el usuario filtra por `MARKDOWN` y `VERIFIED`,
- **entonces** solo ve esos resultados.

### CA-05 · Reindexación

- **Dado** un proyecto con índice desactualizado,
- **cuando** el Owner solicita reindexar,
- **entonces** se reconstruyen los chunks y la búsqueda refleja el contenido actual.

### CA-06 · Fallback léxico

- **Dado** un fallo del proveedor de embeddings,
- **cuando** el usuario busca,
- **entonces** recibe resultados léxicos con aviso de modo degradado.

### CA-07 · Borrado

- **Dado** un recurso eliminado,
- **cuando** se busca,
- **entonces** sus chunks ya no aparecen.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/projects/:id/search` | Viewer+ | `?q=&folderId=&kind=&origin=&validationStatus=` | Resultados |
| `POST` | `/api/v1/projects/:id/search/reindex` | Owner/Editor | — | `202 Job` |
| `GET` | `/api/v1/projects/:id/search/status` | Owner/Editor | — | Estado de indexación |

### Datos

- `ResourceChunk`: `resourceId`, `chunkIndex`, `content`, `embedding vector(n)`, `tokens`, `metadata`.
- Índice HNSW/IVFFlat para embeddings e índice GIN para texto completo.
- `ContentIndexJob`: recurso, estado, error, timestamps.
- Configuración: `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `SEARCH_TOP_K`.

### UI

- Barra de búsqueda en proyecto y carpeta.
- Resultados con fragmento resaltado y enlace al recurso.
- Filtros por tipo, origen y validación.
- Aviso de modo léxico si falla el proveedor.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Query vacía | Rechazar | `SEARCH_QUERY_REQUIRED` · 422 |
| Query demasiado larga | Rechazar | `SEARCH_QUERY_TOO_LONG` · 422 |
| Sin resultados | Devolver lista vacía | `200` |
| Proveedor de embeddings caído | Fallback léxico con aviso | `200` |
| Recurso sin texto extraíble | No indexar; registrar motivo | `200` |
| Reindexación en curso | Evitar duplicados | `409 INDEX_IN_PROGRESS` |
| Proyecto archivado sin acceso | No buscar | `403` |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | `pgvector` en PostgreSQL para embeddings. | Cerrada |
| D-02 | Embeddings a través del servicio de agentes con factory de proveedor. | Cerrada |
| D-03 | Indexación v1: Markdown, transcripciones y texto de cuestionarios. | Cerrada |
| D-04 | Búsqueda híbrida con fallback léxico. | Cerrada |
| Q-01 | ¿Se indexarán PDFs cuando exista extracción? | Abierta (futuro) |
| Q-02 | ¿Se añadirá búsqueda generativa con citas? | Abierta (futuro) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin extracción de PDFs. | Los PDFs no son buscables semánticamente. | `T-060` |
| G-02 | Sin OCR. | Las imágenes no aportan texto. | `T-061` |

| G-03 | Sin búsqueda generativa con citas. | Solo recuperación de fragmentos. | `T-062` |
## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01–CA-02 | Reindexación y búsqueda híbrida de “sprint” con fragmento y recurso. | 2026-11-18 |
| CA-03–CA-04 | Permisos y filtros aplicados en servidor. | 2026-11-18 |
| CA-05–CA-07 | Reindexación, fallback léxico y borrado por cascada implementados. | 2026-11-18 |

> Plan y tareas: [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md).

> Diagramas: [UC-24](../../diagramas/casos-de-uso.md) · [Secuencia 024](../../diagramas/secuencia/024-busqueda-semantica.md).
