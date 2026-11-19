# Secuencia 028 · Cola de generación y duplicados

> Spec: [028-cola-generacion](../../specs/028-cola-generacion/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor / Owner
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant Q as pg-boss

  E->>FE: Abre el proyecto
  FE->>API: GET /projects/:id/generation-jobs?active=true
  API->>DB: Consulta jobs QUEUED y PROCESSING
  API-->>FE: Items con tipo, solicitante, etapa y progreso
  FE-->>E: Render de la cola o estado vacío

  E->>FE: Solicita una generación
  FE->>API: POST /folders/:id/mindmaps o /quizzes/generate
  API->>DB: Calcula activeKey y busca un duplicado

  alt Duplicado exacto en curso
    API-->>FE: 409 GENERATION_JOB_IN_PROGRESS
    FE-->>E: Avisa y deshabilita la creación
  else Sin duplicado activo
    API->>DB: Crea ContentGenerationJob QUEUED + activeKey
    API->>Q: Encola el job
    API-->>FE: Job creado
  end

  Q->>API: Worker toma el job
  API->>DB: Actualiza stage y progress
  loop Polling cada 3 segundos
    FE->>API: GET /projects/:id/generation-jobs?active=true
    API-->>FE: Estado actualizado
  end

  alt Job DONE o FAILED
    API->>DB: Libera activeKey y actualiza el estado
    FE->>API: Consulta la cola
    API-->>FE: El job ya no está activo
    FE-->>E: Desaparece de la cola o muestra el error
  end

  opt Reintento
    E->>FE: Reintenta el job
    FE->>API: POST /generation-jobs/:id/retry
    API->>DB: Recalcula activeKey y valida duplicados
    API-->>FE: Nuevo intento o 409 si sigue activo
  end
```

## Notas

- La cola solo muestra jobs activos y está disponible para Owner/Editor.
- Viewer y Student no pueden consultar la cola ni crear jobs.
- El polling se detiene al desmontar el panel o cuando no hay jobs activos.
- `activeKey` es único y se libera al pasar a `DONE` o `FAILED`.
- El panel no bloquea la navegación ni la lista de recursos.
