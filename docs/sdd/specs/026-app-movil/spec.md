# Spec 026 · App móvil Infinipaper

| Campo | Valor |
|---|---|
| ID | `026` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-18` |
| Dependencias | `001`, `005`, `008`, `015`, `016`, `017`, `019`, `020` |

## 1. Contexto y problema

La web ya cubre la gestión académica, pero el estudiante y el docente necesitan consultar material, descargarlo y subir archivos desde el móvil. La app debe compartir la identidad visual, respetar los mismos permisos y no exponer la cookie `httpOnly` de la web.

## 2. Objetivo

> Como **miembro de un proyecto**, quiero **abrir mis proyectos y recursos, descargarlos y —si tengo permisos— subir material desde el móvil** para **trabajar con el curso sin depender del escritorio**.

## 3. Alcance

### Incluye

- App Expo / React Native para Android e iOS.
- Login/registro con sesión móvil persistente en SecureStore.
- Dashboard de proyectos.
- Carpetas y recursos del proyecto.
- Visores de imagen, PDF, audio, video y Markdown.
- Apertura de DOCX/XLSX/PPTX mediante descarga y app nativa.
- Descarga y compartir archivos.
- Subida de archivos con selector, galería y cámara para Owner/Editor.
- Verificación docente para Admin.
- Tokens, tipografías, logos e iconos del sistema de diseño.
- Splash con animación de marca, sin marco circular alrededor del logo.
- Tema claro, oscuro o del sistema, con cambio dinámico desde Perfil.

### No incluye

- Colaboración en tiempo real.
- Edición móvil de Markdown u ofimáticos.
- Resolución completa de cuestionarios dentro de la app.
- Previsualización ofimática embebida: se abre con la app del dispositivo.
- Push notifications.
- Modo offline avanzado.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | La app usa Expo Router y TypeScript estricto. | Must |
| RF-02 | La sesión móvil se autentica con `X-Mobile-Session` y se guarda en SecureStore. | Must |
| RF-03 | El dashboard lista proyectos con rol, tipo, visibilidad y estado. | Must |
| RF-04 | El proyecto lista carpetas y recursos. | Must |
| RF-05 | Los visores cubren imagen, PDF, audio, video y Markdown. | Must |
| RF-06 | DOCX/XLSX/PPTX se descargan y abren con la app nativa. | Must |
| RF-07 | Cualquier miembro con lectura puede descargar/compartir. | Must |
| RF-08 | Owner/Editor ven el botón de subida; Student no. | Must |
| RF-09 | La subida admite archivos, galería y cámara. | Must |
| RF-10 | Admin puede aprobar/rechazar verificaciones docentes. | Must |
| RF-11 | La app usa tokens, fuentes, logo e iconos del design system. | Must |
| RF-12 | Al abrir la app se muestra una animación de splash con la marca. | Should |
| RF-13 | La app muestra estados de carga, vacío y error. | Must |
| RF-14 | La app no usa la cookie web ni el proxy de Next. | Must |
| RF-15 | El usuario puede elegir tema claro, oscuro o del sistema; el cambio se aplica al instante y persiste. | Must |
| RF-16 | Login, registro y splash usan los colores del tema activo. | Must |
| RF-17 | El logo del splash y de acceso se muestra sin marco circular. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | `npx tsc --noEmit`, `npm run lint` y `npx expo-doctor` pasan. | Comandos locales. |
| RNF-02 | El bundle Android se genera con `npx expo export --platform android`. | Build. |
| RNF-03 | El token nunca se guarda en AsyncStorage sin cifrar. | SecureStore en nativo; localStorage solo en web de desarrollo. |
| RNF-04 | La app respeta claro/oscuro y tamaños táctiles de 44 px. | Revisión visual. |
| RNF-05 | La API móvil mantiene los permisos del servidor. | E2E de roles. |
| RNF-06 | La preferencia de tema sobrevive al cierre y reapertura de la app. | SecureStore/localStorage + reapertura. |

## 6. Criterios de aceptación

### CA-01 · Registro y login
- **Dado** un usuario nuevo, **cuando** crea cuenta o inicia sesión, **entonces** recibe una sesión móvil y entra al dashboard.

### CA-02 · Persistencia
- **Dado** un usuario autenticado, **cuando** reabre la app, **entonces** mantiene la sesión.

### CA-03 · Proyectos y carpetas
- **Dado** un usuario con proyectos, **cuando** abre uno, **entonces** ve carpetas y recursos.

### CA-04 · Visor
- **Dado** un recurso, **cuando** lo abre, **entonces** usa el visor correspondiente o el fallback de descarga.

### CA-05 · Descarga
- **Dado** un recurso accesible, **cuando** pulsa descargar, **entonces** se descarga y se abre/comparte.

### CA-06 · Subida
- **Dado** un Owner/Editor, **cuando** sube un archivo, **entonces** aparece en la carpeta.

### CA-07 · Rol Student
- **Dado** un Student, **cuando** abre un proyecto, **entonces** no ve el botón de subida.

### CA-08 · Admin
- **Dado** un Admin, **cuando** abre verificaciones, **entonces** puede aprobar o rechazar solicitudes.

### CA-09 · Identidad
- **Dado** el arranque, **entonces** se muestra splash animado y la app usa la marca.

### CA-10 · Error
- **Dado** un fallo de red, **entonces** la app muestra un mensaje y permite reintentar.

### CA-11 · Cambio de tema
- **Dado** un usuario autenticado en Perfil, **cuando** elige Claro, Oscuro o Sistema, **entonces** toda la interfaz cambia al instante y la preferencia se conserva al reabrir.

### CA-12 · Acceso con tema
- **Dado** el tema oscuro activo, **cuando** el usuario cierra sesión, **entonces** login y registro se muestran oscuros, incluidos sus paneles y campos.

### CA-13 · Logo sin marco
- **Dado** el splash o una pantalla de acceso, **entonces** el logo de Infinipaper aparece sin círculo ni marco de fondo.

## 7. Contratos e interfaces

### API móvil

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/auth/mobile/register` | Registro y token móvil |
| `POST` | `/api/v1/auth/mobile/login` | Login y token móvil |
| `POST` | `/api/v1/auth/mobile/logout` | Revocar sesión |
| `GET` | `/api/v1/auth/me` | Usuario actual |
| Resto de API | — | Misma API, con `X-Mobile-Session` |

