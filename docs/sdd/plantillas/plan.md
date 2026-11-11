# Plan · <título corto del cambio>

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Borrador` \| `Aprobado` \| `En ejecución` \| `Completado` |
| Fecha | `AAAA-MM-DD` |
| Autor | <nombre> |

## 1. Resumen de la solución

<Enfoque técnico en 3–6 frases. Debe ser suficiente para entender cómo se satisface la spec sin leer el código.>

## 2. Contexto técnico actual

<Módulos, componentes, endpoints y decisiones existentes que se reutilizan. Enlaza a los archivos relevantes.>

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | <…> | <…> | <…> |
| D-02 | <…> | <…> | <…> |

## 4. Cambios por capa

### Datos

- <Modelos, campos, índices, migración de Prisma.>
- <Rollback: cómo revertir.>

### Backend

- <Módulos, controladores, servicios, DTOs, guards.>
- <Contratos y códigos de error.>

### Frontend

- <Rutas, componentes, hooks, estados y validaciones.>
- <Integración con el cliente API y React Query.>

### Infraestructura

- <Variables de entorno, Docker, MinIO, colas, dependencias nuevas.>
- <Si no hay cambios, indicarlo.>

## 5. Contratos

<Requests/responses de ejemplo, tipos TypeScript compartidos o enlaces a Swagger.>

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Unitario | <…> | Vitest |
| E2E | <…> | Vitest e2e / Playwright |
| Manual | <…> | Navegador |

<Incluye casos de permisos, errores y sanitización.>

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| <…> | Alta/Media/Baja | Alto/Medio/Bajo | <…> |

## 8. Rollback

<Cómo volver al estado anterior: revertir código, migración, variables de entorno y datos. Indica qué información se conserva o se pierde.>

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `ruta/al/archivo` | <Crear / modificar / eliminar> |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01 | `T-…` |
| CA-01 | `T-…` |
