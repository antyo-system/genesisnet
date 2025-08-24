// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  // ignore patterns
  {
    ignores: [
      'node_modules',
      'dist',
      '.dfx',
      '**/*.wasm',
      '**/*.min.js'
    ]
  },

  // base JS rules
  eslint.configs.recommended,

  // TypeScript (monorepo friendly)
  ...tseslint.configs.recommended,

  // Prettier as last to disable formatting rules
  prettier,

  // custom rules
  {
    rules: {
      'no-unused-vars': 'off', // handled by TS
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off'
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  }
];
