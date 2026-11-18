# Plan 028 · Cola de generación y prevención de duplicados

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | `2026-11-18` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se añade una vista de cola de generaciones activas por proyecto para Owner/Editor. NestJS expone los jobs `QUEUED`/`PROCESSING` con solicitante, carpeta, fuentes y etapa. La web los muestra en el workspace y los refresca por polling. Para evitar duplicados, cada job recibe un `activeKey` único calculado a partir del tipo, carpeta destino, fuente y configuración; la clave se libera al terminar o fallar. El diálogo de generación consulta la cola y deshabilita duplicados exactos.

## 2. Contexto técnico actual

- `ContentGenerationJob` guarda `type`, `folderId`, `requestedById`, `sources`, `config`, `status` y resultados, pero no la fuente original ni una clave de deduplicación.
- `ContentGenerationController` solo permite consultar un job por ID; no lista jobs por proyecto.
- `ProjectAccessGuard` resuelve `projectId` y aplica `@RequireProjectRole('editor')`.
- `GenerationDialog` inicia jobs y hace polling individual; no conoce otros jobs del proyecto.
- El workspace del proyecto está en `app/projects/[projectId]/(workspace)/layout.tsx` y la página principal en `page.tsx`.
- React Query ya se usa para datos y polling.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | Polling cada 3 s | WebSocket/SSE | Menor complejidad; el volumen de jobs es bajo |
| D-02 | `activeKey` único en `ContentGenerationJob` | Consulta previa sin restricción | Evita carreras entre peticiones simultáneas |
| D-03 | Bloquear solo duplicado exacto | Bloquear cualquier job del mismo tipo/fuente | Permite configuraciones legítimas distintas |
| D-04 | Cola solo activa | Historial completo | Mantiene el panel compacto; el historial ya existe en datos |
| D-05 | Cola solo Owner/Editor | Visible para todos | Los roles sin permiso no generan |
| D-06 | Panel en el workspace, no en una ruta nueva | Página dedicada | La coordinación debe estar donde se genera |
| D-07 | Sin cancelación en v1 | Cancelar jobs | Requiere cooperación del worker y limpieza adicional |

## 4. Cambios por capa

### Datos

- Añadir a `ContentGenerationJob`:
  - `sourceType String?`
  - `sourceId String?`
  - `activeKey String? @unique`
- Añadir índice `@@index([folderId, status])`.
- Migración Prisma.
- Rollback: eliminar los campos e índice; los jobs existentes siguen funcionando. Las claves activas se pierden, pero no hay datos de negocio.

### Backend NestJS

- `ContentGenerationService.createJob()`:
  - guarda `sourceType` y `sourceId`;
  - calcula `activeKey` canónico;
  - captura violación de unicidad y busca el job activo existente;
  - devuelve `GENERATION_JOB_IN_PROGRESS` con `details.jobId`.
- `ContentGenerationService.process()`:
  - limpia `activeKey` al pasar a `DONE` o `FAILED`;
  - mantiene la clave mientras está `QUEUED`/`PROCESSING`.
- `retry()`:
  - vuelve a calcular/ocupar `activeKey`;
  - si hay otro job idéntico activo, devuelve 409.
- Nuevo método `listActiveByProject(projectId, userId, limit)`:
  - valida rol Editor+;
  - filtra `status in ['QUEUED','PROCESSING']`;
  - incluye `requestedBy`, `folder` y `sources`;
  - devuelve metadatos, no contenido.
- Nuevo endpoint `GET /projects/:projectId/generation-jobs` con `@RequireProjectRole('editor')`.
- DTO de query `active`, `limit`.
- `getJob()` incluye `requestedBy` para el diálogo y la cola.
- Códigos nuevos:
  - `GENERATION_JOB_IN_PROGRESS` 409;
  - `INVALID_GENERATION_SOURCE` 422 si faltan `sourceType`/`sourceId`.

### Frontend

- Hook `useGenerationQueue(projectId)`:
  - `queryKey: ['generation-queue', projectId]`;
  - `refetchInterval: 3000` si hay jobs activos; si no, sin polling;
  - `staleTime` corto.
- Componente `GenerationQueue`:
  - tarjeta compacta en la columna central del workspace;
  - muestra tipo, solicitante, carpeta, cantidad de fuentes, estado, etapa y progreso;
  - badges y avatar;
  - estado vacío discreto o se oculta;
  - no bloquea el scroll.
- Integración en `app/projects/[projectId]/(workspace)/layout.tsx`, encima de `children`.
- `GenerationDialog`:
  - consulta la cola del proyecto al abrirse;
  - si hay job idéntico, muestra el solicitante y deshabilita “Generar”;
  - si hay job del mismo tipo/fuente pero configuración distinta, muestra aviso y permite continuar;
  - al recibir 409, muestra el job existente.
