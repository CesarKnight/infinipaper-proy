# Spec 011 · Dashboard personal

| Campo | Valor |
|---|---|
| ID | `011` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | 2026-11-11 |
| Dependencias | `spec 001` (usuarios), `spec 002` (proyectos), `spec 007` (participantes), `spec 008` (permisos) |

## 1. Contexto y problema

Al iniciar sesión, el usuario necesita una vista que le permita retomar rápidamente su trabajo: sus proyectos, aquellos en los que participa y proyectos públicos que puedan interesarle. Un listado plano obliga a buscar y no distingue el rol ni la relación con cada proyecto. El dashboard debe ser la vista inicial y funcionar incluso si la API falla, sin romper la página.

## 2. Objetivo

> Como **usuario autenticado**, quiero **visualizar un resumen de mis proyectos, participaciones y proyectos públicos** para **acceder rápidamente al proyecto que debo trabajar**.

## 3. Alcance

### Incluye

- Dashboard como vista inicial en `/`.
- Tres categorías: Mis proyectos, Participando y Públicos.
- Exclusividad: un proyecto aparece en una sola categoría.
- Galería tipo carrusel por categoría.
- Tarjetas con nombre, descripción, visibilidad, propietario y rol.
- Orden por actividad reciente.
- Límite por categoría y enlace "Ver todos".
- Estados vacíos por categoría.
- Aviso "Sin conexión" con reintento.
- Ruta protegida.

### No incluye

- Recomendación personalizada de proyectos.
- Actividad reciente o comentarios.
- Métricas de uso.
- Widgets configurables.
- Notificaciones.
- Modo offline con sincronización.
- Ordenación personalizable de categorías.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El dashboard presenta tres categorías: Mis proyectos, Participando y Públicos. | Must |
| RF-02 | Un proyecto aparece en una sola categoría: propietario → Mis proyectos; miembro no propietario → Participando; público de otros → Públicos. | Must |
| RF-03 | Cada categoría se muestra como carrusel horizontal con navegación por botones. | Must |
| RF-04 | Cada tarjeta muestra nombre, descripción recortada, visibilidad, propietario y rol cuando corresponda. | Must |
| RF-05 | Al hacer click en una tarjeta se navega al proyecto. | Must |
| RF-06 | Orden por `updatedAt` descendente. | Must |
| RF-07 | Se muestran hasta 12 elementos por categoría y un enlace "Ver todos" a la lista paginada con `scope`. | Must |
| RF-08 | Cada categoría tiene un estado vacío con mensaje y acción contextual cuando aplica. | Must |
| RF-09 | Si la API falla, se muestra "Sin conexión" con botón "Reintentar" sin romper la página. | Must |
| RF-10 | Requiere sesión; es la vista inicial tras login y registro. | Must |
| RF-11 | Los proyectos públicos son los más recientes de otros usuarios; no hay recomendación personalizada. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | El endpoint agrega las tres categorías y contadores en una sola llamada. | `GET /dashboard`. |
| RNF-02 | Las consultas están acotadas por `limit` y ordenadas por `updatedAt`. | Revisión de `dashboard.service.ts`. |
| RNF-03 | El carrusel es accesible por teclado y usa shadcn/embla. | Revisión de `carousel.tsx`. |
| RNF-04 | La UI muestra skeletons durante la carga. | Revisión visual. |
| RNF-05 | La página no requiere recarga para reintentar. | React Query `refetch`. |

## 6. Criterios de aceptación

### CA-01 · Mis proyectos

- **Dado** un usuario con proyectos,
- **cuando** abre `/`,
- **entonces** ve sus proyectos en "Mis proyectos".

### CA-02 · Participando

- **Dado** un usuario que participa en proyectos de otros,
- **cuando** abre el dashboard,
- **entonces** esos proyectos aparecen en "Participando" con su rol.

### CA-03 · Públicos

- **Dado** que existen proyectos públicos de otros,
- **cuando** abre el dashboard,
- **entonces** aparecen en "Públicos".

### CA-04 · Exclusividad de propietario

- **Dado** un proyecto del que soy propietario,
- **entonces** no aparece en "Participando" ni en "Públicos".

### CA-05 · Exclusividad de miembro

