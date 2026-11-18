# Spec 028 · Cola de generación y prevención de duplicados

| Campo | Valor |
|---|---|
| ID | `028` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-18` |
| Origen | Requisito de producto: visibilidad de generaciones en curso y evitar trabajo duplicado entre integrantes |
| Dependencias | `017`, `021`, `022`, `027` |

## 1. Contexto y problema

La generación de mapas mentales y cuestionarios es asíncrona y hoy solo la ve la persona que abrió el diálogo. Los demás integrantes del proyecto no saben que otro compañero ya pidió un cuestionario o un mapa mental. Como resultado, dos editores pueden generar el mismo recurso en paralelo, duplicar el trabajo, consumir tokens y crear recursos repetidos.

El proyecto necesita una vista compartida de la cola de generaciones activas y una protección en servidor para impedir duplicados exactos.

## 2. Objetivo

> Como **Owner o Editor de un proyecto**, quiero **ver las generaciones que están en curso y saber quién las pidió**, para **evitar solicitar de nuevo el mismo material y coordinar el trabajo del equipo**.

Además, el servidor debe impedir que se cree un job idéntico mientras otro esté activo.

## 3. Alcance

### Incluye

- Endpoint de cola de generaciones activas por proyecto.
- Panel de cola visible en el workspace del proyecto para Owner/Editor.
- Polling periódico mientras haya jobs activos.
- Información de tipo, solicitante, carpeta destino, fuentes, estado, etapa y progreso.
- Prevención de duplicados exactos en servidor mediante una clave activa única.
- Aviso en el diálogo de generación cuando ya existe un job activo compatible.
- Limpieza de la clave activa al terminar o fallar.
- Reintento seguro de jobs fallidos.
- Estado vacío y estado de error.
- Permisos: solo Owner/Editor.

### No incluye

- Tiempo real con WebSocket o SSE; se usa polling.
- Cancelación de jobs desde la UI.
- Notificaciones push o email.
- Cola entre proyectos distintos.
- Historial completo de generaciones en el panel.
- Generación desde la app móvil.
- Cambios en el algoritmo de generación.
- Publicación automática de recursos.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El proyecto muestra una cola de generaciones activas a Owner/Editor. | Must |
| RF-02 | La cola se actualiza automáticamente mientras haya jobs activos. | Must |
| RF-03 | Cada item muestra tipo (`MINDMAP`/`QUIZ`), solicitante, carpeta destino, cantidad de fuentes, estado, etapa y fecha de inicio. | Must |
| RF-04 | La cola muestra el progreso cuando el job lo informa. | Should |
| RF-05 | La cola se oculta o muestra un estado vacío cuando no hay jobs activos. | Must |
| RF-06 | El servidor impide crear un job idéntico si ya existe uno `QUEUED` o `PROCESSING`. | Must |
| RF-07 | La identidad del job incluye tipo, carpeta destino, fuente y configuración de generación. | Must |
| RF-08 | La prevención de duplicados es segura ante dos peticiones simultáneas. | Must |
| RF-09 | Al terminar o fallar un job, su clave activa se libera. | Must |
| RF-10 | Un reintento vuelve a ocupar la clave activa y respeta la prevención de duplicados. | Must |
| RF-11 | El diálogo de generación advierte si ya hay un job activo para la misma fuente, tipo y carpeta. | Should |
| RF-12 | El diálogo deshabilita la creación cuando el job sería exactamente duplicado. | Must |
| RF-13 | Generar con otra configuración, otro tipo u otra fuente sigue permitido. | Must |
| RF-14 | Un Viewer o Student no puede consultar la cola ni crear jobs. | Must |
| RF-15 | La cola no muestra contenido de archivos ni datos sensibles; solo metadatos. | Must |
| RF-16 | Un job fallido desaparece de la cola activa y el diálogo que lo inició muestra el error. | Must |
| RF-17 | La cola no bloquea la navegación ni la lista de recursos. | Must |
| RF-18 | El panel muestra “Sin generaciones en curso” o se oculta cuando la cola está vacía. | Should |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El polling usa un intervalo de 3 segundos mientras el panel está montado y se detiene al desmontar. | Test de componente y revisión de red. |
| RNF-02 | La consulta de cola usa índices y no genera N+1. | Revisión de Prisma y prueba con varios jobs. |
| RNF-03 | El panel es accesible: estados con texto, no solo color, y sin bloquear el foco. | Revisión visual y teclado. |
| RNF-04 | La cola respeta el tema claro/oscuro. | Revisión visual. |
| RNF-05 | La creación duplicada devuelve un error claro con el `jobId` existente. | Test de contrato. |
| RNF-06 | La restricción única no deja jobs bloqueados si el proceso falla. | Test de finalización y fallo. |
| RNF-07 | El panel no se renderiza para roles sin permiso. | Test de permisos. |
| RNF-08 | La consulta no expone nombres de archivos de proyectos inaccesibles. | Test de permisos. |

## 6. Criterios de aceptación

### CA-01 · Cola visible

- **Dado** un Editor A que inicia una generación,
- **cuando** el Editor B abre el proyecto,
- **entonces** ve el job activo con el nombre del solicitante y el tipo de generación.

### CA-02 · Actualización automática

- **Dado** un job activo en la cola,
- **cuando** cambia de `QUEUED` a `PROCESSING` o a `DONE`,
- **entonces** el panel se actualiza sin recargar la página.

### CA-03 · Duplicado exacto bloqueado

- **Dado** un job activo para el mismo tipo, carpeta, fuente y configuración,
- **cuando** otro editor intenta crear uno idéntico,
- **entonces** recibe `409 GENERATION_JOB_IN_PROGRESS` con el `jobId` existente.

### CA-04 · Configuración distinta permitida

- **Dado** un job activo de cuestionario con 10 preguntas,
- **cuando** otro editor solicita 20 preguntas de la misma fuente,
- **entonces** el nuevo job se permite y la UI lo advierte.

### CA-05 · Tipo distinto permitido

- **Dado** un mapa mental activo,
- **cuando** se solicita un cuestionario de la misma fuente,
- **entonces** ambos jobs coexisten.

### CA-06 · Fin de job

- **Dado** un job que termina `DONE`,
- **cuando** otro editor consulta la cola,
- **entonces** el job ya no aparece como activo y la clave queda libre.

### CA-07 · Fallo y reintento

- **Dado** un job `FAILED`,
- **cuando** se reintenta,
- **entonces** vuelve a `QUEUED` y la cola lo muestra de nuevo.

### CA-08 · Permisos

- **Dado** un Viewer o Student,
- **cuando** consulta la cola o intenta generar,
- **entonces** recibe `403 PROJECT_FORBIDDEN`.

### CA-09 · Carrera de creación

- **Dado** dos peticiones idénticas simultáneas,
- **cuando** ambas llegan al servidor,
- **entonces** solo una crea el job y la otra recibe el `jobId` existente.

### CA-10 · Cola vacía

- **Dado** un proyecto sin generaciones activas,
- **cuando** se abre el workspace,
- **entonces** no se muestra una lista vacía confusa; se muestra un estado vacío discreto o se oculta el panel.

### CA-11 · Error visible

- **Dado** un job que falla,
- **cuando** el solicitante vuelve al diálogo,
- **entonces** ve el código/mensaje de error y puede reintentar.

### CA-12 · Sin contenido sensible

- **Dado** un job activo,
- **cuando** otro editor ve la cola,
- **entonces** solo ve metadatos, no el contenido de los archivos ni prompts.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/projects/:projectId/generation-jobs?active=true&limit=20` | Editor+ | `active`, `limit` | Lista de jobs activos |
| `GET` | `/api/v1/generation-jobs/:generationJobId` | Editor+ | — | Estado, etapa, warnings y resultado |

