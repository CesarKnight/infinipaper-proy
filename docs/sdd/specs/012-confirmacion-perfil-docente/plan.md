# Plan 012 · Confirmación de perfil docente (HU11)

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Aprobado` |
| Fecha | 2026-11-11 |

## 1. Resumen de la solución

Se amplía el modelo `User` con los atributos `isTeacher` y `teacherVerifiedAt` para identificar cuentas docentes verificadas sin crear un rol de plataforma separado. El módulo `users` expone un nuevo endpoint protegido que valida un código institucional definido por entorno y actualiza el estado del usuario. En el frontend, la página `/profile` incorpora una sección de verificación docente y muestra una insignia cuando la cuenta está confirmada.

## 2. Contexto técnico actual

- `UsersController` y `UsersService` gestionan la información del usuario autenticado en `/api/v1/users/me`.
- `env.validation.ts` valida las variables de entorno cargadas por `@nestjs/config`.
- `infinipaper-frontend/app/profile/page.tsx` renderiza el formulario de edición de perfil y cambio de contraseña.

## 3. Decisiones de diseño

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Atributo booleano `isTeacher` en `User` | Nuevo enum de roles globales | Mantiene compatibilidad con RF-15 de Spec 001 |
| D-02 | Código de verificación en variable de entorno `TEACHER_VERIFICATION_CODE` | Tabla de códigos de un solo uso en v1 | Reduce complejidad inicial y cumple el alcance académico |
| D-03 | Verificación irreversible desde la UI de usuario | Permitir activar/desactivar libremente | Evita cambios de estado accidentales al crear cuestionarios |

## 4. Cambios por capa

### Datos

- Añadir `isTeacher Boolean @default(false)` y `teacherVerifiedAt DateTime?` al modelo `User` en `schema.prisma`.
- Generar migración `add_teacher_profile`.

### Backend

- Añadir `TEACHER_VERIFICATION_CODE` en `env.validation.ts` y `.env.example`.
- Crear `VerifyTeacherDto` en `src/modules/users/dto/`.
- Añadir `POST /api/v1/users/me/teacher-verification` en `UsersController` y su lógica en `UsersService`.
- Incluir `isTeacher` y `teacherVerifiedAt` en las respuestas de `auth/me` y `users/:username`.

### Frontend

- Actualizar interfaz `User` en `lib/types.ts` y agregar función `verifyTeacherProfile` en `lib/api.ts`.
- Añadir tarjeta "Confirmación de perfil docente" en `app/profile/page.tsx`.
- Mostrar insignia `Badge` de "Docente" junto al nombre en el perfil.

### Infraestructura

- Configurar `TEACHER_VERIFICATION_CODE` en `infinipaper-backend/.env` y `docker-compose.yml`.

## 5. Contratos

```http
POST /api/v1/users/me/teacher-verification
{ "code": "DOCENTE-2026" }
```

Respuesta exitosa (`200 OK`):
```json
{ "isTeacher": true, "teacherVerifiedAt": "2026-11-11T20:00:00.000Z" }
```

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual/E2E | Confirmación con código válido, rechazo con código inválido y doble confirmación | Navegador / Swagger |
| Unitario | `UsersService.verifyTeacher` | Vitest |

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Filtración del código institucional en frontend | Medio | Validación exclusivamente en el backend mediante variable de entorno |
| Falta de variable en despliegue | Bajo | Valor por defecto o validación obligatoria en `env.validation.ts` |

## 8. Rollback

- Revertir el código del módulo `users` y la vista `/profile`.
- En base de datos, los campos `isTeacher` y `teacherVerifiedAt` tienen valores por defecto seguros y no afectan consultas existentes.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-backend/prisma/schema.prisma` | Campos `isTeacher` y `teacherVerifiedAt` en `User` |
| `infinipaper-backend/src/common/config/env.validation.ts` | Variable `TEACHER_VERIFICATION_CODE` |
| `infinipaper-backend/src/modules/users/*` | DTO, controlador y servicio de verificación docente |
| `infinipaper-frontend/lib/types.ts` | Propiedades docentes en `User` |
| `infinipaper-frontend/lib/api.ts` | Llamada HTTP a `teacher-verification` |
| `infinipaper-frontend/app/profile/page.tsx` | Formulario e insignia de perfil docente |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02, RF-03 | `T-010`, `T-011`, `T-020` |
| RF-04 | `T-012` |
| RF-05 | `T-013` |
