# Plan 024 · Procesamiento semántico y búsqueda

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado` |
| Fecha | `2026-11-18` |

## 1. Resumen

Se habilita `pgvector` en PostgreSQL, se añaden `ResourceChunk` y `ContentIndexJob`, y un pipeline de indexación asíncrona con chunking y embeddings. La búsqueda combina similitud vectorial con ranking léxico y cae a léxico si el proveedor falla.

## 2. Decisiones

| ID | Decisión | Motivo |
|---|---|---|
| D-01 | Imagen `pgvector/pgvector:pg17` y extensión `vector`. | Cumple la spec sin un servicio vectorial extra. |
| D-02 | Embeddings con abstracción `local`/`openai-compatible`. | Desarrollo reproducible y proveedor real configurable. |
| D-03 | Índice HNSW + GIN para texto. | Rendimiento de búsqueda. |
| D-04 | Fallback léxico. | La búsqueda sigue funcionando si el proveedor falla. |
| D-05 | v1 indexa Markdown, transcripciones, quiz y mapas. | Fuentes de texto disponibles. |

## 3. Cambios

- Extensión `pgvector`, `ResourceChunk` con `vector(1536)`, `ContentIndexJob`.
- `EmbeddingsService`, `SearchService`, cola `content-index` y worker.
- Endpoints de búsqueda, reindexación y estado.
- UI de búsqueda con filtros y aviso de modo léxico.
- Encolado al crear/editar recursos, quizzes y transcripciones.

## 4. Pruebas

- E2E: reindexación, búsqueda híbrida y resultado con fragmento.
- Build/lint/tests.
- Verificación de extensión e índices en PostgreSQL.

## 5. Rollback

Revierte la migración de chunks/jobs. La imagen de PostgreSQL puede volver a `postgres:17-alpine` si no se usan embeddings.
