# Modelo formal en Enterprise Architect

Este directorio prepara la importación del modelo SDD a **Enterprise Architect (EA)**, que será la herramienta de modelado formal del proyecto. Los diagramas Mermaid de `docs/sdd/diagramas/` son la vista de lectura; el modelo EA es la fuente formal.

## Archivos

| Archivo | Propósito |
|---|---|
| [`modelo.json`](./modelo.json) | Modelo canónico: actores, casos de uso, paquetes, C4, clases de base de datos, despliegue y secuencias |
| [`generar.mjs`](./generar.mjs) | Valida el modelo y genera el script de EA |
| [`importar-modelo.js`](./importar-modelo.js) | Script JScript generado, listo para ejecutar en EA |
| [`diseno-datos.json`](./diseno-datos.json) | Vistas y atributos principales del diseño de datos |
| [`generar-diseno-datos.mjs`](./generar-diseno-datos.mjs) | Genera el importador independiente de diseño de datos |
| [`importar-diseno-datos.js`](./importar-diseno-datos.js) | Script JScript del diseño de datos, listo para ejecutar en EA |

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
│   ├── Actores humanos
│   ├── UC-01 … UC-12 y UC-15 … UC-26
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
│   ├── 001 · Usuarios … 030 · Landing
│   └── 28 diagramas de secuencia
├── 05 · Base de datos
│   ├── User, Session, Project, ProjectMember, Folder, Resource
│   ├── TranscriptionJob, NoteStructureJob, ResourceExtraction
│   ├── UserStatus, ProjectVisibility, ProjectRole, ResourceKind
│   ├── TranscriptionStatus, AgentJobStatus
│   └── Diagrama "Base de datos · Modelo de clases"
└── 06 · Despliegue
    ├── Computadora cliente, teléfono móvil y Namecheap DNS
    ├── EC2, Ubuntu + Docker, Caddy, Next.js y NestJS
    ├── PostgreSQL, MinIO, Whisper, agentes y Mailpit
    ├── EBS, Elastic IP, Security Group, SSM y Secrets Manager
    └── Diagrama "Despliegue · AWS EC2 + app móvil"
```

En total: **6 ramas, 36 diagramas** (1 casos de uso, 1 paquetes, 4 C4, 1 base de datos, 1 despliegue y 28 secuencias).

### Idempotencia

El script **aborta** si ya existe el paquete raíz `Infinipaper SDD`. Para volver a importar:

1. Elimina el paquete `Infinipaper SDD` del repositorio EA.
2. Vuelve a ejecutar el script.

Esto evita duplicar elementos y diagramas.

## Script independiente de diseño de datos

Además del modelo completo, existe un importador separado para la vista de diseño de datos de [`docs/sdd/diagramas/clases.md`](../diagramas/clases.md):

```bash
node docs/sdd/ea/generar-diseno-datos.mjs
node --check docs/sdd/ea/importar-diseno-datos.js
```

El script crea un paquete raíz independiente:

```
Infinipaper · Diseño de datos
├── Diseño de datos · Vista general
├── Diseño de datos · Identidad y acceso
├── Diseño de datos · Proyectos y contenido
└── Diseño de datos · Evaluación
```

Características:

- 25 clases con atributos públicos en formato `+nombre: Tipo`.
- 44 relaciones de asociación, composición y dependencia.
- Multiplicidades y etiquetas en los extremos.
- Sin enums en el lienzo: se documentan en `clases.md`.
- Aborta si ya existe el paquete `Infinipaper · Diseño de datos`.

Se genera desde [`modelo.json`](./modelo.json) y [`diseno-datos.json`](./diseno-datos.json). Si cambia el modelo de datos, vuelve a ejecutar el generador.

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
- Clases, enums y relaciones del modelo de base de datos.
- Elementos, jerarquía y relaciones del modelo de despliegue.
- Alias de participantes y mensajes de cada secuencia.

## Convenciones del modelo

- **Caso de uso = spec:** `UC-01` corresponde a la spec `001`, y así sucesivamente. Las specs `013` y `014` son transversales de diseño y no tienen caso de uso; por eso no existen `UC-13` ni `UC-14`.
- **Actores:** `Visitante`, `Usuario`, `Owner`, `Editor`, `Viewer`, `Administrador`, `Docente` y `Estudiante`. El diagrama general de casos de uso solo incluye actores humanos; los sistemas externos (`Whisper ASR`, `MinIO`, `Mailpit`, `LLM` y `Cliente MCP`) se modelan en C4 y en los diagramas de secuencia.
- **Paquetes:** `infinipaper-frontend`, `infinipaper-backend` e `Infraestructura`.
- **C4:** los elementos usan estereotipos `person`, `system`, `external_system`, `container`, `container_db` y `component`.
- **Clases de base de datos:** `User`, `Session`, `EmailVerificationToken`, `TeacherProfile`, `AuditEvent`, `Project`, `ProjectMember`, `Folder`, `Resource`, `ResourceExtraction`, `TranscriptionJob`, `NoteStructureJob`, `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAssignment`, `QuizAssignmentStudent`, `QuizAttempt`, `QuizAnswer`, `ResourceSource`, `ContentGenerationJob`, `ResourceEvent`, `ResourceChunk`, `ContentIndexJob` y `McpToken`, con atributos, enums y relaciones. El diagrama EA es de base de datos y **no importa las clases de implementación** (controladores y servicios) que aparecen en `docs/sdd/diagramas/clases.md`.
- **Despliegue:** una sola EC2 en `us-east-2` con Docker Compose, Caddy, Next.js, NestJS, PostgreSQL, MinIO, Whisper, agentes, Mailpit y la app móvil Expo. Los nodos usan `Node` con estereotipos `device`, `executionEnvironment` o `awsResource`; los servicios usan `Component`; los sistemas externos usan `externalSystem`.
- **Secuencias:** cada diagrama usa lifelines con prefijo `NNN · ` para evitar colisiones entre specs (001–012 y 015–030).
- **Mensajes:** los conectores son de tipo `Sequence`; las respuestas se etiquetan en el nombre o en las notas.

## Limitaciones conocidas

- La automatización crea **lifelines y mensajes**, pero EA puede requerir ajustar la posición vertical de los mensajes, las activaciones y los fragmentos `alt`/`opt`. La semántica está en el modelo; la estética se pule en EA.
- Los mensajes de retorno no se marcan como `IsReturn` porque la API de automatización expone esa propiedad de forma inconsistente entre versiones de EA.
- El diagrama de paquetes usa el tipo `Logical`; si tu versión de EA tiene un tipo `Package` específico, puedes cambiarlo en `ensureDiagram` dentro del generador.
- El script no importa los textos completos de las specs; cada caso de uso lleva un resumen en `Notes`. La fuente de verdad del comportamiento sigue siendo `docs/sdd/specs/`.
- El diagrama de despliegue usa posiciones absolutas para que los nodos anidados queden dentro de su host. EA puede requerir un ajuste manual de tamaños y rutas después de la importación.

## Próximos pasos

1. Ejecutar la importación en una copia del repositorio EA y revisar el diff visual.
2. Ajustar la disposición de secuencias y las relaciones C4.
3. Añadir un script complementario para sincronizar cambios desde `modelo.json` sin recrear el paquete raíz.
4. Validar el modelo con las reglas de EA y enlazar cada `UC-*` con su spec mediante un *tagged value* o una nota.
