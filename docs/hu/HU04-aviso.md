# HU04 · Aviso en listado de carpeta

| Campo | Valor |
|---|---|
| Módulo | Proyectos |
| Prioridad | Alta |
| Estimación | 8 PHU |
| Persona | Participante autorizado |
| Dependencias | HU01, HU03, HU05, HU08 |

## 1. Objetivo

Como participante autorizado, quiero crear y mostrar un aviso en el proyecto y sus carpetas para comunicarme asíncronamente con los participantes.

## 2. Reglas de negocio

1. El aviso es un archivo Markdown llamado según `AVISO_FILENAME` (por defecto `aviso.md`).
2. Es un `Resource` con `kind = MARKDOWN`, por lo tanto **visible** en el listado normal de archivos.
3. Al detectarse un `aviso.md` en una carpeta (o en la raíz del proyecto), su contenido se renderiza **al tope** del visor de esa carpeta.
4. Puede existir un aviso por carpeta, incluida la raíz del proyecto.
5. Solo **Owner** y **Editor** pueden crear/editar el aviso. **Viewer** solo lo lee.
6. Si no existe aviso, se muestra un botón discreto "Crear aviso".
7. El editor es un editor Markdown robusto (**MDXEditor**): WYSIWYG con barra de herramientas (títulos, negrita/cursiva, listas, enlaces, tablas, bloques de código e imágenes), atajos de teclado y vista de fuente.
8. El render admite todas las capacidades de Markdown GFM (imágenes, tablas, etc.) y **se sanitiza** para prevenir XSS.
9. Las imágenes/enlaces relativos se resuelven contra archivos de la misma carpeta.
10. Si el archivo no es Markdown válido, se degrada a texto plano sin romper la vista.

## 3. Precondiciones

- Carpeta existente y usuario con rol Editor u Owner para crear/editar.

## 4. Flujos

### 4.1 Crear aviso
1. El usuario pulsa "Crear aviso" en una carpeta sin aviso.
2. Se abre el editor Markdown con nombre fijo `aviso.md`.
3. Al guardar, se crea el `Resource` MARKDOWN y se renderiza al tope.

### 4.2 Editar aviso
1. El usuario con permisos abre el aviso y edita.
2. Autoguardado o guardado según HU9 (mismo editor Markdown).

### 4.3 Visualizar
1. La carpeta consulta si existe un archivo con `AVISO_FILENAME`.
2. Si existe, se renderiza al tope; si no, se ofrece el botón.

## 5. Criterios de aceptación

- **CA-1** Dada una carpeta sin aviso, entonces se muestra el botón "Crear aviso" de forma discreta.
- **CA-2** Dado un usuario Editor, cuando crea el aviso, entonces se crea `aviso.md` y se renderiza al tope.
- **CA-3** Dado un usuario Viewer, cuando intenta crear/editar el aviso, entonces `403 PROJECT_FORBIDDEN`.
- **CA-4** Dado un `aviso.md` con tablas e imágenes, entonces se renderizan correctamente tras sanitizar.
- **CA-5** Dado un Markdown con HTML/script malicioso, entonces el contenido peligroso se elimina en el render.
- **CA-6** Dado un archivo con nombre distinto, entonces no se trata como aviso.
- **CA-7** Dado que `AVISO_FILENAME` cambia por variable de entorno, entonces el sistema detecta el nuevo nombre.
- **CA-8** Dado un `aviso.md` inválido/ilegible, entonces se muestra como texto plano sin error fatal.

## 6. Contrato de API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/folders/:id` | Viewer+ | Incluye `noticeResourceId` si hay aviso |
| POST | `/api/v1/folders/:id/notice` | Editor+ | Crea `aviso.md` (`{ content }`) |
| GET | `/api/v1/files/:id/content` | Viewer+ | Lee contenido del aviso |
| PUT | `/api/v1/files/:id/content` | Editor+ | Guarda contenido |

> El contenido Markdown se sirve en crudo; el render y la sanitización ocurren en el frontend con `react-markdown` + `rehype-sanitize`.

## 7. Validaciones

| Campo | Regla |
|---|---|
| `content` | texto UTF-8, ≤ 1 MB |
| nombre | igual a `AVISO_FILENAME` |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `NOTICE_NOT_FOUND` | 404 | No existe aviso |
| `FOLDER_NOT_FOUND` | 404 | Carpeta inexistente |
| `PROJECT_FORBIDDEN` | 403 | Sin permisos de edición |
| `INVALID_MARKDOWN` | 422 | Contenido no procesable (se degrada a texto) |

## 9. Fuera de alcance (v1)

Múltiples avisos por carpeta, avisos programados, notificaciones push del aviso, comentarios.
