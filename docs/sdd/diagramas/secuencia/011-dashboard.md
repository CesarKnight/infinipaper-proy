# Secuencia 011 · Dashboard personal

> Spec: [011-dashboard](../../specs/011-dashboard/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL

  U->>FE: Abre /
  FE->>API: GET /api/v1/dashboard?limit=12
  API->>DB: Consulta proyectos propios, participados y públicos
  API->>DB: Calcula contadores por categoría
  API-->>FE: { owned, participating, public, counts }
  FE-->>U: Renderiza tres carruseles y tarjetas

  opt Ver todos
    U->>FE: Pulsa "Ver todos"
    FE->>API: GET /api/v1/projects?scope=...
    API->>DB: Consulta paginada por categoría
    API-->>FE: Lista paginada
    FE-->>U: Muestra el listado completo
  end

  opt Error de red
    API-->>FE: Error de conexión
    FE-->>U: Aviso "Sin conexión" + Reintentar
    U->>FE: Pulsa Reintentar
    FE->>API: GET /api/v1/dashboard?limit=12
  end
```

## Notas

- El dashboard es la vista inicial en `/`.
- Un proyecto aparece en una sola categoría.
- Los públicos son los más recientes de otros usuarios, sin recomendación.
