import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import nextPlugin from '@next/eslint-plugin-next';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  nextPlugin.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'unused-imports': unusedImportsPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'react/react-in-jsx-scope': 'off', // Next.js handles React import
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.name='auth'][object.property.name='api'][property.name='getSession']",
          message:
            'Direct auth.api.getSession() calls are forbidden. Use helpers from @/lib/auth/server-context instead.',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Allow direct auth imports only in server-context.ts
  {
    files: ['**/lib/auth/server-context.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
