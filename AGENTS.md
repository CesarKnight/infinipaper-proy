# AGENTS.md · Infinipaper

Este archivo obliga a cualquier agente que trabaje en este repositorio a seguir el proceso SDD ligero del proyecto.

## Idioma

- Responde, documenta y escribe los textos de producto en **español**.
- Nombres de archivos y convenciones de código siguen el estilo existente del repositorio.

## Flujo obligatorio (SDD ligero)

Antes de implementar un cambio de producto:

1. Lee [`docs/sdd/constitucion.md`](./docs/sdd/constitucion.md) y [`docs/sdd/README.md`](./docs/sdd/README.md).
2. Localiza la spec vigente en `docs/sdd/specs/`. Si no existe, créala con [`docs/sdd/plantillas/spec.md`](./docs/sdd/plantillas/spec.md) o ejecuta `./docs/sdd/nueva-spec.sh <slug>`.
3. Completa `spec.md` con contexto, objetivos, alcance, requisitos `RF-*`/`RNF-*` y criterios `CA-*`.
4. Para cambios no triviales, crea también `plan.md` y `tasks.md` con las plantillas.
5. Propón spec/plan/tareas y **espera aprobación** antes de implementar. No empieces por el código.
6. Implementa solo lo trazable a un requisito. Si aparece alcance nuevo, actualiza la spec primero.
7. Verifica los criterios de aceptación y ejecuta las puertas de calidad.
8. Actualiza la spec con evidencia, brechas (`G-*`) y estado final.

### Cuándo se puede omitir la spec

- Typos, formato, comentarios o documentación sin cambio de comportamiento.
- Actualización de dependencias sin cambio funcional.
- Hotfix urgente: se permite implementar primero, pero debe registrarse una spec retroactiva el mismo día.

## Contexto del repositorio

- `infinipaper-backend/`: NestJS 12 ESM, Prisma 7, PostgreSQL 17, MinIO, `pg-boss`.
- `infinipaper-frontend/`: Next.js 16 App Router, React 19, shadcn/Base UI, Tailwind v4.
- `docs/`: especificaciones SDD. La fuente vigente es `docs/sdd/specs/`; la documentación transversal vive en `docs/sdd/referencia/`.
- La raíz no contiene el código: cada app tiene su propio `package.json` y `AGENTS.md` cuando aplica.

## Comandos de verificación

```bash
# Backend
cd infinipaper-backend
npm run lint
npm test
npm run build

# Frontend
cd infinipaper-frontend
npm run lint
npm run build
```

Si un cambio toca base de datos:

```bash
cd infinipaper-backend
npx prisma migrate dev --name <descripcion>
npx prisma generate
```

## Reglas técnicas que no se deben romper

- API con prefijo `/api/v1`, errores uniformes y paginación por cursor.
- Autenticación por cookie `httpOnly` + tabla `Session`; no usar `Authorization: Bearer`.
- Peticiones same-origin mediante rewrites de Next (`/api/*` → `API_URL`); no introducir CORS.
- Roles de proyecto: Owner (implícito en `Project.ownerId`), Editor y Viewer.
- Permisos y autorización **siempre** en el servidor; la UI solo los refleja.
- Markdown sanitizado al renderizar (`rehype-sanitize`).
- Archivos en MinIO; subida proxeada por el backend; límite de 50 MB configurable por `MAX_UPLOAD_SIZE_MB`.
- No guardar secretos en el repositorio; nuevas variables van en `.env.example`.
- Migraciones de Prisma versionadas y con rollback documentado en el plan.
- Sin colaboración en tiempo real en v1; conflictos *last-write-wins*.

## Puertos de desarrollo

- Frontend: `http://localhost:3000` (`npm run dev`).
- Backend en host: `PORT=3001` y `API_URL=http://localhost:3001`.
- Infraestructura Docker: PostgreSQL `5433`, MinIO `9000/9001`, Whisper `8000`.

## Dónde mirar

| Tema | Documento |
|---|---|
| Proceso SDD | [`docs/sdd/README.md`](./docs/sdd/README.md) |
| Principios | [`docs/sdd/constitucion.md`](./docs/sdd/constitucion.md) |
| Plantillas | [`docs/sdd/plantillas/`](./docs/sdd/plantillas/) |
| Índice de specs | [`docs/sdd/specs/README.md`](./docs/sdd/specs/README.md) |
| Infraestructura | [`docs/sdd/referencia/infraestructura.md`](./docs/sdd/referencia/infraestructura.md) |
| Modelo de datos | [`docs/sdd/referencia/modelo-datos.md`](./docs/sdd/referencia/modelo-datos.md) |
| Librerías | [`docs/sdd/referencia/librerias.md`](./docs/sdd/referencia/librerias.md) |
| Decisiones | [`docs/sdd/referencia/decisiones.md`](./docs/sdd/referencia/decisiones.md) |
| Convenciones de API | [`docs/sdd/referencia/api.md`](./docs/sdd/referencia/api.md) |
| Diagramas | [`docs/sdd/diagramas/README.md`](./docs/sdd/diagramas/README.md) |
| Modelo EA | [`docs/sdd/ea/README.md`](./docs/sdd/ea/README.md) |
| Guías de ejecución | [`docs/README.md`](./docs/README.md) |

## Frontend

El proyecto tiene instrucciones adicionales en [`infinipaper-frontend/AGENTS.md`](./infinipaper-frontend/AGENTS.md). Incluyen la advertencia de que Next.js 16 puede diferir de versiones anteriores y el uso de las skills de shadcn en `.agents/skills/shadcn`.

## Documentación

Toda la documentación vigente vive bajo `docs/sdd/`. Las specs describen comportamiento; `referencia/` describe el contexto estable. Si una spec contradice un documento de referencia, se corrige la spec o se actualiza la referencia con una decisión explícita.