- Tipos en `lib/types.ts`: `GenerationQueueItem`, `GenerationQueueResponse`, `stage`, `progress`, `sourceType`, `sourceId`, `activeKey` (si se expone).
- No se muestra para Viewer/Student.

### Infraestructura

- No hay servicios nuevos.
- Se reutiliza pg-boss y la cola actual.
- No se añaden variables de entorno obligatorias; `GENERATION_QUEUE_POLL_MS` puede ser opcional.

## 5. Contratos

```http
GET /api/v1/projects/:projectId/generation-jobs?active=true&limit=20
```

Respuesta:

```json
{
  "items": [
    {
      "id": "cuid",
      "type": "QUIZ",
      "status": "PROCESSING",
      "stage": "EXTRACTING",
      "progress": { "completed": 2, "total": 5 },
      "folder": { "id": "cuid", "name": "Unidad 1" },
      "requestedBy": {
        "id": "cuid",
        "username": "ana",
        "displayName": "Ana Pérez",
        "avatarUrl": null
      },
      "sourceType": "FOLDER",
      "sourceId": "cuid",
      "sourceCount": 5,
      "sourceNames": ["tema.pdf", "clase.docx"],
      "createdAt": "2026-11-18T10:00:00.000Z"
    }
  ]
}
```

Error de duplicado:

```json
{
  "code": "GENERATION_JOB_IN_PROGRESS",
  "message": "Ya hay una generación idéntica en curso",
  "details": { "jobId": "cuid" }
}
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Backend unitario | Cálculo de `activeKey`, limpieza, reintento y cola | Vitest |
| Backend contrato | Listado por proyecto y 409 de duplicado | Vitest + mock |
| Backend permisos | Editor sí; Viewer/Student no | Vitest |
| Base de datos | Restricción única y carrera de creación | Test de integración |
| Frontend | Render de cola, polling, estado vacío y aviso en diálogo | Playwright / test de componente |
| Manual | Dos navegadores con editores distintos | Navegador |

Incluye jobs `QUEUED`, `PROCESSING`, `DONE`, `FAILED`, configuraciones distintas y dos peticiones simultáneas.

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Clave activa no se libera por error | Media | Alto | Limpiar en `DONE` y `FAILED`; test de fallo |
| Carrera de creación | Baja | Alto | Restricción única en base de datos |
| Polling excesivo | Media | Bajo | 3 s y detener cuando no hay activos |
| Jobs antiguos bloquean la cola | Baja | Medio | Revisar jobs colgados y permitir reintento |
| Exposición de datos | Baja | Alto | Solo metadatos, permisos en servidor |
| UI duplicada en varias rutas | Baja | Bajo | Componente único en el layout |

## 8. Rollback

- Revertir código de backend y frontend.
- Eliminar campos `sourceType`, `sourceId` y `activeKey` si se revierte antes de producción.
- Los jobs existentes conservan su estado y resultados.
- La cola es solo lectura; desactivar el componente no afecta a la generación.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/prisma/schema.prisma` | Campos y índice de deduplicación |
| `infinipaper-backend/prisma/migrations/*` | Migración |
| `infinipaper-backend/src/modules/content-generation/content-generation.service.ts` | `activeKey`, cola, reintento y limpieza |
| `infinipaper-backend/src/modules/content-generation/content-generation.controller.ts` | Endpoint de cola |
| `infinipaper-backend/src/modules/content-generation/dto/content-generation.dto.ts` | Query de cola |
| `infinipaper-backend/src/modules/content-generation/content-generation.module.ts` | Sin cambios o provider auxiliar |
| `infinipaper-frontend/components/generation/generation-queue.tsx` | Nuevo componente |
| `infinipaper-frontend/components/generation/generation-dialog.tsx` | Aviso y bloqueo de duplicados |
| `infinipaper-frontend/app/projects/[projectId]/(workspace)/layout.tsx` | Integración del panel |
| `infinipaper-frontend/lib/types.ts` | Tipos de cola |
| `docs/sdd/specs/028-*` | Spec, plan y tareas |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01–RF-05 | `T-023`, `T-024`, `T-025`, `T-030`, `T-031`, `T-040` |
| RF-06–RF-10 | `T-010`, `T-011`, `T-021`, `T-022`, `T-041` |
| RF-11–RF-13 | `T-033`, `T-034`, `T-035`, `T-042` |
| RF-14 | `T-023`, `T-036`, `T-043` |
| RF-15 | `T-024`, `T-044` |
| RF-16–RF-18 | `T-026`, `T-027`, `T-031`, `T-034`, `T-045` |
| G-01–G-06 | `T-090`–`T-095` |
