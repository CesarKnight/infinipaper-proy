#!/usr/bin/env bash
#
# Compila un APK de release firmado para Android.
#
# Requisitos:
#   - ~/.infinipaper-keys/credenciales.properties y el keystore referenciado
#   - Android SDK (por defecto ~/Android/Sdk) y JDK 17+
#   - .env.production con EXPO_PUBLIC_API_URL
#
# Uso:
#   ./scripts/build-android-release.sh            # prebuild + assembleRelease
#   SKIP_PREBUILD=1 ./scripts/build-android-release.sh
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CREDENTIALS="${INFINIPAPER_KEYSTORE_CREDENTIALS:-$HOME/.infinipaper-keys/credenciales.properties}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

cd "$PROJECT_ROOT"

if [[ ! -f .env.production ]]; then
  echo "error: falta .env.production (define EXPO_PUBLIC_API_URL de producción)." >&2
  exit 1
fi

if [[ -n "${SKIP_PREBUILD:-}" ]]; then
  echo "==> prebuild omitido (SKIP_PREBUILD=1)"
else
  echo "==> expo prebuild (android)"
  npx expo prebuild --platform android --no-install
fi

if [[ ! -f "$CREDENTIALS" ]]; then
  echo "error: no existe $CREDENTIALS; el APK saldría firmado con el keystore debug." >&2
  exit 1
fi

echo "==> escribiendo android/keystore.properties"
install -m 600 "$CREDENTIALS" android/keystore.properties

echo "==> gradle :app:assembleRelease"
./android/gradlew -p android :app:assembleRelease "$@"

APK="android/app/build/outputs/apk/release/app-release.apk"
echo
echo "APK: $PROJECT_ROOT/$APK"
ls -lh "$APK"
