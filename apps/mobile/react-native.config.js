// React Native autolinking overrides.
//
// In this pnpm monorepo, RN autolinking mis-resolves the `expo` package's Android
// entry to the ancient `expo.core.ExpoModulesPackage` (which no longer exists in
// Expo SDK 52 — the real class is `expo.modules.ExpoModulesPackage`, per
// expo/react-native.config.js). We pin the correct import here so the generated
// PackageList.java compiles. This is a source-level override (survives prebuild).
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: {
          packageImportPath: 'import expo.modules.ExpoModulesPackage;',
          packageInstance: 'new ExpoModulesPackage()',
        },
      },
    },
  },
};
