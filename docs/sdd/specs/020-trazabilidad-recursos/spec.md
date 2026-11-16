# Spec 020 · Trazabilidad y validación de recursos

| Campo | Valor |
|---|---|
| ID | `020` |
| Estado | `Borrador` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `005`, `009`, `010`, `012`, `017` |

## 1. Contexto y problema

Los recursos actuales no declaran de dónde vienen ni si son confiables. Un apunte puede ser escrito a mano, transcrito de un audio, estructurado por IA o generado como cuestionario. Un mapa mental puede derivar de varios apuntes. Sin trazabilidad, el estudiante no sabe qué es original, qué es generado y qué ha revisado el docente.

## 2. Objetivo

> Como **participante**, quiero **ver el origen y el estado de validación de cada recurso** para **distinguir material original, derivado, generado por IA o validado por el docente**.

## 3. Alcance

### Incluye

- Origen del recurso: subida, apunte, transcripción, estructuración IA, mapa mental IA, cuestionario IA o importación.
- Cadena de recursos fuente, incluyendo múltiples fuentes.
- Estado de validación: no verificado, pendiente, verificado o rechazado.
- Validación por Owner/Editor con motivo.
- Badges y filtros en la UI.
- Advertencia en recursos derivados de fuentes no validadas.
- Auditoría de cambios de validación.

### No incluye

- Verificación automática de fuentes externas.
- Firmas digitales o blockchain.
- Validación por estudiantes.
- Historial completo de versiones del contenido; solo metadatos de origen.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | `Resource.origin` identifica cómo se creó el recurso. | Must |
| RF-02 | `ResourceSource` permite declarar una o varias fuentes. | Must |
| RF-03 | `Resource.validationStatus` inicia en `UNVERIFIED`. | Must |
| RF-04 | Owner/Editor puede marcar un recurso como `VERIFIED` o `REJECTED` con motivo. | Must |
| RF-05 | La validación registra validador y fecha. | Must |
| RF-06 | La UI muestra badges de origen y validación en listados y detalle. | Must |
| RF-07 | Se puede filtrar por origen y estado de validación. | Must |
| RF-08 | Un recurso derivado muestra advertencia si alguna fuente no está validada. | Should |
| RF-09 | Los recursos generados por IA nacen `UNVERIFIED`. | Must |
| RF-10 | El estado de validación no altera el contenido del recurso. | Must |
| RF-11 | Los cambios de validación se auditan. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La consulta de procedencia no debe degradar el listado. | Índices y prueba de carga. |
| RNF-02 | Los recursos sin fuentes se muestran como “origen propio”. | Test de contrato. |
| RNF-03 | Los permisos de validación se aplican en servidor. | Tests de acceso. |
| RNF-04 | La UI es accesible y usa badges con texto, no solo color. | Revisión visual. |
| RNF-05 | La procedencia se conserva al mover o renombrar recursos. | Test de integridad. |

## 6. Criterios de aceptación

### CA-01 · Origen de subida

- **Dado** un archivo subido,
- **cuando** se consulta su detalle,
- **entonces** muestra `UPLOAD`, autor y fecha.

### CA-02 · Origen de transcripción

- **Dado** un apunte creado desde una transcripción,
- **cuando** se abre su procedencia,
- **entonces** muestra el audio fuente y el job de transcripción.

### CA-03 · Múltiples fuentes

- **Dado** un mapa mental generado desde tres apuntes,
- **cuando** se consulta su procedencia,
- **entonces** muestra las tres fuentes enlazadas.

### CA-04 · Validación

- **Dado** un recurso `UNVERIFIED`,
- **cuando** el docente lo marca `VERIFIED` con un comentario,
- **entonces** se guarda el estado, el validador y la fecha.

### CA-05 · Rechazo

- **Dado** un recurso con errores,
- **cuando** el docente lo marca `REJECTED` con motivo,
- **entonces** el recurso sigue visible con advertencia y el motivo.

### CA-06 · Filtro

- **Dado** una carpeta con recursos de varios orígenes,
- **cuando** el usuario filtra por `AI_MINDMAP` y `UNVERIFIED`,
- **entonces** solo ve los recursos que cumplen ambos criterios.

### CA-07 · Derivado de fuente no validada

- **Dado** un cuestionario generado desde un apunte `UNVERIFIED`,
- **cuando** se abre el cuestionario,
- **entonces** muestra una advertencia con enlace a la fuente.

### CA-08 · Permisos

- **Dado** un estudiante sin rol de edición,
- **cuando** intenta validar un recurso,
- **entonces** recibe `403 PROJECT_ROLE_REQUIRED`.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/files/:fileId/provenance` | Viewer+ | — | Recurso, origen y fuentes |
| `POST` | `/api/v1/files/:fileId/validate` | Owner/Editor | `{ status, note? }` | `Resource` |
| `GET` | `/api/v1/folders/:folderId/files` | Viewer+ | `?origin=&validationStatus=` | Lista filtrada |

### Datos

- `Resource.origin: ResourceOrigin`.
- `Resource.validationStatus: ValidationStatus`.
- `Resource.validatedById?`, `validatedAt?`, `validationNote?`.
- `ResourceSource`: `resourceId`, `sourceResourceId`, `relation`.
- `AuditEvent` para validaciones.

### UI

- Badge de origen: subida, apunte, transcripción, IA.
- Badge de validación: no verificado, pendiente, verificado, rechazado.
- Panel lateral de procedencia con enlaces a fuentes.
- Filtros en la barra de carpeta.
- Advertencia en recursos derivados.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Fuente eliminada | Mostrar “fuente eliminada” sin romper | `200` con referencia nula |
| Recurso sin origen | Asumir `UPLOAD` o `NOTE` según tipo | `200` |
| Validar recurso ajeno | Rechazar | `403 PROJECT_ROLE_REQUIRED` |
| Cambiar a `PENDING` sin revisor | Rechazar | `INVALID_VALIDATION_STATUS` · 422 |
| Ciclo de fuentes | Rechazar en creación | `RESOURCE_SOURCE_CYCLE` · 422 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | `Resource.origin` y `ResourceSource` modelan la procedencia. | Cerrada |
| D-02 | Los recursos generados por IA nacen `UNVERIFIED`. | Cerrada |
| D-03 | Owner/Editor pueden validar; estudiantes no. | Cerrada |
| D-04 | La validación no modifica el contenido. | Cerrada |
| Q-01 | ¿Se permitirá validar una versión concreta del recurso? | Abierta (v1: estado global) |
| Q-02 | ¿Se notificará al autor cuando se rechaza? | Abierta (v1: no) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin historial de versiones de contenido. | La validación aplica al recurso actual. | `T-060` |
| G-02 | Sin verificación externa automática. | La confianza depende del docente. | `T-061` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| — | Pendiente de implementación. | — |

> Plan y tareas: se crearán cuando esta spec pase a `Aprobada`.
