# Infinipaper Mobile

App Android/iOS en React Native + Expo SDK 58 para consultar proyectos, abrir recursos, descargar y subir material según el rol.

## Requisitos

- Node.js 20+
- Expo CLI (`npx expo`)
- Backend de Infinipaper en ejecución
- Para builds nativos: EAS o Android Studio/Xcode
- Android local: JDK 17+ con `javac` (no basta `jre17-openjdk`), Android SDK Platform 37.0, Build-Tools 37.0.0 y NDK 27.1.12297006. Gradle toma el SDK de `android/local.properties` (`sdk.dir=$HOME/Android/Sdk`).

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

Si el dispositivo físico no alcanza la API o Metro, abre los puertos en firewalld:

```bash
sudo firewall-cmd --zone=home --add-port=3001/tcp --add-port=8081/tcp
sudo firewall-cmd --zone=home --add-port=3001/tcp --add-port=8081/tcp --permanent
```

Como alternativa por USB puedes usar `adb reverse tcp:3001 tcp:3001` y configurar `EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1`.

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

## Build de producción (APK)

El APK de release se firma con un keystore propio (no con el keystore debug). La firma se
declara con el config plugin `plugins/with-release-signing.js`, que se reaplica en cada
`expo prebuild` leyendo `android/keystore.properties`.

1. Configura la URL pública de la API en `.env.production`:

   ```bash
   EXPO_PUBLIC_API_URL=https://infinipaper.lat/api/v1
   ```

   Ese archivo se carga automáticamente en modo producción; `.env` (local) no se usa.

2. Genera el keystore una sola vez y guárdalo fuera del repositorio:

   ```bash
   mkdir -p ~/.infinipaper-keys
   keytool -genkeypair -v -storetype PKCS12 -keystore ~/.infinipaper-keys/infinipaper-release.keystore \
     -alias infinipaper -keyalg RSA -keysize 2048 -validity 10000 \
     -dname "CN=Infinipaper, OU=Mobile, O=Infinipaper, L=Quito, ST=Pichincha, C=EC"
   ```

   Crea `~/.infinipaper-keys/credenciales.properties` con `STORE_FILE`, `STORE_PASSWORD`,
   `KEY_ALIAS` y `KEY_PASSWORD`. **Sin ese archivo no se pueden publicar actualizaciones**
   de la app con la misma firma.

3. Compila:

   ```bash
   ./scripts/build-android-release.sh
   ```

   Salida: `android/app/build/outputs/apk/release/app-release.apk`
   (`-P...` extra se pasa directo a Gradle, por ejemplo
   `./scripts/build-android-release.sh -PreactNativeArchitectures=arm64-v8a`).

Si falta `keystore.properties`, el build release se firma con el keystore debug y Gradle
emite una advertencia: ese APK no sirve para publicar.

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
- PDF embebido con `react-native-pdf`, zoom y paginación.
- DOCX/XLSX/PPTX mediante descarga y app nativa.
- Descarga/compartir.
- Subida para Owner/Editor desde archivo, galería o cámara.
- Verificación docente para Admin.
- Tokens, fuentes, logo, iconos y splash del design system.
- Tema claro, oscuro o del sistema, con cambio inmediato desde Perfil y persistencia local.

## Brechas

- Sin colaboración en tiempo real.
- Sin preview ofimática embebida.
- Sin resolución completa de quizzes.
- Sin tests E2E nativos automatizados.
