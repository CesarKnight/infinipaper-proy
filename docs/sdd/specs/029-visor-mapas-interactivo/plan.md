# Plan 029 · Visor interactivo y exportable de mapas mentales

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | `2026-11-18` |
| Autor | Equipo Infinipaper |

## 1. Resumen de la solución

Se reemplaza el SVG radial por un canvas **React Flow** (`@xyflow/react`) con layout automático calculado con `@dagrejs/dagre`. Los nodos se renderizan como tarjetas HTML con handles de entrada/salida; las aristas usan `smoothstep`, flechas y etiquetas, y quedan detrás de los nodos. El canvas incluye pan/zoom, controles, minimapa, “Ajustar vista”, “Reorganizar” y exportación PNG con `html-to-image`. Las posiciones manuales se guardan en `localStorage` por recurso.

## 2. Contexto técnico actual

- `infinipaper-frontend/components/mindmap/mindmap-viewer.tsx` usa un SVG con `viewBox="0 0 800 600"` y un layout radial propio.
- El JSON del mapa ya contiene `nodes` y `edges`; no requiere cambios de backend.
- La spec 021 propuso `@xyflow/react` pero el visor implementado quedó como SVG básico.
- El proyecto usa React 19, Next.js 16 App Router y Tailwind v4.
- `sonner` ya está disponible para toasts.
- No hay test runner de componentes frontend configurado; la verificación principal será build, lint y Playwright manual.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | `@xyflow/react` | SVG propio, `vis-network`, `cytoscape` | Pan/zoom, nodos HTML, handles, minimapa y ecosistema React maduro |
| D-02 | `@dagrejs/dagre` para layout automático | Radial propio | Layout jerárquico legible y determinista para grafos académicos |
| D-03 | `html-to-image` para exportar PNG | Canvas manual, `dom-to-image` | Exporta HTML/SVG del viewport sin reimplementar el render |
| D-04 | Nodos arrastrables, sin edición de contenido | Editor completo de nodos | Mantiene el alcance y evita tocar el JSON/backend |
| D-05 | Persistencia local de posiciones | Backend o sin persistencia | Reordenar sobrevive a recargas sin cambios de modelo |
| D-06 | Carga dinámica de `html-to-image` | Import estático | Reduce el bundle inicial del visor |
| D-07 | Exportar solo el viewport del diagrama | Capturar toda la página | Evita incluir controles, minimapa o cabecera |

## 4. Cambios por capa

### Datos

- Sin migraciones ni cambios Prisma.
- `localStorage` con posiciones manuales:
  - key: `infinipaper.mindmap.layout.<resourceId>`;
  - valor: `{ version: 1, positions: { [nodeId]: { x, y } } }`.
- Si los IDs guardados no coinciden con los nodos actuales, se descarta el layout.

### Backend

- Sin cambios.

### Frontend

- Instalar:
  - `@xyflow/react`;
  - `@dagrejs/dagre`;
  - `html-to-image`.
- Importar `@xyflow/react/dist/style.css` en el layout raíz.
- Reemplazar `components/mindmap/mindmap-viewer.tsx`.
- Nuevos componentes/helpers:
  - `components/mindmap/mindmap-node.tsx`: tarjeta de nodo con handles, tipo, label y descripción.
  - `components/mindmap/mindmap-layout.ts`: dagre → posiciones; fallback para grafos sin aristas.
- Toolbar:
  - “Ajustar vista” (`fitView`);
  - “Reorganizar” (recalcula layout y limpia posiciones guardadas);
  - “Exportar PNG”.
- Exportación:
  - `getNodesBounds` + `getViewportForBounds`;
  - `toPng` sobre `.react-flow__viewport`;
  - fondo desde `--background`;
  - `pixelRatio: 2`;
  - nombre desde el título del mapa.
- Estilos:
  - nodos con `bg-card`, `text-card-foreground`, borde y sombra;
  - raíz con acento `primary`;
  - aristas con `stroke: var(--muted-foreground)` y flechas;
  - minimapa y controles adaptados al tema.
- Estados:
  - carga con skeleton;
  - error con reintento;
  - mapa vacío con mensaje.
- Sin cambios en rutas ni contratos.

### Infraestructura

- Solo dependencias frontend y su lockfile.
- El CSS de React Flow se sirve desde el bundle de Next.

## 5. Contratos

El JSON de entrada no cambia. El componente transforma:

```ts
type MindmapFlowNode = Node<{
  label: string;
  type?: string;
  description?: string;
  isRoot?: boolean;
}, "mindmap">;
```

Las aristas se generan desde `MindmapEdge` y se descartan si `source` o `target` no existen.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Unitario | Layout dagre determinista, fallback y filtrado de aristas | Vitest o script de verificación |
| Build | El visor y las dependencias compilan en Next.js | `npm run build` |
| Lint | Sin errores de tipos ni reglas | `npm run lint` |
| Manual | Pan, zoom, arrastre, reorganizar, minimapa y exportación | Playwright / navegador |
| Tema | Claro y oscuro, incluido el PNG | Revisión visual |
| Regresión | Abrir un mapa existente sin cambios de backend | Navegador |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Exportación recorta nodos | Media | Alto | Usar `getNodesBounds` y exportar el viewport completo |
| Layout ilegible con ciclos | Media | Medio | Dagre + fallback radial/grid |
| Bundle grande | Media | Bajo | Carga dinámica de `html-to-image` |
| Posiciones locales obsoletas | Media | Bajo | Validar IDs y descartar layout incompatible |
| CSS de React Flow choca con el tema | Media | Medio | Variables y overrides acotados |
| Nodos HTML grandes | Baja | Medio | Ancho fijo, descripción truncada y `onlyRenderVisibleElements` |

## 8. Rollback

- Revertir el componente al SVG anterior y retirar las dependencias.
- El JSON y el backend no cambian, por lo que no hay migración que revertir.
- Limpiar las claves `infinipaper.mindmap.layout.*` es opcional.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-frontend/package.json` / `package-lock.json` | Dependencias nuevas |
| `infinipaper-frontend/app/layout.tsx` | Importar CSS de React Flow |
| `infinipaper-frontend/components/mindmap/mindmap-viewer.tsx` | Reemplazar el visor SVG |
| `infinipaper-frontend/components/mindmap/mindmap-node.tsx` | Nuevo nodo personalizado |
| `infinipaper-frontend/components/mindmap/mindmap-layout.ts` | Nuevo layout dagre/fallback |
| `infinipaper-frontend/lib/types.ts` | Tipos auxiliares si hace falta |
| `infinipaper-frontend/app/globals.css` | Ajustes de React Flow/tema |
| `docs/sdd/specs/029-*` | Spec, plan y tareas |
| `docs/sdd/specs/README.md` | Índice |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01–RF-05 | `T-020`, `T-021`, `T-030`, `T-031` |
| RF-06–RF-09 | `T-022`, `T-023`, `T-032` |
| RF-10–RF-12 | `T-033`, `T-041` |
| RF-13 | `T-024`, `T-034` |
| RF-14–RF-17 | `T-025`, `T-035`, `T-042` |
| G-01–G-03 | `T-090`–`T-092` |
