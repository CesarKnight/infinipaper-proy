# Secuencia 029 · Visor interactivo de mapas mentales

> Spec: [029-visor-mapas-interactivo](../../specs/029-visor-mapas-interactivo/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant FE as Frontend
  participant V as MindmapViewer
  participant LS as localStorage
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  U->>FE: Abre un mapa mental
  FE->>API: GET /files/:id/content
  API->>DB: Valida Resource MINDMAP y permisos
  API->>S3: Lee el JSON canónico
  API-->>FE: { nodes, edges }
  FE->>V: Monta React Flow + layout dagre
  V->>LS: Lee posiciones manuales por resourceId
  V-->>U: Canvas, minimapa y controles de zoom

  U->>V: Pan, zoom o arrastre de nodos
  V->>LS: Guarda posiciones manuales
  U->>V: Ajustar vista
  V->>V: fitView del grafo completo
  U->>V: Reorganizar
  V->>V: Recalcula dagre y descarta posiciones manuales
  U->>V: Exportar PNG
  V->>V: html-to-image del grafo completo
  V-->>U: Descarga PNG del tema activo

  alt Error de carga
    API-->>FE: 403, 404 o error de lectura
    FE-->>U: Estado de error con reintento
  end
```

## Notas

- No hay cambios de API, Prisma ni MinIO: se sigue usando el JSON actual.
- Las posiciones manuales viven en `localStorage` bajo `infinipaper.mindmap.layout.<resourceId>`.
- La exportación incluye todos los nodos y aristas, sin controles ni minimapa.
- El layout automático es determinista para el mismo JSON.
- El canvas se carga solo al abrir un mapa.
