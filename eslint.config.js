import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default [
  js.configs.recommended,
  stylistic.configs.customize({
    semi: true,
    jsx: false,
    braceStyle: '1tbs',
    arrowParens: true,
    quoteProps: 'as-needed',
  }),
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@stylistic/comma-dangle': 'off',
      '@stylistic/max-len': ['error', { code: 120, ignoreUrls: true }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-restricted-exports': ['error', {
        restrictDefaultExports: {
          direct: true,
          named: true,
          defaultFrom: true,
          namedFrom: true,
          namespaceFrom: true,
        },
      }],
      'no-underscore-dangle': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
