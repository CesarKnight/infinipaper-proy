# Modelo formal en Enterprise Architect

Este directorio prepara la importación del modelo SDD a **Enterprise Architect (EA)**, que será la herramienta de modelado formal del proyecto. Los diagramas Mermaid de `docs/sdd/diagramas/` son la vista de lectura; el modelo EA es la fuente formal.

## Archivos

| Archivo | Propósito |
|---|---|
| [`modelo.json`](./modelo.json) | Modelo canónico: actores, casos de uso, paquetes, C4, clases y secuencias |
| [`generar.mjs`](./generar.mjs) | Valida el modelo y genera el script de EA |
| [`importar-modelo.js`](./importar-modelo.js) | Script JScript generado, listo para ejecutar en EA |

## Requisitos

- Enterprise Architect 16 o superior en Windows.
- Un repositorio EA abierto (archivo `.qea`/`.eapx` o repositorio de base de datos).
- Permiso para crear paquetes y diagramas.
- Node.js 20+ solo si vas a regenerar el script; no es necesario para ejecutarlo dentro de EA.

## Ejecutar la importación en EA

1. Abre el repositorio EA donde quieres crear el modelo.
2. Ve a **Develop > Scripting** (o **Tools > Scripting** según la versión).
3. Crea un grupo de scripts, por ejemplo `Infinipaper SDD`.
4. Crea un script nuevo de tipo **JScript** llamado `Importar modelo SDD`.
5. Pega el contenido completo de [`importar-modelo.js`](./importar-modelo.js) o importa el archivo.
6. Ejecuta el script y revisa la ventana **System Output**.

El script crea un paquete raíz llamado **`Infinipaper SDD`** con estas ramas:

```
Infinipaper SDD
├── 01 · Casos de uso
│   ├── Actores
│   ├── UC-01 … UC-11
│   └── Diagrama "Casos de uso · Infinipaper"
├── 02 · Paquetes
│   ├── Sistema
│   │   ├── infinipaper-frontend
│   │   ├── infinipaper-backend
│   │   └── Infraestructura
│   └── Diagrama "Paquetes · Infinipaper"
├── 03 · Arquitectura C4
│   ├── C4 · Contexto
│   ├── C4 · Contenedores
│   ├── C4 · Componentes del backend
│   └── C4 · Componentes de agentes
├── 04 · Secuencias
│   ├── 001 · Usuarios … 012 · Estructuración IA
│   └── 12 diagramas de secuencia
└── 05 · Clases
    ├── User, Session, Project, ProjectMember, Folder, Resource
    ├── TranscriptionJob, NoteStructureJob
    ├── UserStatus, ProjectVisibility, ProjectRole, ResourceKind
    ├── TranscriptionStatus, AgentJobStatus
    └── Diagrama "Clases · Modelo de dominio"
```

En total: **5 ramas, 19 diagramas** (1 casos de uso, 1 paquetes, 4 C4, 1 clases y 12 secuencias).

### Idempotencia

El script **aborta** si ya existe el paquete raíz `Infinipaper SDD`. Para volver a importar:

1. Elimina el paquete `Infinipaper SDD` del repositorio EA.
2. Vuelve a ejecutar el script.

Esto evita duplicar elementos y diagramas.

## Regenerar el script

El archivo `importar-modelo.js` es generado; no lo edites a mano.

```bash
node docs/sdd/ea/generar.mjs
node --check docs/sdd/ea/importar-modelo.js
```

El generador valida:

- Actores y casos de uso únicos.
- Referencias de actores en cada caso de uso.
- Rutas de paquetes y dependencias existentes.
- Referencias de elementos y relaciones C4.
- Clases, enums y relaciones del modelo de dominio.
- Alias de participantes y mensajes de cada secuencia.

## Convenciones del modelo

- **Caso de uso = spec:** `UC-01` corresponde a la spec `001`, y así sucesivamente.
- **Actores:** `Visitante`, `Usuario`, `Owner`, `Editor`, `Viewer`, `Whisper ASR` y `MinIO`.
- **Paquetes:** `infinipaper-frontend`, `infinipaper-backend` e `Infraestructura`.
- **C4:** los elementos usan estereotipos `person`, `system`, `external_system`, `container`, `container_db` y `component`.
- **Clases:** `User`, `Session`, `Project`, `ProjectMember`, `Folder`, `Resource`, `TranscriptionJob` y `NoteStructureJob`, con atributos, enums y relaciones de composición, asociación y dependencia.
- **Secuencias:** cada diagrama usa lifelines con prefijo `NNN · ` para evitar colisiones entre specs.
- **Mensajes:** los conectores son de tipo `Sequence`; las respuestas se etiquetan en el nombre o en las notas.

## Limitaciones conocidas

- La automatización crea **lifelines y mensajes**, pero EA puede requerir ajustar la posición vertical de los mensajes, las activaciones y los fragmentos `alt`/`opt`. La semántica está en el modelo; la estética se pule en EA.
- Los mensajes de retorno no se marcan como `IsReturn` porque la API de automatización expone esa propiedad de forma inconsistente entre versiones de EA.
- El diagrama de paquetes usa el tipo `Logical`; si tu versión de EA tiene un tipo `Package` específico, puedes cambiarlo en `ensureDiagram` dentro del generador.
- El script no importa los textos completos de las specs; cada caso de uso lleva un resumen en `Notes`. La fuente de verdad del comportamiento sigue siendo `docs/sdd/specs/`.

## Próximos pasos

1. Ejecutar la importación en una copia del repositorio EA y revisar el diff visual.
2. Ajustar la disposición de secuencias y las relaciones C4.
3. Añadir un script complementario para sincronizar cambios desde `modelo.json` sin recrear el paquete raíz.
4. Validar el modelo con las reglas de EA y enlazar cada `UC-*` con su spec mediante un *tagged value* o una nota.
