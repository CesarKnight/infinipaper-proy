# Tasks 001 · Usuarios, autenticación y sesiones

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Definir autenticación sin roles de plataforma y sesión server-side. <RF-15, D-01>
- [x] `T-002` Definir el contrato de errores de auth y perfil. <CA-02, CA-03, CA-05, CA-06>

## Fase 1 · Datos

- [x] `T-010` Crear `User` con `status` y perfil; `Session` con `tokenHash` y `expiresAt`. <RF-04, RF-05>
- [x] `T-011` Garantizar unicidad de `username` y `email`; normalizar a minúsculas. <RF-02>

## Fase 2 · Backend

- [x] `T-012` Implementar registro y login por email o username. <RF-01, RF-03>
- [x] `T-013` Implementar `SessionService`, cookie `httpOnly` y logout. <RF-05, RF-13, CA-12>
- [x] `T-014` Implementar `AuthGuard` global y `@Public()`. <RF-05>
- [x] `T-020` Implementar edición de perfil y cambio de contraseña. <RF-06, RF-08, CA-07, CA-08>
- [x] `T-021` Implementar subida y lectura de avatar en MinIO. <RF-07>
- [x] `T-022` Implementar búsqueda de usuarios y perfil público. <RF-12, RF-14, CA-11>
- [x] `T-023` Implementar archivado con cascada de proyectos privados y sesiones. <RF-09, RF-10, RF-11, CA-09, CA-10>
- [x] `T-024` Exponer `GET /api/v1/config` para límites públicos. <RF-07>

## Fase 3 · Frontend

- [x] `T-030` Crear páginas de login y registro con validación y errores. <RF-01, RF-03>
- [x] `T-031` Crear perfil con edición, avatar, contraseña y archivado. <RF-06, RF-07, RF-08, RF-09>
- [x] `T-032` Crear búsqueda de usuarios y perfil público. <RF-12, RF-14>
- [x] `T-033` Integrar logout y estado de sesión en el header. <RF-13>
- [x] `T-034` Proteger rutas en `proxy.ts` y redirigir a login. <RF-05, RNF-03>

## Fase 4 · Verificación

- [x] `T-040` Verificar registro, login, logout y perfil con Playwright. <CA-01, CA-04, CA-12>
- [x] `T-041` Verificar duplicados y errores de credenciales. <CA-02, CA-03, CA-05, CA-06>
- [x] `T-042` Verificar archivado y cascada de proyectos privados. <CA-09, CA-10>
- [x] `T-043` Backend: `npm run lint && npm run build`. <RNF>
- [x] `T-044` Frontend: `npm run lint && npm run build`. <RNF>
- [ ] `T-050` Añadir tests automatizados de auth, sesiones y archivado. <G-01>

## Verificación final

- [x] Criterios funcionales cubiertos por flujo manual y revisión.
- [x] Sin migraciones pendientes.
- [x] Documentación de referencia enlazada.
- [ ] Cobertura automatizada de auth (G-01).
