/**
 * Config plugin: firma de release con keystore propio.
 *
 * `android/` es un directorio generado (CNG) y está en .gitignore, por lo que
 * cualquier cambio manual en android/app/build.gradle se pierde al ejecutar
 * `expo prebuild`. Este plugin reaplica el cambio de forma reproducible.
 *
 * Lee `android/keystore.properties` (generado por scripts/build-android-release.sh
 * a partir de ~/.infinipaper-keys/credenciales.properties) con las claves:
 *
 *   STORE_FILE=/ruta/absoluta/al/keystore
 *   STORE_PASSWORD=...
 *   KEY_ALIAS=...
 *   KEY_PASSWORD=...
 *
 * Si el archivo no existe, el build release cae al keystore debug (útil para
 * desarrollo local), pero avisa al compilar release.
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const BEGIN = "// @generated begin infinipaper-release-signing - expo prebuild (DO NOT MODIFY)";
const END = "// @generated end infinipaper-release-signing";

const KEYSTORE_READER = `${BEGIN}
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
} else if (gradle.startParameter.taskNames.any { it.toLowerCase().contains("release") }) {
    logger.warn("[infinipaper] android/keystore.properties no encontrado: el build release se firmara con el keystore debug.")
}
${END}

`;

const SIGNING_CONFIGS_ANCHOR = "    signingConfigs {\n";
const SIGNING_CONFIGS_INSERT = `    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            release {
                storeFile file(keystoreProperties["STORE_FILE"])
                storePassword keystoreProperties["STORE_PASSWORD"]
                keyAlias keystoreProperties["KEY_ALIAS"]
                keyPassword keystoreProperties["KEY_PASSWORD"]
            }
        }
`;

const RELEASE_SIGNING_ANCHOR = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const RELEASE_SIGNING_REPLACEMENT = `        release {
            signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug`;

const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "with-release-signing: android/app/build.gradle debe estar en Groovy.",
      );
    }

    let contents = config.modResults.contents;

    if (contents.includes(BEGIN)) {
      return config;
    }

    if (!contents.includes(SIGNING_CONFIGS_ANCHOR)) {
      throw new Error(
        "with-release-signing: no se encontró el bloque signingConfigs en android/app/build.gradle.",
      );
    }
    if (!contents.includes(RELEASE_SIGNING_ANCHOR)) {
      throw new Error(
        "with-release-signing: no se encontró el bloque release dentro de buildTypes en android/app/build.gradle.",
      );
    }

    contents = contents.replace(SIGNING_CONFIGS_ANCHOR, SIGNING_CONFIGS_INSERT);
    contents = contents.replace(RELEASE_SIGNING_ANCHOR, RELEASE_SIGNING_REPLACEMENT);

    // El lector de propiedades va a nivel de script (fuera de `android { }`)
    // para que las closures de signingConfigs/buildTypes puedan acceder a él.
    contents = contents.replace(/\nandroid \{/, `\n${KEYSTORE_READER}android {`);

    config.modResults.contents = contents;
    return config;
  });

module.exports = withReleaseSigning;