- **Dado** que soy miembro de un proyecto público,
- **entonces** aparece solo en "Participando".

### CA-06 · Carrusel

- **Dado** cualquier usuario,
- **entonces** los proyectos se muestran en un carrusel por categoría.

### CA-07 · Vacío de propios

- **Dado** un usuario sin proyectos creados,
- **entonces** ve el estado vacío de "Mis proyectos" con acción para crear uno.

### CA-08 · Vacío de participaciones

- **Dado** un usuario sin participaciones,
- **entonces** ve el estado vacío de "Participando".

### CA-09 · Sin conexión

- **Dada** una falla de conexión con la API,
- **cuando** abre o reintenta el dashboard,
- **entonces** ve "Sin conexión" y "Reintentar" sin que la página se rompa.

### CA-10 · Ruta protegida

- **Dado** un usuario anónimo,
- **cuando** intenta abrir `/`,
- **entonces** es redirigido a `/login`.

### CA-11 · Ver todos

- **Dado** que hay más elementos que el límite,
- **cuando** pulsa "Ver todos",
- **entonces** accede a la lista completa con el `scope` correspondiente.

### CA-12 · Tarjeta

- **Dado** un proyecto en el dashboard,
- **entonces** la tarjeta muestra nombre, descripción, visibilidad y propietario; y el rol cuando el usuario participa.

## 7. Contratos e interfaces

### API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/dashboard?limit=12` | Sí | Resumen en tres categorías |
| `GET` | `/api/v1/projects?scope=owned\|participating\|public\|all&cursor=&limit=` | Sí | Lista paginada para "Ver todos" |

### Respuesta

```json
{
  "owned": [ProjectCard],
  "participating": [ProjectCard],
  "public": [ProjectCard],
  "counts": { "owned": 4, "participating": 2, "public": 25 }
}
```

```json
{
  "id": "...",
  "name": "Álgebra lineal",
  "description": "...",
  "visibility": "PRIVATE",
  "updatedAt": "2026-10-04T...",
  "owner": { "username": "ana", "displayName": "Ana", "avatarUrl": "..." },
  "role": "viewer",
  "_count": { "folders": 3, "members": 5 }
}
```

### Datos

- No requiere tablas nuevas.
- Se apoya en `Project`, `ProjectMember` y `User`.

### UI

- `app/page.tsx`: dashboard.
- `project-card.tsx`: tarjeta reutilizable.
- `carousel.tsx`: carrusel shadcn/embla.
- `app/projects/page.tsx`: listado completo con `scope`.
- Login y registro redirigen a `/`.

## 8. Casos borde y errores

| Situación | Comportamiento esperado | Código/HTTP |
|---|---|---|
| Sin sesión | Redirigir a login | `AUTH_REQUIRED` · 401 |
| API no responde | Aviso y reintento | `NETWORK_ERROR` (cliente) |
| Sin proyectos propios | Estado vacío con CTA | — |
| Sin participaciones | Estado vacío | — |
| Sin públicos | Estado vacío | — |
| Más de 12 elementos | Mostrar "Ver todos" | — |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Dashboard en `/`, no en `/dashboard`. | Cerrada |
| D-02 | Exclusividad estricta entre categorías. | Cerrada |
| D-03 | Públicos = recientes de otros, sin recomendación. | Cerrada |
| D-04 | Carrusel con shadcn/embla. | Cerrada |
| D-05 | "Sin conexión" es fallo de red, no modo offline/PWA. | Cerrada |
| Q-01 | ¿Se añadirá recomendación personalizada? | Abierta (fuera de v1) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | No hay tests automatizados de exclusividad, límites y estado offline. | Regresiones de consultas no detectadas en CI. | `T-050` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01, CA-02, CA-03, CA-04, CA-05 | Consultas de `dashboard.service.ts` revisadas. | 2026-11-11 |
| CA-06, CA-11, CA-12 | Dashboard y carrusel verificados en el navegador. | 2026-11-05 |
| CA-07, CA-08 | Estados vacíos revisados. | 2026-11-05 |
| CA-09 | Aviso y reintento revisados en `app/page.tsx`. | 2026-11-11 |
| CA-10 | `proxy.ts` protege `/`. | 2026-11-11 |
