# Secuencia 023 · Métricas de uso de recursos

> Spec: [023-metricas-recursos](../../specs/023-metricas-recursos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  actor D as Docente / Owner
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL

  U->>FE: Abre un recurso
  FE->>API: GET /files/:id
  API->>DB: Registra ResourceEvent VIEW
  API-->>FE: Recurso

  U->>FE: Descarga el archivo
  FE->>API: GET /files/:id/content?download=1
  API->>DB: Registra ResourceEvent DOWNLOAD
  API-->>FE: Contenido

  D->>FE: Abre Uso de recursos
  FE->>API: GET /projects/:id/usage?kind=&origin=&validationStatus=
  API->>DB: Agrega eventos por recurso y tipo
  API-->>FE: Vistas, descargas, búsquedas y usuarios únicos

  D->>FE: Exporta CSV
  FE->>API: GET /projects/:id/usage/export
  API-->>FE: CSV agregado sin emails
```

## Notas

- Los eventos no guardan contenido.
- Los agregados son por proyecto; nunca globales.
- La retención se configura con `RESOURCE_EVENT_RETENTION_DAYS`.
