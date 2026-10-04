# HU11 · Dashboard Personal

| Campo | Valor |
|---|---|
| Módulo | Inicio (Dashboard) |
| Prioridad | Media |
| Estimación | 8 PHU |
| Persona | Usuario autenticado |
| Dependencias | HU01, HU02, HU07, HU08 |

## 1. Objetivo

Como usuario, quiero visualizar un resumen de mi uso del sistema (mis proyectos, aquellos en los que participo y proyectos públicos que podrían interesarme) para acceder rápidamente al proyecto que debo trabajar.

## 2. Reglas de negocio

1. El dashboard presenta **tres categorías**: **Mis proyectos** (soy propietario), **Participando** (soy miembro Editor/Viewer) y **Públicos** (proyectos públicos de otros).
2. Un mismo proyecto **no puede repetirse** entre categorías. Prioridad de exclusión:
   - Si soy propietario → aparece solo en *Mis proyectos*.
   - Si no soy propietario pero soy miembro → aparece solo en *Participando*.
   - *Públicos* excluye los proyectos propios y en los que ya participo.
3. Cada categoría se muestra como **galería tipo carrusel** con desplazamiento horizontal y navegación por botones.
4. Cada tarjeta muestra: nombre, descripción (recortada), visibilidad, propietario (avatar + nombre) y, cuando corresponda, mi **rol** en el proyecto.
5. Al hacer click en una tarjeta se navega al proyecto.
6. Orden por defecto (todas las categorías): actividad más reciente primero (`updatedAt` descendente).
7. Se muestran hasta **N elementos por categoría** (por defecto 12) con un enlace **"Ver todos"** que abre la lista completa y paginada de esa categoría.
8. **Estados vacíos** por categoría, con mensaje y acción contextual:
   - *Mis proyectos*: "Aún no creaste proyectos" + botón "Crear proyecto".
   - *Participando*: "Todavía no participas en ningún proyecto".
   - *Públicos*: "No hay proyectos públicos por ahora".
9. **Sin conexión:** si la API no responde, se muestra un aviso "Sin conexión" con botón **Reintentar**; el resto de la interfaz permanece usable, sin recargar la página.
10. Requiere sesión (ruta protegida). Es el **home** tras iniciar sesión.
11. Los proyectos **públicos** en v1 son los **más recientes**; no hay recomendación personalizada (ver §10).

## 3. Precondiciones

- Usuario autenticado.
- HU02 (proyectos) y HU07 (participantes) implementadas.

## 4. Flujos

### 4.1 Cargar el dashboard
1. El usuario inicia sesión y es redirigido a `/dashboard`.
2. El sistema consulta `GET /api/v1/dashboard` y renderiza los tres carruseles.
3. Cada tarjeta enlaza a `/projects/:id`.

### 4.2 Ver todos
1. El usuario pulsa "Ver todos" en una categoría.
2. Navega a `/projects?scope=owned|participating|public` (lista completa paginada).

### 4.3 Sin conexión
1. La consulta falla por red.
2. Se muestra un aviso "Sin conexión" con "Reintentar".
3. Al reintentar con éxito, se renderizan los carruseles.

### 4.4 Usuario nuevo
1. Sin proyectos propios ni participaciones.
2. Se muestran los estados vacíos correspondientes y, si hay, proyectos públicos.

## 5. Criterios de aceptación (Given/When/Then)

- **CA-1** Dado un usuario con proyectos, cuando abre `/dashboard`, entonces ve sus proyectos en la categoría *Mis proyectos*.
- **CA-2** Dado un usuario que participa en proyectos de otros, cuando abre el dashboard, entonces esos proyectos aparecen en *Participando* con su rol.
- **CA-3** Dado que existen proyectos públicos de otros, cuando abre el dashboard, entonces aparecen en *Públicos*.
- **CA-4** Dado un proyecto en el que soy propietario, entonces **no** aparece en *Participando* ni en *Públicos*.
- **CA-5** Dado que soy miembro de un proyecto público, entonces aparece solo en *Participando*.
- **CA-6** Dado cualquier usuario, entonces los proyectos se muestran en una **galería carrusel** por categoría.
- **CA-7** Dado un usuario sin proyectos creados, cuando abre el dashboard, entonces ve el estado vacío de *Mis proyectos* con acción para crear uno.
- **CA-8** Dado un usuario sin participaciones, entonces ve el estado vacío de *Participando*.
- **CA-9** Dada una falla de conexión con la API, cuando abre (o reintenta) el dashboard, entonces ve un aviso "Sin conexión" y un botón "Reintentar", sin que la página se rompa.
- **CA-10** Dado un usuario anónimo, cuando intenta abrir `/dashboard`, entonces es redirigido a `/login`.
- **CA-11** Dado que hay más elementos que el límite, cuando observa una categoría, entonces ve "Ver todos" y al pulsarlo accede a la lista completa.
- **CA-12** Las tarjetas muestran nombre, descripción, visibilidad y propietario; y el rol cuando el usuario participa.

