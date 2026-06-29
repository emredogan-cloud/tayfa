// Metro bundler config wired for NativeWind (Tailwind → RN styles) and the
// pnpm/Turborepo monorepo (watch the workspace root so @tayfa/shared resolves).
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Let Metro see hoisted deps and the @tayfa/* workspace packages.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

// The spine (@tayfa/shared) is consumed via subpath exports ('@tayfa/shared/schemas',
// '/domain', …). We resolve those directly to source rather than enabling global
// package-exports (which breaks packages whose exports maps omit subpaths their
// consumers use, e.g. react-native-css-interop/jsx-runtime). Everything else falls
// through to Metro's default resolver.
const sharedSrc = path.resolve(workspaceRoot, 'packages/shared/src');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fallback = (name) => context.resolveRequest(context, name, platform);

  // @tayfa/shared subpath exports → source (avoids global package-exports, which
  // breaks packages whose exports maps omit consumed subpaths).
  if (moduleName === '@tayfa/shared') {
    return { type: 'sourceFile', filePath: path.join(sharedSrc, 'index.ts') };
  }
  if (moduleName.startsWith('@tayfa/shared/')) {
    const sub = moduleName.slice('@tayfa/shared/'.length);
    return { type: 'sourceFile', filePath: path.join(sharedSrc, sub, 'index.ts') };
  }

  // The spine uses ESM `.js` import specifiers (TS Bundler resolution). Metro
  // doesn't map `.js`→`.ts`, so on a failed `.js` resolution, retry extensionless
  // and let `sourceExts` find the `.ts`/`.tsx`. Real `.js` files still win first.
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    try {
      return fallback(moduleName);
    } catch {
      return fallback(moduleName.slice(0, -3));
    }
  }

  return fallback(moduleName);
};

module.exports = withNativeWind(config, { input: './global.css' });
