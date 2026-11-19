# Tasks 030 · Landing page y sitio corporativo

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Convenciones

- `[ ]` pendiente · `[x]` hecho y verificado.
- Cada tarea cita requisitos o criterios.

## Fase 0 · Preparación

- [x] `T-001` Confirmar texto, rutas y alcance. <RF-01–RF-14>
- [x] `T-002` Revisar tokens, logos y componentes de marketing existentes. <RF-10>

## Fase 1 · Rutas y proxy

- [x] `T-010` Crear `/landing` y su metadata. <RF-01, RF-03, RF-12>
- [x] `T-011` Añadir rewrite de `/` a `/landing` solo sin sesión. <RF-01, RF-02, CA-01, CA-02>
- [x] `T-012` Crear `/empresa` y enlace de vuelta. <RF-08, RF-09, CA-04>
- [x] `T-013` Verificar que `/projects` y `/profile` conservan su protección. <RF-14, CA-07>

## Fase 2 · Landing

- [x] `T-020` Implementar hero y mockup de producto. <RF-03, RF-04>
- [x] `T-021` Implementar secciones de problema, capacidades y pasos. <RF-03–RF-05>
- [x] `T-022` Añadir CTAs de login, registro y empresa. <RF-06, RF-07>
- [x] `T-023` Implementar header/footer de marketing compartidos. <RF-10, RF-11>

## Fase 3 · Corporativo

- [x] `T-030` Implementar presentación provisional de la empresa. <RF-08>
- [x] `T-031` Añadir servicios, enfoque y aviso de sitio en construcción. <RF-08>
- [x] `T-032` Enlazar de vuelta a la landing y al login. <RF-09>
- [x] `T-033` Añadir sección de equipo con retratos, nombres y roles. <RF-15, CA-08>

## Fase 4 · Verificación

- [x] `T-040` Verificar `/` con y sin sesión. <CA-01, CA-02>
- [x] `T-041` Verificar responsive en 320, 768 y 1440 px. <RNF-01, RNF-05, CA-05>
- [x] `T-042` Verificar tema claro/oscuro y contraste. <RNF-02, RNF-03, CA-06>
- [x] `T-043` Ejecutar `npm run lint` y `npm run build`. <RNF-07>

## Fase 5 · Documentación y cierre

- [x] `T-050` Actualizar spec con evidencia y estado. <RNF-07>
- [x] `T-051` Actualizar índice de specs y docs afectadas. <RNF-07>
- [x] `T-052` Registrar brechas `G-*`. <G-01–G-03>

## Fase 6 · Brechas diferidas

- [ ] `T-090` Formulario/email de contacto corporativo. <G-01>
- [ ] `T-091` Definir nombre comercial de la empresa. <G-02>
- [ ] `T-092` CMS o contenido editable para la landing. <G-03>

## Verificación final

- [x] Todos los `CA-*` tienen evidencia.
- [x] No quedan tareas obligatorias pendientes.
- [x] La spec está en el estado correcto.
- [x] El plan de rollback está documentado.
