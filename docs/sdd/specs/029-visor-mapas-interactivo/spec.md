# Spec 029 · Visor interactivo y exportable de mapas mentales

| Campo | Valor |
|---|---|
| ID | `029` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-18` |
| Origen | Solicitud de producto: explorar el mapa completo, reordenar nodos y exportar la imagen |
| Dependencias | `013`, `021` |

## 1. Contexto y problema

El visor actual dibuja un SVG con un `viewBox` fijo y un layout radial. El usuario no puede desplazarse libremente por mapas grandes, no puede acercar o alejar, los nodos no se pueden mover y las aristas se dibujan de centro a centro, por lo que terminan pasando por encima de los nodos. Tampoco existe una forma de exportar el diagrama.

## 2. Objetivo

> Como **usuario que abre un mapa mental**, quiero **explorarlo con pan y zoom, reordenar sus nodos y exportar el diagrama como imagen**, para **estudiar mapas grandes y compartir el resultado fuera de la aplicación**.

## 3. Alcance

### Incluye

- Canvas interactivo con pan, zoom, controles y minimapa.
- Layout automático legible para grafos con ramas.
- Nodos arrastrables por el usuario.
- Aristas conectadas a los bordes de los nodos, con flechas y etiquetas.
- Botón “Ajustar vista”.
- Botón “Reorganizar” para volver al layout automático.
- Exportación del diagrama completo a PNG.
- Persistencia local de posiciones manuales por recurso.
- Tema claro/oscuro.
- Manejo de grafos con ciclos, múltiples raíces o nodos desconectados.

### No incluye

- Editar etiquetas, descripciones o relaciones.
- Crear o eliminar nodos o aristas.
- Guardar posiciones en el backend.
- Colaboración en tiempo real.
- Exportación a SVG o PDF en v1.
- Cambios en el JSON del mapa o en el backend.
- Edición colaborativa del layout.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El mapa se renderiza en un canvas interactivo con pan y zoom. | Must |
| RF-02 | El usuario puede acercar, alejar y ajustar el mapa completo a la vista. | Must |
| RF-03 | El usuario puede arrastrar nodos para reorganizar el diagrama. | Must |
| RF-04 | “Reorganizar” recalcula el layout automático y descarta las posiciones manuales. | Must |
| RF-05 | El canvas muestra controles de zoom y un minimapa. | Should |
| RF-06 | Las aristas nacen y terminan en los bordes de los nodos, no en sus centros. | Must |
| RF-07 | Las aristas se dibujan por debajo de los nodos y admiten etiquetas y flechas. | Must |
| RF-08 | Los nodos muestran etiqueta, tipo y una descripción breve cuando exista. | Should |
| RF-09 | El nodo raíz se distingue visualmente del resto. | Should |
| RF-10 | El usuario puede exportar el diagrama completo como PNG de alta resolución. | Must |
| RF-11 | La exportación incluye todos los nodos y aristas, aunque estén fuera del viewport. | Must |
| RF-12 | El PNG respeta el tema activo y no incluye controles ni minimapa. | Should |
| RF-13 | Las posiciones manuales se conservan en `localStorage` por recurso. | Should |
| RF-14 | La UI muestra carga, vacío y error. | Must |
| RF-15 | El visor funciona con mapas de hasta 100 nodos sin bloquear la interfaz. | Must |
| RF-16 | El visor mantiene el título, contador de nodos y contador de relaciones. | Must |
| RF-17 | Los mapas existentes se siguen abriendo sin cambios de contrato. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | No se ejecuta HTML ni scripts del JSON; solo se renderizan props de texto. | Revisión y build. |
| RNF-02 | El canvas respeta el tema claro/oscuro. | Revisión visual. |
| RNF-03 | El layout automático es determinista para el mismo JSON. | Test de función de layout. |
| RNF-04 | El zoom mínimo permite explorar mapas grandes y el máximo permite leer detalles. | Revisión visual. |
| RNF-05 | La exportación no bloquea el hilo principal de forma perceptible. | Prueba manual con 100 nodos. |
| RNF-06 | El visor es usable con teclado para controles y botones. | Revisión de accesibilidad. |
| RNF-07 | El bundle del canvas se carga solo al abrir un mapa. | Revisión del build y code splitting. |

## 6. Criterios de aceptación

### CA-01 · Pan y zoom

- **Dado** un mapa mental abierto,
- **cuando** el usuario arrastra el fondo o usa la rueda/controles,
- **entonces** el diagrama se desplaza y cambia de escala sin recortarse.

### CA-02 · Ajustar vista

- **Dado** un mapa con nodos fuera del viewport,
- **cuando** pulsa “Ajustar vista”,
- **entonces** todos los nodos quedan visibles.

### CA-03 · Reordenar nodos

- **Dado** un mapa abierto,
- **cuando** el usuario arrastra un nodo,
- **entonces** el nodo cambia de posición y sus aristas lo siguen.

### CA-04 · Reorganizar

- **Dado** un mapa con nodos movidos,
- **cuando** pulsa “Reorganizar”,
- **entonces** los nodos vuelven al layout automático.

### CA-05 · Aristas

- **Dado** un mapa con relaciones,
- **cuando** se renderiza,
- **entonces** las líneas conectan los bordes de los nodos, quedan detrás de ellos y muestran sus etiquetas.

### CA-06 · Exportar PNG

- **Dado** un mapa abierto,
- **cuando** pulsa “Exportar PNG”,
- **entonces** se descarga una imagen con el diagrama completo, sin controles ni minimapa.

### CA-07 · Tema

- **Dado** el tema oscuro activo,
- **cuando** se abre el mapa o se exporta,
- **entonces** nodos, fondo, aristas y texto usan el tema oscuro.

### CA-08 · Persistencia local

- **Dado** un nodo movido,
- **cuando** el usuario recarga el mapa,
- **entonces** la posición manual se conserva localmente.

### CA-09 · Mapa grande

- **Dado** un mapa de hasta 100 nodos,
- **cuando** se abre y se desplaza,
- **entonces** el canvas responde sin bloquear la UI.

### CA-10 · Compatibilidad

- **Dado** un mapa existente,
- **cuando** se abre,
- **entonces** conserva título, nodos, aristas y fuentes sin cambios en el backend.

## 7. Contratos e interfaces

### API

No hay cambios. Se sigue consumiendo `GET /api/v1/files/:resourceId/content` con el JSON actual:

```json
{
  "title": "Mapa",
  "nodes": [{ "id": "n1", "label": "Concepto", "type": "concept", "description": "..." }],
  "edges": [{ "source": "n1", "target": "n2", "label": "relación" }]
}
```

### UI

- `MindmapViewer` carga el JSON y monta el canvas.
- Toolbar: Ajustar vista, Reorganizar, Exportar PNG.
- Canvas con nodos y aristas.
- Minimapa y controles de zoom.
- Estados de carga, error y mapa vacío.

### Datos

- Sin cambios en Prisma, MinIO ni backend.
- `localStorage` key: `infinipaper.mindmap.layout.<resourceId>`.
- El layout guardado contiene solo posiciones `{ id, x, y }` y se invalida si los nodos no coinciden.

## 8. Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| Mapa sin nodos | Estado vacío, sin canvas roto. |
| Arista con nodo inexistente | Se ignora. |
| Grafo con ciclos | Layout automático sin bloqueo. |
| Múltiples raíces | Todas se posicionan; no se fuerza un único árbol. |
| Nodos desconectados | Se distribuyen en el layout sin desaparecer. |
| Falla la carga | Mensaje de error y reintento. |
| Falla la exportación | Toast de error; el mapa sigue usable. |
| `localStorage` corrupto | Se ignora y se recalcula el layout. |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Canvas con `@xyflow/react` (React Flow). | Cerrada |
| D-02 | Layout automático con `@dagrejs/dagre`. | Cerrada |
| D-03 | Exportación PNG con `html-to-image`. | Cerrada |
| D-04 | Posiciones manuales en `localStorage`, no en servidor. | Cerrada |
| D-05 | Nodos arrastrables, pero no editables en contenido. | Cerrada |
| Q-01 | ¿Exportación SVG/PDF en una fase posterior? | Abierta (v1: no) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin exportación SVG/PDF. | Solo se comparte PNG. | `T-090` |
| G-02 | Sin edición de etiquetas o relaciones. | Cambiar el contenido exige regenerar el mapa. | `T-091` |
| G-03 | Sin persistencia de posiciones en servidor. | El layout manual es local al navegador. | `T-092` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01 | La matriz del viewport cambió con rueda/zoom y arrastre del pane. | 2026-11-18 |
| CA-02 | “Ajustar vista” cambió el zoom de 0.82 a 0.274 y mostró el grafo completo. | 2026-11-18 |
| CA-03 | Nodo arrastrado con el mouse; sus aristas y posición se actualizaron. | 2026-11-18 |
| CA-04 | “Reorganizar” limpió `localStorage` y devolvió el nodo raíz a `24,24`. | 2026-11-18 |
| CA-05 | Las aristas conectan handles laterales, quedan detrás de las tarjetas y muestran etiquetas. | 2026-11-18 |
| CA-06 | Exportación PNG de 3600×2040 con el grafo completo, sin controles ni minimapa. | 2026-11-18 |
| CA-07 | Captura y exportación en tema oscuro con fondo, tarjetas, aristas y texto oscuros. | 2026-11-18 |
| CA-08 | 23 posiciones guardadas; tras recargar, el nodo movido conservó `translate(105.707px, 64.2439px)`. | 2026-11-18 |
| CA-09 | Mock de 100 nodos: React Flow renderizó los 100 sin bloquear la página. | 2026-11-18 |
| CA-10 | Mapa real de 23 nodos y 24 relaciones abierto sin cambios de backend. | 2026-11-18 |
| RNF-01–RNF-07 | `npm run lint` y `npm run build` correctos; exportación y temas verificados en navegador. | 2026-11-18 |
