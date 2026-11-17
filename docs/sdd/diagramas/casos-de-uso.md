# Casos de uso

Cada caso de uso corresponde a una spec. Los actores `Owner`, `Editor`, `Viewer` y `Student` son roles dentro de un proyecto; heredan las capacidades de `Usuario` y añaden o restringen acciones según la matriz de permisos de la [spec 008](../specs/008-permisos/spec.md). Los roles globales `ADMIN`, `TEACHER` y `STUDENT` se representan con los actores `Administrador`, `Docente` y `Estudiante`.

> Las specs 013 (sistema de diseño) y 014 (tema de marca) son transversales de producto y no añaden un caso de uso funcional. Por eso la numeración de casos de uso salta de `UC-12` a `UC-15`.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Inter, sans-serif"}}}%%
flowchart LR
  classDef actor fill:#fef3c7,stroke:#b45309,stroke-width:1px,color:#111
  classDef usecase fill:#e0f2fe,stroke:#0369a1,stroke-width:1px,color:#111
  classDef external fill:#f3e8ff,stroke:#7e22ce,stroke-width:1px,color:#111

  subgraph Actores["Actores"]
    Visitante((Visitante)):::actor
    Usuario((Usuario)):::actor
    Owner((Owner)):::actor
    Editor((Editor)):::actor
    Viewer((Viewer)):::actor
    Administrador((Administrador)):::actor
    Docente((Docente)):::actor
    Estudiante((Estudiante)):::actor
    Whisper[Sistema ASR<br/>Whisper]:::external
    MinIO[(MinIO<br/>S3)]:::external
    Mailpit[Sistema SMTP<br/>Mailpit]:::external
    LLM[Proveedor LLM]:::external
  end

  subgraph Sistema["Infinipaper"]
    UC01([UC-01<br/>Gestión de usuarios]):::usecase
    UC02([UC-02<br/>Gestión de proyectos]):::usecase
    UC03([UC-03<br/>Gestión de carpetas]):::usecase
    UC04([UC-04<br/>Aviso en carpeta]):::usecase
    UC05([UC-05<br/>Gestión de archivos]):::usecase
    UC06([UC-06<br/>Visualización multimedia]):::usecase
    UC07([UC-07<br/>Gestión de participantes]):::usecase
    UC08([UC-08<br/>Gestión de permisos]):::usecase
    UC09([UC-09<br/>Gestión de apuntes]):::usecase
    UC10([UC-10<br/>Transcripción de audio]):::usecase
    UC11([UC-11<br/>Dashboard personal]):::usecase
    UC12([UC-12<br/>Estructuración de apuntes con IA]):::usecase
    UC15([UC-15<br/>Perfil docente y verificación]):::usecase
    UC16([UC-16<br/>Proyectos académicos y archivado]):::usecase
    UC17([UC-17<br/>Cuestionarios como recursos]):::usecase
    UC18([UC-18<br/>Tareas, intentos y revisión]):::usecase
  end

  Visitante --> UC01
  Visitante --> UC02
  Visitante --> UC06

  Usuario --> UC01
  Usuario --> UC02
  Usuario --> UC06
  Usuario --> UC09
  Usuario --> UC10
  Usuario --> UC11

  Owner --> UC02
  Owner --> UC03
  Owner --> UC04
  Owner --> UC05
  Owner --> UC07
  Owner --> UC08
  Owner --> UC09
  Owner --> UC10
  Owner --> UC11
  Owner --> UC12

  Editor --> UC03
  Editor --> UC04
  Editor --> UC05
  Editor --> UC06
  Editor --> UC09
  Editor --> UC10
  Editor --> UC11
  Editor --> UC12

  Viewer --> UC02
  Viewer --> UC03
  Viewer --> UC04
  Viewer --> UC05
  Viewer --> UC06
  Viewer --> UC09
  Viewer --> UC11

  Whisper --> UC10
  MinIO --> UC04
  MinIO --> UC05
  MinIO --> UC06
  MinIO --> UC09
  MinIO --> UC17
  Mailpit --> UC15
  LLM --> UC12

  Usuario --> UC15
  Administrador --> UC15
  Administrador --> UC16
  Docente --> UC15
  Docente --> UC16
  Docente --> UC17
  Docente --> UC18
  Owner --> UC16
  Owner --> UC17
  Owner --> UC18
  Editor --> UC16
  Editor --> UC17
  Editor --> UC18
  Estudiante --> UC16
  Estudiante --> UC17
  Estudiante --> UC18
  Viewer --> UC16
  Viewer --> UC17
```

## Trazabilidad

| Caso de uso | Spec | Actores principales |
|---|---|---|
| UC-01 Gestión de usuarios | [001](../specs/001-usuarios/spec.md) | Visitante, Usuario |
| UC-02 Gestión de proyectos | [002](../specs/002-proyectos/spec.md) | Visitante, Usuario, Owner |
| UC-03 Gestión de carpetas | [003](../specs/003-carpetas/spec.md) | Owner, Editor, Viewer |
| UC-04 Aviso en carpeta | [004](../specs/004-aviso/spec.md) | Owner, Editor, Viewer, MinIO |
| UC-05 Gestión de archivos | [005](../specs/005-archivos/spec.md) | Owner, Editor, Viewer, MinIO |
| UC-06 Visualización multimedia | [006](../specs/006-visualizacion/spec.md) | Visitante, Usuario, Viewer, MinIO |
| UC-07 Gestión de participantes | [007](../specs/007-participantes/spec.md) | Owner |
| UC-08 Gestión de permisos | [008](../specs/008-permisos/spec.md) | Owner |
| UC-09 Gestión de apuntes | [009](../specs/009-apuntes/spec.md) | Owner, Editor, Viewer, MinIO |
| UC-10 Transcripción de audio | [010](../specs/010-transcripcion/spec.md) | Usuario, Editor, Owner, Whisper |
| UC-11 Dashboard personal | [011](../specs/011-dashboard/spec.md) | Usuario, Owner, Editor, Viewer |
| UC-12 Estructuración de apuntes con IA | [012](../specs/012-estructuracion-apuntes-ia/spec.md) | Owner, Editor, LLM |
| UC-15 Perfil docente y verificación | [015](../specs/015-perfil-docente/spec.md) | Usuario, Docente, Administrador, Mailpit |
| UC-16 Proyectos académicos y archivado | [016](../specs/016-proyectos-academicos/spec.md) | Docente, Owner, Editor, Viewer, Estudiante, Administrador |
| UC-17 Cuestionarios como recursos | [017](../specs/017-cuestionarios/spec.md) | Docente, Owner, Editor, Viewer, Estudiante, MinIO |
| UC-18 Tareas, intentos y revisión | [018](../specs/018-tareas-intentos/spec.md) | Docente, Owner, Editor, Estudiante |

> `Visitante` solo accede a proyectos públicos en modo lectura y a las pantallas de registro/login. Las acciones de escritura requieren un rol de proyecto. Los roles globales `Administrador`, `Docente` y `Estudiante` no conceden acceso implícito a proyectos privados.
