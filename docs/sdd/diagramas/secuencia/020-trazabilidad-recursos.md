# Secuencia 020 · Trazabilidad y validación

> Spec: [020-trazabilidad-recursos](../../specs/020-trazabilidad-recursos/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor E as Editor / Docente
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL

  E->>FE: Abre un recurso
  FE->>API: GET /files/:id/provenance
  API->>DB: Consulta origen, validación y ResourceSource
  API-->>FE: Recurso, autor, fuentes y estado

  E->>FE: Marca como verificado
  FE->>API: POST /files/:id/validate {status: VERIFIED, note}
  API->>DB: Comprueba rol Editor/Owner
  API->>DB: Actualiza validación + validador + fecha
  API->>DB: Crea AuditEvent
  API-->>FE: Recurso validado

  E->>FE: Filtra por IA y no verificado
  FE->>API: GET /folders/:id/files?origin=AI_MINDMAP&validationStatus=UNVERIFIED
  API->>DB: Filtra recursos y fuentes
  API-->>FE: Lista filtrada con badges
```

## Notas

- Los recursos generados por IA nacen `UNVERIFIED`.
- La validación no altera el contenido.
- Un recurso derivado advierte si alguna fuente no está verificada.
- Las fuentes eliminadas se muestran como “fuente eliminada”.
