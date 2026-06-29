/**
 * Expo config plugin — persistent Android build fixes (applied on every prebuild
 * so they survive `expo prebuild --clean` and work in CI/EAS).
 *
 * 1. Kotlin version: expo-modules-core (SDK 52) applies the Compose compiler
 *    1.5.15, which REQUIRES Kotlin 1.9.25, but RN 0.76 resolves the Kotlin Gradle
 *    plugin to 1.9.24 → `compileDebugKotlin` fails. We pin the plugin to the
 *    `kotlinVersion` ext (1.9.25) and set `android.kotlinVersion`.
 *
 * The expo autolinking mis-resolution (expo.core vs expo.modules) is fixed
 * separately + persistently in apps/mobile/react-native.config.js.
 */
const { withProjectBuildGradle, withGradleProperties } = require('expo/config-plugins');

const withAndroidBuildFixes = (config) => {
  config = withProjectBuildGradle(config, (c) => {
    if (c.modResults.language === 'groovy') {
      c.modResults.contents = c.modResults.contents.replace(
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")',
      );
    }
    return c;
  });

  config = withGradleProperties(config, (c) => {
    const setProp = (key, value) => {
      const existing = c.modResults.find((i) => i.type === 'property' && i.key === key);
      if (existing) existing.value = value;
      else c.modResults.push({ type: 'property', key, value });
    };
    setProp('android.kotlinVersion', '1.9.25');
    return c;
  });

  return config;
};

module.exports = withAndroidBuildFixes;
