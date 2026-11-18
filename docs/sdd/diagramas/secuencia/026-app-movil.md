# Secuencia 026 · App móvil

> Spec: [026-app-movil](../../specs/026-app-movil/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario móvil
  participant APP as App Expo
  participant SEC as SecureStore
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  U->>APP: Abre la app
  APP->>APP: Splash animado de marca
  APP->>SEC: Recupera X-Mobile-Session
  SEC-->>APP: Token
  APP->>API: GET /auth/me (X-Mobile-Session)
  API->>DB: Valida Session y User
  API-->>APP: Usuario + rol global

  APP->>API: GET /projects?scope=all
  API->>DB: Proyectos y roles
  API-->>APP: Tarjetas de proyectos
  U->>APP: Abre proyecto
  APP->>API: GET /projects/:id/folders y /folders/:id/files
  API->>DB: Carpetas y recursos
  API-->>APP: Árbol y archivos

  U->>APP: Abre un recurso
  APP->>API: GET /files/:id y /files/:id/content
  API->>S3: Lee objeto o rango
  API-->>APP: Metadatos + binario
  APP-->>U: Visor nativo o visor PDF/Markdown

  opt Subir archivo (Owner/Editor)
    U->>APP: Elige archivo, foto o cámara
    APP->>API: POST /folders/:id/files
    API->>S3: Guarda objeto
    API->>DB: Crea Resource
    API-->>APP: Recurso creado
    APP-->>U: Refresca carpeta
  end

  opt Descargar
    U->>APP: Pulsa descargar
    APP->>API: GET /files/:id/content?download=1
    API-->>APP: Archivo
    APP-->>U: Abre o comparte con app nativa
  end
```

## Notas

- La sesión móvil usa `X-Mobile-Session`, no la cookie web.
- El servidor sigue siendo la fuente de verdad de permisos y roles.
- Los documentos ofimáticos se abren con la app compatible del dispositivo.
- El splash se anima con la marca del design system.
