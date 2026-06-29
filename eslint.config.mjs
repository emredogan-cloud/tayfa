// Flat ESLint config (ESLint 9). Shared by every workspace package.
// Quality bar (mission §QUALITY BAR): strict TypeScript, no `any`, no dead code.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/next-env.d.ts',
      '**/.expo/**',
      '**/expo-env.d.ts',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.config.{js,cjs,mjs,ts}',
      '**/plugins/**', // Expo config plugins are build-time Node CommonJS
      '**/migrations/**',
      'assets/**',
      'reports/**',
      'roadmaps/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-restricted-syntax': [
        'error',
        {
          // Safety invariant: never trust a client-supplied entitlement flag.
          selector: "MemberExpression[property.name='isPremiumFromClient']",
          message:
            'Entitlements are server-side source of truth (RevenueCat). Never trust a client flag.',
        },
      ],
    },
  },
);
