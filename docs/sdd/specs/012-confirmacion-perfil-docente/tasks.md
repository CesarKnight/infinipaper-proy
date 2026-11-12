# Tasks 012 · Confirmación de perfil docente (HU11)

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Aprobado` |

## Fase 0 · Preparación

- [x] `T-001` Definir atributo `isTeacher` en `User` sin alterar roles globales. <D-01>
- [x] `T-002` Definir contrato de errores `TEACHER_INVALID_CODE` y `TEACHER_ALREADY_VERIFIED`. <CA-02, CA-03>

## Fase 1 · Datos

- [ ] `T-010` Añadir `isTeacher` (`Boolean`) y `teacherVerifiedAt` (`DateTime?`) a `User` en `schema.prisma` y ejecutar migración. <RF-03>

## Fase 2 · Backend

- [ ] `T-011` Añadir `TEACHER_VERIFICATION_CODE` en `env.validation.ts` y `.env.example`. <RF-02, RNF-01>
- [ ] `T-012` Crear `VerifyTeacherDto` y validar código no vacío. <RNF-02>
- [ ] `T-013` Implementar `POST /api/v1/users/me/teacher-verification` en `UsersController` y `UsersService`. <RF-01, RF-03, RF-04, CA-01, CA-02, CA-03>
- [ ] `T-014` Exponer `isTeacher` y `teacherVerifiedAt` en `GET /auth/me` y `GET /users/:username`. <RF-05>

## Fase 3 · Frontend

- [ ] `T-020` Actualizar tipo `User` en `lib/types.ts` y añadir `verifyTeacherProfile` en `lib/api.ts`. <RF-05>
- [ ] `T-021` Añadir sección de confirmación docente e insignia verificada en `/profile`. <RF-01, CA-01>

## Fase 4 · Verificación

- [ ] `T-030` Verificar confirmación exitosa, código inválido y rechazo por doble confirmación. <CA-01, CA-02, CA-03>
- [ ] `T-031` Backend: `npm run lint && npm run build`. <RNF>
- [ ] `T-032` Frontend: `npm run lint && npm run build`. <RNF>

## Verificación final

- [ ] Criterios funcionales cubiertos.
- [ ] Sin migraciones pendientes.
- [ ] Documentación de referencia actualizada.