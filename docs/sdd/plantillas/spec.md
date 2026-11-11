# Spec · <título corto del cambio>

| Campo | Valor |
|---|---|
| ID | `NNN` |
| Estado | `Borrador` \| `Aprobada` \| `En implementación` \| `Implementada` \| `Implementada con brechas` \| `Obsoleta` |
| Autor | <nombre> |
| Fecha | `AAAA-MM-DD` |
| Origen | <HU, incidencia, petición o enlace> |
| Dependencias | <specs, módulos o HUs> |

## 1. Contexto y problema

<Qué situación existe hoy, a quién afecta y por qué merece un cambio. Evita describir la solución.>

## 2. Objetivo

> Como **<rol>**, quiero **<capacidad>** para **<beneficio>**.

<Resultado esperado en una o dos frases.>

## 3. Alcance

### Incluye

- <Comportamiento o capacidad incluida.>

### No incluye

- <Lo que queda explícitamente fuera de esta spec.>

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | <Comportamiento observable y verificable.> | Must / Should / Could |
| RF-02 | <…> | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | <Rendimiento, seguridad, accesibilidad, compatibilidad…> | <Test, revisión o métrica> |
| RNF-02 | <…> | <…> |

## 6. Criterios de aceptación

> Formato Dado / Cuando / Entonces. Un criterio por escenario relevante, incluidos permisos y errores.

### CA-01 · <nombre>

- **Dado** <contexto>,
- **cuando** <acción>,
- **entonces** <resultado observable>.

### CA-02 · <nombre>

- **Dado** <contexto>,
- **cuando** <acción>,
- **entonces** <resultado observable>.

## 7. Contratos e interfaces

### API

| Método | Ruta | Rol | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/v1/...` | Viewer+ | <parámetros> | <forma> |

### Datos

<Modelos, campos, índices o migraciones implicadas. Si no hay cambios, indicarlo.>

### UI

<Pantallas, componentes, estados de carga/vacío/error y navegación.>

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| <…> | <…> | <…> |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | <Decisión tomada y motivo.> | Cerrada |
| Q-01 | <Pregunta pendiente.> | Abierta |

## 10. Brechas conocidas

> Solo si la implementación no cubre todo lo especificado. Cada brecha debe tener tarea o aceptación explícita.

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | <Qué falta o difiere.> | <Consecuencia> | `T-…` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01 | <test, comando, captura o verificación manual> | `AAAA-MM-DD` |
