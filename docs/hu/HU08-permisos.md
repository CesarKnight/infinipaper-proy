# HU08 · Gestión de permisos

| Campo | Valor |
|---|---|
| Módulo | Proyectos |
| Prioridad | Alta |
| Estimación | 8 PHU |
| Persona | Owner del proyecto |
| Dependencias | HU01, HU02, HU07 |

## 1. Objetivo

Como Owner, quiero asignar niveles de acceso a los participantes para controlar la visualización y edición del contenido.

## 2. Modelo de roles

| Rol | Descripción |
|---|---|
| **Owner** | Propietario único (`Project.ownerId`). Control total. No es una fila de `ProjectMember`. |
| **Editor** | Crea/edita/elimina carpetas, archivos, avisos y apuntes. Ejecuta transcripciones. |
| **Viewer** | Solo consulta. |

Acceso adicional: un proyecto **público** es legible por cualquier usuario, incluso anónimo.

### Matriz de permisos

| Acción | Viewer | Editor | Owner |
|---|:---:|:---:|:---:|
| Ver contenido | ✅ | ✅ | ✅ |
| Crear/editar/eliminar contenido | ❌ | ✅ | ✅ |
| Gestionar participantes | ❌ | ❌ | ✅ |
| Cambiar permisos | ❌ | ❌ | ✅ |
| Editar/eliminar proyecto | ❌ | ❌ | ✅ |

## 3. Reglas de negocio

1. Solo el Owner asigna o modifica permisos.
2. Un usuario tiene **un único** rol por proyecto.
3. Los permisos son a **nivel de proyecto** (no por carpeta/archivo).
4. El backend **siempre** verifica el permiso antes de ejecutar una operación restringida.
5. Al cambiar un rol, el efecto es inmediato en las siguientes peticiones.
6. El Owner no puede degradarse a sí mismo.
7. Un `Viewer` nunca puede modificar contenido, aunque encuentre el endpoint.

## 4. Flujos

### 4.1 Consultar permisos
1. El Owner ve la lista de participantes con su rol.

### 4.2 Asignar / modificar permiso
1. El Owner selecciona un participante y cambia su rol.
2. El sistema actualiza `ProjectMember.role`.

### 4.3 Aplicar permisos
1. Cada request pasa por `ProjectAccessGuard`.
2. El guard resuelve el rol efectivo (Owner → membresía → público anónimo).
3. Si no cumple el mínimo requerido, responde 403.

## 5. Criterios de aceptación

- **CA-1** Dado el Owner, entonces puede consultar el rol de cada participante.
- **CA-2** Dado el Owner, cuando asigna un rol, entonces se persiste.
- **CA-3** Dado un Viewer, cuando intenta modificar contenido, entonces `403 PROJECT_FORBIDDEN`.
- **CA-4** Dado un Editor, cuando crea/edita/elimina contenido, entonces la operación se permite.
- **CA-5** Dado un no-Owner, cuando intenta cambiar permisos, entonces `403 PROJECT_FORBIDDEN`.
- **CA-6** Dado un usuario sin acceso a un proyecto privado, cuando consulta un recurso, entonces `403 PROJECT_FORBIDDEN`.
- **CA-7** Dado un proyecto público, cuando un anónimo consulta contenido, entonces se permite solo lectura.
- **CA-8** Dado un cambio de rol, cuando el participante vuelve a operar, entonces el nuevo permiso aplica de inmediato.
- **CA-9** Dado que los guards están implementados en la Fase 0, entonces todas las operaciones restringidas quedan cubiertas por verificación en backend.

## 6. Diseño técnico

- `AuthGuard` (global): valida la sesión y adjunta `request.user`.
- `ProjectAccessGuard`: recibe `:projectId`/`:folderId`/`:fileId`, resuelve el proyecto y calcula el rol efectivo.
- Decorador `@RequireProjectRole('viewer' | 'editor' | 'owner')`.
- Jerarquía: `owner > editor > viewer > público(lectura)`.
- Un solo servicio `PermissionsService.resolveRole(userId | null, projectId)` reutilizado por todos los módulos.

## 7. Contrato de API

Los endpoints de permisos son los de HU07:

| Método | Ruta | Rol |
|---|---|---|
| GET | `/api/v1/projects/:id/members` | Viewer+ |
| PATCH | `/api/v1/projects/:id/members/:userId` | Owner |

## 8. Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `PROJECT_FORBIDDEN` | 403 | Rol insuficiente |
| `MEMBER_NOT_FOUND` | 404 | Participante inexistente |
| `OWNER_ROLE_IMMUTABLE` | 422 | El Owner intenta cambiarse el rol |

## 9. Fuera de alcance (v1)

Permisos granulares por recurso, roles personalizados, herencia de permisos por carpeta, auditoría de cambios de permisos, delegación de administración.