## 6. Contrato de API

Nuevo endpoint agregado (evita filtrar en el cliente y expone contadores):

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/dashboard?limit=12` | Sí | Resumen en 3 categorías |

**Respuesta:**
```json
{
  "owned": [ ProjectCard ],
  "participating": [ ProjectCard ],
  "public": [ ProjectCard ],
  "counts": { "owned": 4, "participating": 2, "public": 25 }
}
```

**`ProjectCard`:**
```json
{
  "id": "…",
  "name": "Álgebra lineal",
  "description": "…",
  "visibility": "PRIVATE",
  "updatedAt": "2026-10-04T…",
  "owner": { "username": "ana", "displayName": "Ana", "avatarUrl": "/api/v1/users/ana/avatar" },
  "role": "viewer",
  "_count": { "folders": 3, "members": 5 }
}
```

Para "Ver todos" se amplía el listado existente:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/projects?scope=owned\|participating\|all&cursor=&limit=` | Lista paginada por categoría |

- `scope=owned`: `ownerId = usuario`.
- `scope=participating`: miembro y no propietario.
- `scope=public`: proyectos públicos que no son propios ni participados (o reutiliza `/projects/public` si se prefiere excluir en cliente).
- `scope=all` (por defecto): comportamiento actual (accesibles).

## 7. Modelo de datos

No requiere tablas nuevas. Se apoya en `Project`, `ProjectMember` y `User`.

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Sin sesión; el cliente redirige a `/login` |
| `NETWORK_ERROR` | — (cliente) | La API no responde; se muestra el aviso "Sin conexión" |

## 9. UI (frontend)

Ruta: `app/dashboard/page.tsx` (protegida por `proxy.ts`).

Componentes previstos:
- `DashboardPage` — orquesta las 3 categorías.
- `DashboardCategory` — título, contador, "Ver todos" y carrusel.
- `ProjectCard` — reutilizable en dashboard y listados.
- `EmptyState` — mensaje + acción por categoría.
- `OfflineNotice` — aviso "Sin conexión" + "Reintentar".

Navegación: `app/page.tsx` (raíz) y el login redirigen a `/dashboard` en lugar de `/projects`.

## 10. Decisiones y aclaraciones (pulido de la especificación)

- **"Proyectos públicos que podrían interesarme":** en v1 se interpreta como **públicos más recientes de otros usuarios**, sin motor de recomendación. Un sistema de recomendación/afinidad queda **fuera de alcance**.
- **"Sin conexión":** se refiere a un **fallo de red al consultar la API** (no a modo offline/PWA con caché). Se resuelve con React Query (`isError` + `refetch`) y el aviso correspondiente.
- **Carrusel:** el requisito pide "galería carrusel". Propuesta con la librería estándar de shadcn (`carousel`, basada en `embla-carousel-react`). **Alternativa sin dependencia nueva:** scroll horizontal con *snap* CSS (`overflow-x-auto snap-x`) y botones de desplazamiento. Recomiendo `embla` por accesibilidad y arrastre.
- **Exclusividad de categorías:** se añade la regla de que un proyecto aparece en **una sola** categoría, algo que la especificación original no precisaba.
- **Límite por categoría y "Ver todos":** se incorpora `limit` (12 por defecto) y el enlace a la lista completa.
- **Home:** el dashboard pasa a ser la vista inicial tras iniciar sesión (`/` y login redirigen a `/dashboard`); `/projects` queda como listado completo con filtro `scope`.
- **Correcciones de redacción:** "participicaciones" → participaciones, "galeria" → galería, "adicion" → además.
- La persona "Estudiante/Docente" se mantiene como **Usuario autenticado** (no hay roles de plataforma, según HU01).

## 11. Fuera de alcance (v1)

Recomendación personalizada de proyectos, actividad reciente/comentarios, métricas de uso (tiempo, vistas), widgets configurables, notificaciones, modo offline con sincronización, ordenación personalizable de categorías.
