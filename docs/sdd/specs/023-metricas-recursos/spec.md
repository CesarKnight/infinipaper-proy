# Spec 023 · Métricas de uso de recursos

| Campo | Valor |
|---|---|
| ID | `023` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-15` |
| Origen | Requisitos de alcance académico aprobados el 2026-11-15 |
| Dependencias | `005`, `009`, `010`, `017`, `018`, `020` |

## 1. Contexto y problema

Hoy no se sabe qué recursos se consultan, cuáles se descargan ni cuáles se usan en evaluaciones. El docente no puede priorizar material ni detectar recursos ignorados.

El requisito pide métricas relacionadas con el uso de recursos académicos, respetando la privacidad del proyecto y sin exponer datos personales innecesarios.

## 2. Objetivo

> Como **docente o Owner**, quiero **ver métricas de uso de los recursos del proyecto** para **entender qué material es útil y mejorar el curso**.

## 3. Alcance

### Incluye

- Eventos de visualización, descarga, búsqueda y uso en cuestionarios.
- Registro del lado servidor cuando sea posible.
- Agregados por proyecto, recurso, tipo y periodo.
- Filtros y exportación CSV.
- Métricas de recursos individuales.
- Retención configurable.

### No incluye

- Tiempo de lectura por párrafo.
- Mapas de calor visuales.
- Analítica en tiempo real.
- Métricas de otros proyectos del mismo docente.
- Datos personales de estudiantes en exportaciones agregadas.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Se registra un evento al visualizar un recurso. | Must |
| RF-02 | Se registra un evento al descargar un recurso. | Must |
| RF-03 | Se registra un evento cuando un recurso aparece en una búsqueda. | Should |
| RF-04 | Se registra el uso de un recurso en un cuestionario. | Should |
| RF-05 | El docente/Owner ve agregados por proyecto y recurso. | Must |
| RF-06 | Puede filtrar por tipo, origen, validación y periodo. | Must |
| RF-07 | Puede exportar un CSV agregado. | Must |
| RF-08 | Las métricas respetan la privacidad del proyecto. | Must |
| RF-09 | Los estudiantes no ven métricas de otros. | Must |
| RF-10 | La retención de eventos es configurable. | Should |
| RF-11 | Los eventos no guardan contenido del recurso. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El registro no bloquea la entrega del recurso. | Test de latencia. |
| RNF-02 | Los eventos son idempotentes por petición cuando aplique. | Test de duplicados. |
| RNF-03 | Las consultas usan índices por proyecto/fecha. | Revisión de plan de consulta. |
| RNF-04 | La exportación no incluye emails ni nombres innecesarios. | Revisión de CSV. |
| RNF-05 | La UI muestra estados vacíos y errores. | Revisión visual. |

## 6. Criterios de aceptación

### CA-01 · Visualización

- **Dado** un recurso visible,
- **cuando** un usuario lo abre,
- **entonces** se registra un evento `VIEW` con recurso, proyecto y fecha.

### CA-02 · Descarga

- **Dado** un archivo descargable,
- **cuando** el usuario lo descarga,
- **entonces** se registra `DOWNLOAD`.

### CA-03 · Agregados

- **Dado** un proyecto con actividad,
- **cuando** el docente abre métricas,
- **entonces** ve visualizaciones, descargas y usuarios únicos por recurso.

### CA-04 · Filtros

- **Dado** un proyecto con varios tipos de recurso,
- **cuando** el docente filtra por `MINDMAP` y último mes,
- **entonces** solo se agregan esos recursos.

### CA-05 · Exportación

- **Dado** un filtro activo,
- **cuando** el docente exporta,
- **entonces** el CSV coincide con el filtro y no contiene datos personales innecesarios.

### CA-06 · Privacidad

- **Dado** un usuario ajeno al proyecto,
- **cuando** intenta ver métricas,
- **entonces** recibe `403` o `404`.

### CA-07 · Estudiante

- **Dado** un estudiante,
- **cuando** intenta ver métricas del proyecto,
- **entonces** no ve datos de otros estudiantes.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/projects/:id/usage` | Owner/Editor | `?from=&to=&kind=&origin=&validationStatus=` | Agregados |
| `GET` | `/api/v1/projects/:id/usage/export` | Owner/Editor | Filtros | CSV |
| `GET` | `/api/v1/files/:id/usage` | Owner/Editor | — | Métricas del recurso |

### Datos

- `ResourceEvent`: `resourceId`, `projectId`, `userId?`, `type`, `metadata`, `createdAt`.
- Enums `ResourceEventType`: `VIEW`, `DOWNLOAD`, `SEARCH_HIT`, `QUIZ_USE`.
- Índices por `projectId`, `resourceId`, `createdAt`.
- Retención `RESOURCE_EVENT_RETENTION_DAYS` (por defecto 365).

### UI

- Pestaña “Uso de recursos” en el panel del proyecto.
- Tarjetas y tabla por recurso.
- Filtros por tipo, origen, validación y fecha.
- Exportación CSV.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Evento duplicado | No contar dos veces la misma petición | `200` idempotente |
| Proyecto sin actividad | Mostrar estado vacío | `200` |
| Recurso eliminado | Mantener agregados históricos sin enlace | `200` |
| Filtro inválido | Rechazar | `INVALID_FILTER` · 422 |
| Exportación demasiado grande | Limitar | `EXPORT_TOO_LARGE` · 413 |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Registro del lado servidor para vistas y descargas. | Cerrada |
| D-02 | Agregados por proyecto, no por curso global. | Cerrada |
| D-03 | Retención por defecto de 365 días. | Cerrada |
| D-04 | Los eventos no almacenan contenido. | Cerrada |
| Q-01 | ¿Se medirá tiempo de permanencia? | Abierta (v1: no) |
| Q-02 | ¿Se permitirá exportar datos por estudiante? | Abierta (v1: solo agregados) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin tiempo de lectura. | Solo se mide apertura y descarga. | `T-060` |
| G-02 | Sin analítica en tiempo real. | Los agregados se calculan al consultar. | `T-061` |

| G-03 | Sin job automático de retención. | La purga debe invocarse explícitamente. | `T-062` |
## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01–CA-02 | Vistas y descargas registradas en E2E. | 2026-11-18 |
| CA-03–CA-05 | Agregados por recurso, filtros y CSV verificados. | 2026-11-18 |
| CA-06–CA-07 | Acceso restringido y datos agregados sin emails. | 2026-11-18 |

> Plan y tareas: [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md).

> Diagramas: [UC-23](../../diagramas/casos-de-uso.md) · [Secuencia 023](../../diagramas/secuencia/023-metricas-recursos.md).
