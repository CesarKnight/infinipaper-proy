# Infinipaper Mobile

App Android/iOS en React Native + Expo SDK 58 para consultar proyectos, abrir recursos, descargar y subir material según el rol.

## Requisitos

- Node.js 20+
- Expo CLI (`npx expo`)
- Backend de Infinipaper en ejecución
- Para builds nativos: EAS o Android Studio/Xcode

## Configuración

```bash
cp .env.example .env
# Edita EXPO_PUBLIC_API_URL según tu entorno
npm install
```

| Entorno | URL |
|---|---|
| iOS simulator / web | `http://localhost:3001/api/v1` |
| Android emulator | `http://10.0.2.2:3001/api/v1` |
| Dispositivo físico | `http://<IP-LAN>:3001/api/v1` |

La autenticación móvil usa `POST /auth/mobile/login` o `/register` y guarda el token en SecureStore. Las peticiones envían `X-Mobile-Session`; la web sigue usando cookie `httpOnly`.

## Ejecutar

```bash
npx expo start
npm run android
npm run ios
npm run web
```

Expo Go sirve para una primera revisión, pero la app usa módulos nativos (`expo-secure-store`, `react-native-webview`, `expo-video`, `expo-audio`, etc.). Para la app final usa un development build:

```bash
npx expo run:android
npx expo run:ios
# o
npx eas-cli@latest build --profile development
```

## Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform android
```

## Funcionalidad

- Login/registro y sesión persistente.
- Dashboard de proyectos y cursos.
- Carpetas y recursos.
- Imagen, PDF, audio, video y Markdown.
- DOCX/XLSX/PPTX mediante descarga y app nativa.
- Descarga/compartir.
- Subida para Owner/Editor desde archivo, galería o cámara.
- Verificación docente para Admin.
- Tokens, fuentes, logo, iconos y splash del design system.

## Brechas

- Sin colaboración en tiempo real.
- Sin preview ofimática embebida.
- Sin resolución completa de quizzes.
- Sin tests E2E nativos automatizados.
