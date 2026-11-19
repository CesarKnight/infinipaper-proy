# Plan 030 · Landing page y sitio corporativo

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | `2026-11-18` |
| Autor | Equipo Infinipaper |

## 1. Resumen

Se añade una landing pública en `/landing` y un placeholder corporativo en `/empresa`. El proxy de Next reescribe `/` a `/landing` solo cuando no hay cookie de sesión; los usuarios autenticados conservan el dashboard actual. La landing reutiliza los tokens y logos de la marca, presenta el problema de infoxicación y las capacidades del producto, y ofrece CTAs a login/registro y al sitio corporativo.

## 2. Contexto técnico actual

- `app/page.tsx` es el dashboard autenticado.
- `proxy.ts` protege `/` y redirige a `/login` cuando no hay sesión.
- `AuthShell` ya contiene una propuesta visual de marca y copy base.
- `ThemeToggle`, `Button`, `Badge` y los tokens de `app/globals.css` están disponibles.
- No hay landing pública ni página corporativa.

## 3. Decisiones de diseño

| ID | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| D-01 | Rewrite de `/` a `/landing` para visitantes | Mover dashboard a `/dashboard` | Evita tocar login, enlaces y el flujo autenticado |
| D-02 | Página corporativa provisional en `/empresa` | Enlace externo | Permite tener una URL propia sin construir el sitio completo |
| D-03 | Copy breve inspirado en el documento | Copiar la introducción completa | La landing debe comunicar, no reproducir el documento |
| D-04 | Sin dependencias nuevas | Librería de animaciones o iconos extra | Ya existen Tailwind, lucide y el sistema de diseño |
| D-05 | Header/footer compartidos | Duplicar markup | Mantiene consistencia y reduce cambios |

## 4. Cambios por capa

### Datos

- Sin cambios.

### Backend

- Sin cambios.

### Frontend

- Crear `app/landing/page.tsx`.
- Crear `app/empresa/page.tsx`.
- Crear `components/marketing/marketing-header.tsx`.
- Crear `components/marketing/marketing-footer.tsx`.
- Crear `components/marketing/product-preview.tsx` si el mockup se separa.
- Actualizar `proxy.ts`:
  - `/` sin sesión → rewrite a `/landing`;
  - `/` con sesión → dashboard actual;
  - no cambiar la protección de `/projects` ni `/profile`.
- Añadir metadata a landing y empresa.
- Enlazar `/empresa` desde el footer y el header.
- Reutilizar `ThemeToggle` y el logo claro/oscuro.

### Infraestructura

- Sin cambios.

## 5. Contratos

No hay contratos nuevos. El proxy mantiene la cookie `session` y añade un rewrite interno.

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Herramienta |
|---|---|---|
| Manual | `/` sin sesión muestra landing | Navegador/Playwright |
| Manual | `/` con sesión muestra dashboard | Navegador/Playwright |
| Manual | CTAs a login, registro y empresa | Navegador |
| Manual | `/empresa` y vuelta a la landing | Navegador |
| Visual | 320, 768 y 1440 px; claro y oscuro | Navegador |
| Build | `npm run lint` y `npm run build` | Comandos locales |

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El rewrite afecta a usuarios autenticados | Baja | Alto | Probar `/` con y sin cookie |
| Textos demasiado largos | Media | Medio | Copy breve por bloques |
| Contraste insuficiente en el hero | Media | Medio | Usar tokens y revisar ambos temas |
| Enlaces corporativos sin destino | Baja | Bajo | `/empresa` es una página real, aunque provisional |

## 8. Rollback

- Revertir `app/landing`, `app/empresa`, componentes de marketing y el rewrite de `proxy.ts`.
- El dashboard y la API no cambian.
- No hay migraciones ni datos que conservar.

## 9. Archivos afectados

| Archivo | Cambio |
|---|---|
| `infinipaper-frontend/app/landing/page.tsx` | Crear |
| `infinipaper-frontend/app/empresa/page.tsx` | Crear |
| `infinipaper-frontend/components/marketing/marketing-header.tsx` | Crear |
| `infinipaper-frontend/components/marketing/marketing-footer.tsx` | Crear |
| `infinipaper-frontend/proxy.ts` | Rewrite de `/` para visitantes |
| `infinipaper-frontend/app/globals.css` | Ajustes visuales de landing si hacen falta |
| `docs/sdd/specs/030-*` | Spec, plan y tareas |
| `docs/sdd/specs/README.md` | Índice |

## 10. Trazabilidad

| Requisito | Tareas |
|---|---|
| RF-01, RF-02 | `T-020`, `T-021` |
| RF-03–RF-06 | `T-010`, `T-011`, `T-030`, `T-031` |
| RF-07–RF-09 | `T-012`, `T-022` |
| RF-10–RF-15 | `T-013`, `T-023`, `T-032`, `T-033`, `T-040` |
| G-01–G-03 | `T-090`–`T-092` |
