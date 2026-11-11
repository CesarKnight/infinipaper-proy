# Constitución del proyecto Infinipaper

> **Versión:** 1.0 · **Fecha:** 2026-11-11
>
> Este documento define los principios no negociables que rigen cualquier cambio en Infinipaper. El `plan.md` y las `tasks.md` de cada spec deben respetarlo. Si un cambio necesita contradecirlo, primero se modifica la constitución con una decisión explícita y registrada.

## 1. Preámbulo

Infinipaper es una aplicación de estudio colaborativo: proyectos con carpetas, archivos, avisos, apuntes Markdown, participantes y transcripciones. La constitución no describe la arquitectura completa —eso vive en `docs/sdd/referencia/infraestructura.md`, `docs/sdd/referencia/modelo-datos.md` y `docs/sdd/referencia/librerias.md`—; define las reglas que ningún cambio puede romper.

## 2. Principios

### P-01 · La especificación precede a la implementación

- **Regla:** todo cambio de producto nace en una `spec.md` o actualiza una existente. No se implementa comportamiento nuevo sin requisitos y criterios de aceptación explícitos.
- **Verificación:** la spec tiene objetivos, requisitos `RF-*`/`RNF-*` y criterios `CA-*` verificables antes de escribir código.

### P-02 · Trazabilidad de requisitos a código

- **Regla:** cada tarea referencia los requisitos y criterios que satisface. No se añaden tareas sin requisito que las justifique.
- **Verificación:** `tasks.md` usa IDs `T-*` y cada una cita `RF-*`, `RNF-*` o `CA-*`.

### P-03 · Contratos explícitos y estables

- **Regla:** la API usa el prefijo `/api/v1`, errores uniformes `{ statusCode, code, message, details }` y paginación por cursor. Cambiar un contrato existente exige justificarlo en el plan y actualizar la spec.
- **Verificación:** los endpoints, códigos de error y tipos de request/response están documentados en la spec y en Swagger.

### P-04 · La seguridad y los permisos se aplican en el servidor

- **Regla:** el backend es la única fuente de verdad para autenticación y autorización. La UI puede ocultar acciones, pero nunca sustituye a un guard. Todo Markdown se sanitiza al renderizarse.
- **Verificación:** rutas protegidas con `AuthGuard`/`ProjectAccessGuard`, roles Owner/Editor/Viewer comprobados en servidor y `rehype-sanitize` en la vista de lectura.

### P-05 · Los datos y archivos son consistentes

- **Regla:** los cambios de esquema se hacen con migraciones versionadas de Prisma. Borrar un recurso, carpeta o proyecto elimina también sus objetos de MinIO. No se guardan secretos en el repositorio.
- **Verificación:** migración incluida en el cambio, operaciones de borrado con limpieza de S3 y configuración solo por variables de entorno (`.env.example` actualizado).

### P-06 · Calidad verificable antes de cerrar

- **Regla:** ningún cambio se considera terminado sin pasar las puertas de calidad del proyecto. Los criterios de aceptación deben tener evidencia (test, verificación manual registrada o ambos).
- **Verificación:** ver sección 4.

### P-07 · Cambios pequeños y revisables

- **Regla:** una spec debe describir un cambio acotado. Se prefieren entregas incrementales a reescrituras amplias. No se añade infraestructura o abstracción sin una necesidad concreta.
- **Verificación:** el plan enumera archivos afectados y el diff puede revisarse de una vez.

### P-08 · UX consistente, accesible y en español

- **Regla:** la interfaz usa los componentes shadcn/Base UI del proyecto, mantiene los tokens de tema claro/oscuro y cubre estados de carga, vacío y error. Los textos de producto y la documentación se escriben en español.
- **Verificación:** revisión visual, navegación por teclado y lint de accesibilidad cuando aplique.

### P-09 · Documentación viva

- **Regla:** `docs/sdd/specs/` es la única fuente vigente del comportamiento. `docs/sdd/referencia/` contiene la documentación estable (infraestructura, librerías, modelo de datos, decisiones y API) que las specs deben respetar.
- **Verificación:** la spec refleja el comportamiento implementado y las brechas conocidas; no hay dos fuentes contradictorias sin marcar.

### P-10 · Compatibilidad y reversibilidad

- **Regla:** todo cambio debe poder revertirse. Las migraciones de base de datos, cambios de variables de entorno y cambios de contrato incluyen un plan de rollback en `plan.md`.
- **Verificación:** el plan describe cómo volver al estado anterior y qué datos se conservan o pierden.

## 3. Restricciones técnicas vigentes

| Área | Restricción |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, shadcn/Base UI, Tailwind v4 |
| Backend | NestJS 12 ESM, Prisma 7 (`prisma-client` + `@prisma/adapter-pg`), PostgreSQL 17 |
| Autenticación | Cookie `httpOnly` + tabla `Session`; login por email o username |
| Peticiones | Same-origin mediante rewrites de Next (`/api/*` → `API_URL`); sin CORS |
| Roles | Owner implícito en `Project.ownerId`; Editor y Viewer en `ProjectMember` |
| Archivos | MinIO (S3); subida proxeada por el backend |
| Límite de subida | 50 MB por archivo, configurable con `MAX_UPLOAD_SIZE_MB` |
| Markdown | Editor MDXEditor; lectura sanitizada con `react-markdown` + `rehype-sanitize` |
| Colaboración | Sin tiempo real; conflictos *last-write-wins* |
| API | `/api/v1`, errores uniformes, fechas ISO 8601 UTC |

## 4. Puertas de calidad (Definition of Done)

Un cambio solo se marca como terminado cuando:

- [ ] La spec está actualizada y su estado refleja la realidad.
- [ ] `tasks.md` no tiene tareas obligatorias pendientes.
- [ ] Backend: `npm run lint && npm test && npm run build` en `infinipaper-backend/`.
- [ ] Frontend: `npm run lint && npm run build` en `infinipaper-frontend/`.
- [ ] Los criterios de aceptación tienen evidencia registrada.
- [ ] Si hubo cambios de esquema, la migración está versionada y el plan incluye rollback.
- [ ] Si hubo nuevas variables de entorno, están en `.env.example` y en la guía correspondiente.
- [ ] La documentación afectada (`docs/README.md`, `docs/sdd/referencia/librerias.md`, guías) está actualizada.

## 5. Gobernanza

- La constitución se versiona en este archivo.
- Cualquier excepción a un principio debe justificarse en el `plan.md` de la spec y ser aprobada explícitamente por el responsable del proyecto.
- Un cambio a la constitución requiere una decisión registrada y el aumento de versión del documento.
- Ante conflicto entre una spec antigua y la constitución, prevalece la constitución y la spec debe corregirse.
