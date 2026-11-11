# SDD ligero · Proceso de desarrollo de Infinipaper

> **Versión:** 1.0 · **Fecha:** 2026-11-11
>
> Este proyecto usa **Spec-Driven Development (SDD) ligero**, sin CLI externo: la especificación, el plan y las tareas viven en Markdown dentro del repositorio y el agente las usa como contrato antes de escribir código.

## 1. Idea central

La spec describe **qué** se quiere y **por qué**; el plan describe **cómo** se resuelve; las tareas describen **qué pasos** se ejecutan. El código es la consecuencia, no el punto de partida.

```
Idea / necesidad
      │
      ▼
[ spec.md ] ── revisión ──► aprobada
      │
      ▼
[ plan.md ] ── revisión ──► aprobado
      │
      ▼
[ tasks.md ] ──► implementación por tareas
      │
      ▼
Verificación (CA + puertas de calidad)
      │
      ▼
Spec actualizada con evidencia y brechas
```

## 2. Estructura

```
docs/sdd/
├── README.md                  # este proceso
├── constitucion.md            # principios no negociables
├── nueva-spec.sh              # scaffold de specs
├── plantillas/
│   ├── spec.md                # qué y por qué
│   ├── plan.md                # cómo
│   └── tasks.md               # pasos verificables
├── referencia/                # documentación transversal vigente
│   ├── README.md
│   ├── infraestructura.md
│   ├── librerias.md
│   ├── modelo-datos.md
│   ├── decisiones.md
│   └── api.md
├── diagramas/                 # UML/C4 en Mermaid
│   ├── README.md
│   ├── casos-de-uso.md
│   ├── clases.md
│   ├── paquetes.md
│   ├── arquitectura-c4.md
│   └── secuencia/             # una secuencia por spec
├── ea/                        # modelo formal para Enterprise Architect
│   ├── README.md
│   ├── modelo.json
│   ├── generar.mjs
│   └── importar-modelo.js
└── specs/
    ├── README.md              # índice de specs
    ├── 001-usuarios/
    ├── …
    └── 011-dashboard/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

`specs/` es la única fuente vigente del comportamiento. `referencia/` contiene la documentación estable que las specs deben respetar: infraestructura, librerías, modelo de datos, decisiones y convenciones de API. `diagramas/` contiene las vistas UML/C4 en Mermaid, incluida una secuencia por spec. `ea/` contiene el modelo canónico y el script que crea el modelo formal en Enterprise Architect.

## 3. Flujo de trabajo

### Paso 1 · Crear o localizar la spec

- Si el cambio ya tiene spec, actualízala.
- Si es nuevo, crea `docs/sdd/specs/NNN-slug/spec.md` copiando la plantilla.
- `NNN` es secuencial (`001`, `002`, …) y `slug` es corto, en minúsculas y con guiones.
- Completa contexto, objetivos, alcance, requisitos `RF-*`/`RNF-*` y criterios `CA-*`.

### Paso 2 · Revisar y aprobar la spec

- El agente propone la spec; el responsable del proyecto la revisa.
- Sin aprobación explícita no se pasa a plan ni a implementación.
- Las dudas se resuelven en la sección de preguntas abiertas antes de planificar, no durante la implementación.

### Paso 3 · Escribir el plan

- Copia `plantillas/plan.md` en la misma carpeta.
- Describe el enfoque técnico, las decisiones y alternativas descartadas, los cambios por capa, los riesgos y el rollback.
- Debe citar los requisitos que resuelve y los archivos que tocará.

### Paso 4 · Desglosar tareas

- Copia `plantillas/tasks.md` en la misma carpeta.
- Agrupa por fases (preparación, datos, backend, frontend, pruebas, documentación).
- Cada tarea tiene ID `T-*`, referencia requisitos y es verificable.
- Marca `[x]` solo cuando la tarea esté realmente hecha y comprobada.

### Paso 5 · Implementar y verificar

- Implementa en el orden de las tareas, sin añadir alcance no especificado.
- Ejecuta las puertas de calidad de la constitución.
- Registra la evidencia de cada `CA-*` en la spec.
- Si aparece una brecha o un cambio de alcance, actualiza spec, plan y tareas antes de seguir.

## 4. Estados de una spec

| Estado | Significado | Qué se puede hacer |
|---|---|---|
| `Borrador` | Se está escribiendo, hay preguntas abiertas | Completar y discutir; no implementar |
| `Aprobada` | Requisitos y criterios aceptados | Planificar e implementar |
| `En implementación` | Hay tareas en curso | Ejecutar tareas aprobadas |
| `Implementada` | Criterios verificados y puertas de calidad superadas | Mantener y evolucionar |
| `Implementada con brechas` | Funciona, pero hay tareas o criterios pendientes documentados | Cerrar brechas o aceptarlas explícitamente |
| `Obsoleta` | Reemplazada por otra spec | No usar como fuente; enlazar a la nueva |

## 5. Cuándo se aplica

**Requiere spec:**

- Nuevas funcionalidades o cambios de comportamiento.
- Cambios de API, modelo de datos, permisos o variables de entorno.
- Cambios de UX que alteren flujos existentes.
- Refactors que modifiquen contratos internos relevantes.

**No requiere spec completa (basta una tarea o un commit documentado):**

- Corrección de typos, formato o comentarios.
- Actualización de dependencias sin cambio de comportamiento.
- Documentación que no cambia el producto.

**Urgencias:** un hotfix puede implementarse antes de la spec, pero debe registrarse una spec retroactiva el mismo día con el comportamiento corregido y la evidencia.

## 6. Trazabilidad

Usa identificadores estables y cítalos en todo el flujo:

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `RF-*` | Requisito funcional | `RF-04` autoguardado |
| `RNF-*` | Requisito no funcional | `RNF-02` sanitización |
| `CA-*` | Criterio de aceptación | `CA-02` guardado sin acción explícita |
| `T-*` | Tarea | `T-032` implementar `useAutosave` |
| `G-*` | Brecha conocida | `G-01` falta confirmación de borrado |
| `D-*` | Decisión | `D-03` normalizar extensión `.md` |

Una tarea sin `RF/CA` asociado es sospechosa: o falta un requisito o la tarea sobra.

## 7. Cómo crear una spec nueva

Forma rápida (calcula el siguiente número y copia las tres plantillas):

```bash
./docs/sdd/nueva-spec.sh mi-cambio
```

Equivale a hacerlo a mano:

```bash
mkdir -p docs/sdd/specs/002-mi-cambio
cp docs/sdd/plantillas/spec.md  docs/sdd/specs/002-mi-cambio/spec.md
cp docs/sdd/plantillas/plan.md  docs/sdd/specs/002-mi-cambio/plan.md
cp docs/sdd/plantillas/tasks.md docs/sdd/specs/002-mi-cambio/tasks.md
```

Luego:

1. Completa la spec y elimina las secciones que no apliquen.
2. Añádela a `docs/sdd/specs/README.md`.
3. No planifiques hasta que el estado sea `Aprobada`.

## 8. Checklist rápido antes de implementar

- [ ] ¿Existe una spec con estado `Aprobada`?
- [ ] ¿Los requisitos son verificables y no ambiguos?
- [ ] ¿Los criterios de aceptación cubren el camino feliz, permisos y errores?
- [ ] ¿El plan cita los archivos y contratos afectados?
- [ ] ¿Las tareas referencian `RF/CA` y tienen orden de ejecución?
- [ ] ¿Se identificaron riesgos y rollback?

## 9. Checklist rápido antes de cerrar

- [ ] Puertas de calidad de la constitución superadas.
- [ ] Cada `CA-*` tiene evidencia.
- [ ] Las brechas están en `G-*` con tarea asociada o aceptación explícita.
- [ ] La spec quedó en el estado correcto.
- [ ] `docs/README.md` y la documentación afectada están actualizadas.

## 10. Relación con el agente

El archivo [`AGENTS.md`](../../AGENTS.md) de la raíz obliga al agente a seguir este proceso. En la práctica:

1. Lee `constitucion.md` y este README.
2. Localiza o crea la spec.
3. Propone spec/plan/tareas y espera aprobación cuando el cambio no sea trivial.
4. Implementa solo lo trazable.
5. Verifica y actualiza la spec.

## 11. Ejemplo piloto

Todas las capacidades del producto están migradas como specs `001`–`011`. La spec [`009-apuntes`](./specs/009-apuntes/spec.md) es un buen ejemplo de nivel de detalle y de cómo registrar brechas reales en lugar de ocultarlas.
