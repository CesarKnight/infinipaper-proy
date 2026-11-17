# Secuencia 017 · Cuestionarios como recursos

> Spec: [017-cuestionarios](../../specs/017-cuestionarios/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor D as Docente / Editor
  actor S as Estudiante
  participant FE as Frontend
  participant API as API NestJS
  participant DB as PostgreSQL
  participant S3 as MinIO

  D->>FE: Crea un cuestionario
  FE->>API: POST /folders/:folderId/quizzes
  API->>DB: Crea Resource(kind=QUIZ) + Quiz DRAFT
  API->>S3: Guarda snapshot JSON
  API-->>FE: Recurso + Quiz

  D->>FE: Edita preguntas
  FE->>API: PUT /quizzes/:id/questions
  API->>DB: Reemplaza preguntas y opciones
  API->>S3: Regenera snapshot JSON
  API-->>FE: Quiz actualizado

  D->>FE: Publica el cuestionario
  FE->>API: POST /quizzes/:id/publish
  API->>DB: status=PUBLISHED
  API-->>FE: Quiz publicado

  S->>FE: Abre la carpeta del curso
  FE->>API: GET /folders/:id/files
  API->>DB: Filtra QUIZ por tarea asignada y publicada
  API-->>FE: Recursos visibles

  S->>FE: Abre el cuestionario
  FE->>API: GET /quizzes/:id
  API->>DB: Valida membresía STUDENT, asignación y estado
  API-->>FE: Quiz sin isCorrect ni correctText
```

## Notas

- El cuestionario es un `Resource` más: aparece en la jerarquía, se mueve y se lista como los demás.
- Las preguntas viven en tablas relacionales; el JSON de MinIO es un snapshot.
- Un estudiante no asignado no ve el cuestionario en el listado.
- La descarga del snapshot queda bloqueada para estudiantes porque contiene respuestas correctas.
- Un cuestionario con intentos no se puede eliminar físicamente.
