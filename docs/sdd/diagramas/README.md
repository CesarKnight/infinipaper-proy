# Diagramas SDD

Diagramas de referencia del sistema, escritos en **Mermaid** para que se rendericen en GitHub, VS Code y la mayoría de visores Markdown.

| Diagrama | Archivo | Propósito |
|---|---|---|
| Casos de uso | [`casos-de-uso.md`](./casos-de-uso.md) | Actores y las 11 historias de usuario como casos de uso |
| Clases | [`clases.md`](./clases.md) | Modelo de dominio (Prisma) y clases de implementación del backend |
| Paquetes | [`paquetes.md`](./paquetes.md) | Paquetes del frontend, backend e infraestructura |
| Arquitectura C4 | [`arquitectura-c4.md`](./arquitectura-c4.md) | Contexto, contenedores y componentes |
| Secuencias | [`secuencia/`](./secuencia/) | Un diagrama por spec (001–011) |

## Convenciones

- **Caso de uso = spec.** Cada `UC-NN` corresponde a la spec `NNN` del índice SDD.
- Los identificadores `UC-*`, `RF-*`, `CA-*` y `T-*` son estables y se usan también en el modelo de Enterprise Architect.
- Los diagramas describen el comportamiento **vigente**; si una spec cambia, se actualiza su diagrama.
- Mermaid no tiene un tipo nativo de diagrama UML de casos de uso: se representa con un `flowchart` y nodos tipo *stadium*. Es una aproximación visual, no un metamodelo UML formal. El modelo formal se mantiene en Enterprise Architect.

## Renderizado

- **GitHub:** renderiza Mermaid automáticamente en bloques ` ```mermaid `.
- **VS Code:** extensión `Markdown Preview Mermaid Support`.
- **Mermaid Live:** <https://mermaid.live>.

## Relación con Enterprise Architect

`docs/sdd/ea/modelo.json` contiene el modelo canónico (actores, casos de uso, paquetes, componentes, clases y secuencias). El script `docs/sdd/ea/generar.mjs` genera `importar-modelo.js`, que crea el modelo formal en Enterprise Architect. Consulta [`../ea/README.md`](../ea/README.md) para ejecutarlo. Los diagramas Mermaid y el modelo EA deben mantenerse alineados.