### Pantallas

- `(auth)/login`, `(auth)/register`.
- `(tabs)/index` Proyectos.
- `(tabs)/tasks` Tareas.
- `(tabs)/profile` Perfil.
- `project/[id]` Proyecto y carpetas.
- `file/[id]` Visor.
- `admin/teacher-verifications` Verificación docente.

### Configuración

- `EXPO_PUBLIC_API_URL` define el backend.
- `http://10.0.2.2:3001/api/v1` por defecto en emulador Android.
- `http://localhost:3001/api/v1` en iOS/web.

## 8. Casos borde y errores

| Situación | Comportamiento |
|---|---|
| Token expirado/revocado | Volver a login |
| Archivo no soportado | Descarga/compartir |
| Sin permiso de subida | Ocultar FAB y rechazar en servidor |
| Cámara sin permiso | Mostrar aviso |
| Red caída | Mensaje y reintento |
| Office sin app nativa | Compartir archivo |
| Nombre codificado por Expo | El backend decodifica el nombre solo si la subida trae `X-Mobile-Session`. |

## 9. Decisiones

| ID | Decisión | Estado |
|---|---|---|
| D-01 | React Native + Expo en lugar de Flutter. | Cerrada |
| D-02 | Sesión móvil por cabecera `X-Mobile-Session`. | Cerrada |
| D-03 | Office se abre con app nativa, no render embebido. | Cerrada |
| D-04 | Design system compartido por assets y tokens. | Cerrada |
| D-05 | EAS/development build para módulos nativos. | Cerrada |
| D-06 | Preferencia de tema `light`, `dark` o `system` persistida en SecureStore (nativo) y localStorage (web). | Cerrada |
| D-07 | El logo de marca no se encierra en un círculo ni en un contenedor con fondo. | Cerrada |
| Q-01 | ¿Se añadirá colaboración CRDT móvil? | Abierta (futuro) |
| Q-02 | ¿Se resolverán quizzes completos en móvil? | Abierta (futuro) |

## 10. Brechas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin colaboración en tiempo real. | Solo lectura/edición web. | `T-070` |
| G-02 | Sin preview ofimática embebida. | Depende de apps externas. | `T-071` |
| G-03 | Sin resolución completa de quizzes. | El estudiante usa la web para evaluaciones. | `T-072` |
| G-04 | Sin tests E2E nativos automatizados. | Cobertura manual/web. | `T-073` |
| G-05 | Cámara y galería no se validaron en un dispositivo físico. | El selector de documentos sí se validó; falta probar permisos y captura reales. | `T-074` |

## 11. Evidencia

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01–CA-03 | Registro móvil, login, dashboard, proyecto y carpeta validados en Expo Web y en Android con backend real. | 2026-11-18 |
| CA-04 | Visores Markdown validados en Android; el resto de visores ya estaba validado en web. | 2026-11-18 |
| CA-05 | Descarga, guardado en `Download` y compartir validados en Android. | 2026-11-18 |
| CA-06 | Subida desde selector de documentos validada en Android (APK debug) con archivo Markdown; se corrigió la incompatibilidad de `FormData` de Expo SDK 58 y la decodificación del nombre móvil. | 2026-11-18 |
| CA-09 | Splash animado y tokens de marca implementados. | 2026-11-18 |
| CA-11 | Cambio Claro/Oscuro/Sistema validado en Android; el tema oscuro se mantuvo tras cerrar y reabrir la app. | 2026-11-18 |
| CA-12 | Login y registro oscuros validados en Android con el tema oscuro activo. | 2026-11-18 |
| CA-13 | Login y splash usan el logo sin marco circular; login verificado visualmente en Android. | 2026-11-18 |
| RNF-01–RNF-02 | TypeScript, lint, expo-doctor, build nativo Android (`assembleDebug`) y `expo export` correctos. | 2026-11-18 |

> Diagramas: [UC-26](../../diagramas/casos-de-uso.md) · [Secuencia 026](../../diagramas/secuencia/026-app-movil.md).

