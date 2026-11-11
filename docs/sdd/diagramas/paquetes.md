# Diagrama de paquetes

Vista de alto nivel de los paquetes del repositorio y de sus dependencias. Las flechas discontinuas representan dependencias; las continuas, relaciones de uso o composición.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Inter, sans-serif"}}}%%
flowchart TB
  classDef pkg fill:#f8fafc,stroke:#334155,stroke-width:1px,color:#0f172a
  classDef ext fill:#f3e8ff,stroke:#7e22ce,stroke-width:1px,color:#111
  classDef data fill:#ecfdf5,stroke:#047857,stroke-width:1px,color:#111

  subgraph Frontend["infinipaper-frontend"]
    APP["app/<br/>rutas App Router"]:::pkg
    COMP["components/<br/>UI + dominio"]:::pkg
    LIB["lib/<br/>api · hooks · types"]:::pkg
  end

  subgraph Backend["infinipaper-backend"]
    MOD["src/modules/<br/>auth · users · projects<br/>folders · resources · members<br/>transcriptions · dashboard"]:::pkg
    COMMON["src/common/<br/>guards · permissions<br/>storage · prisma · config"]:::pkg
    PRISMA["prisma/<br/>schema + migraciones"]:::pkg
  end

  subgraph Infra["Infraestructura"]
    PG[(PostgreSQL 17)]:::data
    MINIO[(MinIO S3)]:::data
    WHISPER[Whisper ASR]:::ext
    QUEUE[pg-boss]:::ext
  end

  APP --> COMP
  APP --> LIB
  COMP --> LIB
  LIB -. "/api/v1 (rewrites)" .-> MOD
  MOD --> COMMON
  MOD --> PRISMA
  PRISMA --> PG
  MOD -. "objetos" .-> MINIO
  MOD -. "audio" .-> WHISPER
  MOD -. "jobs" .-> QUEUE
  QUEUE -. "persistencia" .-> PG
```

## Responsabilidades

| Paquete | Responsabilidad | Specs |
|---|---|---|
| `app/` | Rutas, layouts, páginas y protección de navegación | 001–011 |
| `components/` | Componentes de UI y dominio (proyecto, markdown, workspace) | 002–011 |
| `lib/` | Cliente API same-origin, hooks, tipos y utilidades | 001–011 |
| `src/modules/` | Módulos NestJS: auth, users, projects, folders, resources, members, transcriptions, dashboard | 001–011 |
| `src/common/` | Guards, permisos, storage S3, Prisma, configuración y errores | 001–011 |
| `prisma/` | Esquema, migraciones y cliente generado | 001–011 |
| Infraestructura | PostgreSQL, MinIO, Whisper y cola `pg-boss` | 005, 009, 010 |

## Reglas de dependencia

- `app/` y `components/` **no** acceden directamente a la base de datos ni a MinIO; todo pasa por `/api/v1`.
- `lib/` solo conoce el contrato HTTP; no importa código de backend.
- `src/modules/` depende de `src/common/` y de Prisma; no importa código de frontend.
- Los módulos no se llaman entre sí de forma circular; `PermissionsService` y `StorageService` son servicios compartidos.
- La infraestructura se consume a través de adaptadores (`PrismaService`, `StorageService`, `AsrService`, `QueueService`).