Respuesta de la cola:

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

### Datos

`ContentGenerationJob` añade:

```prisma
sourceType String?
sourceId   String?
activeKey  String? @unique
```

`activeKey` es un hash de:

```text
type + folderId + sourceType + sourceId + configuración canónica
```

Se calcula al crear o reintentar y se limpia al pasar a `DONE` o `FAILED`.

Índices:

```prisma
@@index([folderId, status])
@@index([activeKey])
```

### UI

- Componente `GenerationQueue` en el workspace del proyecto.
- Hook `useGenerationQueue(projectId)` con React Query.
- El panel se coloca en la columna central, encima del contenido de la carpeta.
- Muestra un encabezado compacto, items y estado vacío.
- El diálogo de generación consulta la cola para advertir o deshabilitar duplicados exactos.
- No se muestra para Viewer/Student.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Duplicado exacto | Rechazar con job existente | `GENERATION_JOB_IN_PROGRESS` · 409 |
| Dos peticiones simultáneas | Una gana; la otra recibe 409 | `GENERATION_JOB_IN_PROGRESS` · 409 |
| Job falla | Liberar clave y permitir reintento | `200` con estado `FAILED` |
| Reintento duplicado | Rechazar si otro job idéntico está activo | `GENERATION_JOB_IN_PROGRESS` · 409 |
| Sin jobs activos | Lista vacía o panel oculto | `200` |
| Proyecto inexistente | Rechazar | `PROJECT_NOT_FOUND` · 404 |
| Sin permisos | Rechazar | `PROJECT_FORBIDDEN` · 403 |
| Job eliminado por cascada | No romper la cola | `200` sin el item |
| Configuración no serializable | No crear job | `INVALID_QUIZ_CONFIG` · 422 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Polling cada 3 s en lugar de WebSocket/SSE. | Cerrada |
| D-02 | La cola muestra solo jobs activos; el historial queda fuera. | Cerrada |
| D-03 | Se bloquea solo el duplicado exacto; configuraciones distintas se permiten con aviso. | Cerrada |
| D-04 | La prevención se implementa con `activeKey` único en base de datos. | Cerrada |
| D-05 | La cola es solo web y solo Owner/Editor. | Cerrada |
| D-06 | No se añade cancelación en v1. | Cerrada |
| Q-01 | ¿Se mostrarán jobs completados recientes en el panel? | Abierta (v1: no) |
| Q-02 | ¿Se añadirá cancelación de jobs? | Abierta (v1: no) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin tiempo real; la cola puede tardar hasta 3 s en reflejar cambios. | Pequeño retraso visual. | `T-090` |
| G-02 | Sin cancelación de jobs. | Un job lanzado por error debe esperar o fallar. | `T-091` |
| G-03 | Sin notificaciones push/email. | Los integrantes deben abrir el proyecto. | `T-092` |
| G-04 | Sin historial de generaciones en el panel. | No se audita desde la UI; queda en la spec 020. | `T-093` |
| G-05 | Sin cola en móvil. | La coordinación queda limitada a la web. | `T-094` |
| G-06 | Sin cola entre proyectos. | Cada proyecto se coordina por separado. | `T-095` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01 | Un segundo Editor consultó la cola y vio el job iniciado por Multi Test con su nombre. | 2026-11-18 |
| CA-02 | El panel pasó de “En cola” a “Generando” y actualizó el progreso por polling. | 2026-11-18 |
| CA-03 | Segunda petición idéntica devolvió 409 con el `jobId` existente, tanto para el Owner como para el Editor. | 2026-11-18 |
| CA-04 | La clave de deduplicación distingue configuraciones; test unitario de `buildActiveKey`. | 2026-11-18 |
| CA-05 | La clave incluye el tipo; un mapa mental y un cuestionario pueden coexistir. | 2026-11-18 |
| CA-06 | Al terminar el job, `activeKey` quedó `null` y el job desapareció de la cola activa. | 2026-11-18 |
| CA-07 | El job fallido limpió `activeKey`; el diálogo muestra el error y permite reintentar. | 2026-11-18 |
| CA-08 | El endpoint exige rol Editor+; el Editor agregado pudo consultar, el no miembro recibió 403. | 2026-11-18 |
| CA-09 | Restricción única `activeKey` + test unitario de clave canónica. | 2026-11-18 |
| CA-10 | El panel no se renderiza cuando no hay jobs activos. | 2026-11-18 |
| CA-11 | Job fallido visible en el diálogo del solicitante con error y reintento. | 2026-11-18 |
| CA-12 | La cola solo expone metadatos, solicitante, carpeta y fuentes; no contenido ni prompts. | 2026-11-18 |
| RNF-01–RNF-08 | Polling de 3 s, índice `[folderId,status]`, permisos y gates de calidad correctos. | 2026-11-18 |
