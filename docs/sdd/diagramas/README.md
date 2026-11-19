# Diagramas SDD

Diagramas de referencia del sistema, escritos en **Mermaid** para que se rendericen en GitHub, VS Code y la mayoría de visores Markdown.

| Diagrama | Archivo | Propósito |
|---|---|---|
| Casos de uso | [`casos-de-uso.md`](./casos-de-uso.md) | Actores humanos y 24 casos de uso (001–012 y 015–026) |
| Clases | [`clases.md`](./clases.md) | Diseño de datos en cuatro vistas (general, identidad, contenido y evaluación), enums y referencia de implementación |
| Paquetes | [`paquetes.md`](./paquetes.md) | Paquetes del frontend, backend, agentes e infraestructura |
| Arquitectura C4 | [`arquitectura-c4.md`](./arquitectura-c4.md) | Contexto, contenedores y componentes de backend y agentes |
| Despliegue | [`despliegue.md`](./despliegue.md) | Nodos AWS, contenedores, red, secretos y app móvil |
| Secuencias | [`secuencia/`](./secuencia/) | Un diagrama por spec (001–012 y 015–030) |

## Convenciones

- **Caso de uso = spec.** Cada `UC-NN` corresponde a la spec `NNN` del índice SDD. Las specs `013` y `014` son de diseño y tema, sin caso de uso funcional.
- Los identificadores `UC-*`, `RF-*`, `CA-*` y `T-*` son estables y se usan también en el modelo de Enterprise Architect.
- Los diagramas describen el comportamiento **vigente**; si una spec cambia, se actualiza su diagrama.
- Mermaid no tiene un tipo nativo de diagrama UML de casos de uso ni de despliegue: se representan con `flowchart` y estereotipos `«device»`, `«executionEnvironment»` y `«component»`. Es una aproximación visual, no un metamodelo UML formal. El modelo formal se mantiene en Enterprise Architect.

## Renderizado

- **GitHub:** renderiza Mermaid automáticamente en bloques ` ```mermaid `.
- **VS Code:** extensión `Markdown Preview Mermaid Support`.
- **Mermaid Live:** <https://mermaid.live>.

## Relación con Enterprise Architect

`docs/sdd/ea/modelo.json` contiene el modelo canónico (actores, casos de uso, paquetes, componentes, clases, despliegue y secuencias). El script `docs/sdd/ea/generar.mjs` genera `importar-modelo.js`, que crea el modelo formal en Enterprise Architect. La vista de diseño de datos tiene además su propio importador: `docs/sdd/ea/importar-diseno-datos.js`, generado desde `diseno-datos.json`. Consulta [`../ea/README.md`](../ea/README.md) para ejecutarlos. Los diagramas Mermaid y el modelo EA deben mantenerse alineados.
