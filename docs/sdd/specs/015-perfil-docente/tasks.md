# Tasks 015 · Perfil docente, verificación y confirmación de email

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Plan | [`plan.md`](./plan.md) |
| Estado | `Completado con brechas` |

## Fase 0 · Preparación

- [x] `T-001` Confirmar decisiones de roles, verificación híbrida y Mailpit. <D-01–D-05>
- [x] `T-002` Añadir Mailpit y variables SMTP. <RF-14>

## Fase 1 · Datos

- [x] `T-010` Añadir roles globales, verificación de email, perfil docente y auditoría. <RF-01–RF-13>
- [x] `T-011` Migración versionada y generación de Prisma Client. <RNF-01>

## Fase 2 · Backend

- [x] `T-020` Implementar `EmailService` con `nodemailer`. <RF-02, RF-14>
- [x] `T-021` Implementar token de confirmación y endpoints de email. <RF-02–RF-04>
- [x] `T-022` Implementar `TeacherService` y verificación híbrida. <RF-05–RF-11>
- [x] `T-023` Implementar `RolesGuard`, cola admin y auditoría. <RF-08, RF-13>
- [x] `T-024` Exponer rol y verificación en perfil público. <RF-12>

## Fase 3 · Frontend

- [x] `T-030` Página `/verify-email`. <CA-01–CA-03>
- [x] `T-031` Tarjetas de correo y solicitud docente en perfil. <CA-04–CA-07>
- [x] `T-032` Página admin de verificaciones. <CA-06–CA-08>
- [x] `T-033` Insignias de rol/docente en perfil público. <RF-12>

## Fase 4 · Verificación

- [x] `T-040` E2E manual: Mailpit, confirmación, solicitud, aprobación y rol. <CA-01–CA-06>
- [x] `T-041` Verificar rechazo/permisos de admin. <CA-07, CA-08>
- [x] `T-042` Backend: `npm run lint && npm test && npm run build`. <RNF>
- [x] `T-043` Frontend: `npm run lint && npm run build`. <RNF>

- [x] `T-044` Diagramas Mermaid, casos de uso y modelo EA actualizados. <RNF>

## Brechas

- [ ] `T-060` UI para revocar docentes (el endpoint existe). <G-01>
- [ ] `T-061` Cola de reintentos/outbox para correo. <G-02>
- [ ] `T-062` Tests automatizados de Auth/Teacher. <G-03>
- [ ] `T-063` SSO institucional y validación documental. <G-04>
