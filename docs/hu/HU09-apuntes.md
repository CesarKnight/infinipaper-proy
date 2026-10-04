# HU09 · Gestión de apuntes

| Campo | Valor |
|---|---|
| Módulo | Apuntes |
| Prioridad | Media |
| Estimación | 8 PHU |
| Persona | Participante autorizado |
| Dependencias | HU01, HU03, HU05, HU08 |

## 1. Objetivo

Como participante autorizado, quiero crear y editar apuntes mediante un editor Markdown dentro de los proyectos, para registrar y organizar información académica.

## 2. Reglas de negocio

1. Un apunte es un `Resource` con `kind = MARKDOWN` almacenado dentro de una carpeta del proyecto.
2. **Es visible en el listado** de archivos (cualquier `.md` del proyecto puede editarse como apunte).
3. El editor es un editor Markdown robusto (**MDXEditor**): WYSIWYG con barra de herramientas, atajos de teclado y vista de fuente. La vista de solo lectura se renderiza con sanitización (`rehype-sanitize`).
4. **Autoguardado** con *debounce* de 1–2 s; sin historial de versiones; sin edición colaborativa en tiempo real.
5. Resolución de conflictos: *last-write-wins*.
6. Solo **Owner** y **Editor** pueden crear/editar/eliminar apuntes. **Viewer** solo lee.
7. Se permite guardar vacío; solo se exige una ubicación válida al crear.
8. El contenido se sanitiza al renderizar (XSS), igual que HU4.

## 3. Precondiciones

- Carpeta existente y usuario con rol Editor u Owner.

## 4. Flujos

### 4.1 Crear apunte
1. El usuario elige "Nuevo apunte" en una carpeta.
2. Ingresa un nombre (p. ej. `tema.md`) y contenido.
3. Se crea el `Resource` MARKDOWN.

### 4.2 Editar apunte
1. Se abre el editor con el contenido actual.
2. Al escribir, un autoguardado con *debounce* persiste vía `PUT /files/:id/content`.
3. Se muestra el estado ("Guardando… / Guardado").

### 4.3 Visualizar
1. Se renderiza el Markdown sanitizado.

### 4.4 Eliminar
1. Editor+ elimina el apunte (confirmación).

## 5. Criterios de aceptación

- **CA-1** Dado un usuario Editor, cuando crea un apunte en una carpeta válida, entonces se persiste como `.md`.
- **CA-2** Dado un usuario Editor, cuando edita el contenido, entonces el autoguardado guarda los cambios sin acción explícita.
- **CA-3** Dado un apunte guardado, entonces conserva su estructura Markdown al reabrirlo.
- **CA-4** Dado un Viewer, cuando intenta editar, entonces `403 PROJECT_FORBIDDEN`.
- **CA-5** Dado un intento de crear sin carpeta válida, entonces `422 NOTE_LOCATION_REQUIRED`.
- **CA-6** Dado un apunte con HTML malicioso, entonces el render lo sanitiza.
- **CA-7** Dado un usuario Editor, cuando elimina un apunte, entonces desaparece del listado.
- **CA-8** Dado que no hay edición colaborativa, entonces el comportamiento es *last-write-wins*.

## 6. Contrato de API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/v1/folders/:id/notes` | Editor+ | Crear (`{ name, content }`) |
| GET | `/api/v1/files/:id/content` | Viewer+ | Leer contenido |
| PUT | `/api/v1/files/:id/content` | Editor+ | Guardar (autoguardado) |
| PATCH | `/api/v1/files/:id` | Editor+ | Renombrar |
| DELETE | `/api/v1/files/:id` | Editor+ | Eliminar |

## 7. Validaciones

| Campo | Regla |
|---|---|
| `name` | 1–255, termina en `.md` |
| `content` | UTF-8, ≤ 1 MB |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `NOTE_LOCATION_REQUIRED` | 422 | Sin carpeta válida |
| `PROJECT_FORBIDDEN` | 403 | Sin permisos de edición |
| `FILE_NOT_FOUND` | 404 | Apunte inexistente |
| `CONTENT_TOO_LARGE` | 413 | Contenido supera el límite |

## 9. Fuera de alcance (v1)

Edición colaborativa en tiempo real (CRDT/OT), historial de versiones, comentarios, resaltado de sintaxis avanzado, plantillas de apunte, exportación a PDF.
