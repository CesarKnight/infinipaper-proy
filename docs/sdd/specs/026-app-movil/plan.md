# Plan 026 · App móvil

| Campo | Valor |
|---|---|
| Spec | [`spec.md`](./spec.md) |
| Estado | `Completado con brechas` |
| Fecha | `2026-11-18` |

## 1. Resumen

Se crea `infinipaper-mobile` con Expo SDK 58, Expo Router, React Query, SecureStore y módulos nativos. La app consume la misma API con `X-Mobile-Session`, reutiliza el design system y ofrece dashboard, carpetas, visores, descarga y subida según rol.

## 2. Decisiones

- React Native + Expo por reutilización de TypeScript/React.
- Development build/EAS para módulos nativos.
- Token móvil opaco, no cookie web.
- Office mediante descarga + app del sistema.
- Splash animado con logo de marca.

## 3. Cambios

- Backend: endpoints `auth/mobile/*` y extracción de `X-Mobile-Session`.
- Mobile: tema, componentes, auth, tabs, proyectos, detalle, visor y admin.
- Assets: iconos, fuentes y splash del design system.
- Documentación y configuración `EXPO_PUBLIC_API_URL`.

## 4. Pruebas

- `npx tsc --noEmit`.
- `npm run lint`.
- `npx expo-doctor`.
- `npx expo export --platform android`.
- E2E web: registro, dashboard, proyecto, carpeta y visor Markdown.
- API móvil: register, me, logout.

## 5. Rollback

Eliminar `infinipaper-mobile` y los endpoints `auth/mobile/*`. La web no cambia.
