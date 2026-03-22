import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import jestPlugin from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';

// React Native globals (from @react-native/eslint-config shared.js)
const reactNativeGlobals = {
  __DEV__: 'writable',
  ErrorUtils: 'readonly',
  FormData: 'writable',
  XMLHttpRequest: 'readonly',
};

export default [
  // ── Global ignores ────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      'web-build/**',
      '.expo/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      'babel.config.js',
      'jest.config.js',
      'jest.setup.js',
      'metro.config.js',
      '__mocks__/**',
    ],
  },

  // ── Base config for TypeScript files ──────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...reactNativeGlobals,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': fixupPluginRules(reactNativePlugin),
      'eslint-comments': fixupPluginRules(eslintCommentsPlugin),
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // ── General (from @react-native/eslint-config) ──────────────────
      'no-cond-assign': 'warn',
      'no-const-assign': 'error',
      'no-control-regex': 'warn',
      'no-debugger': 'warn',
      'no-dupe-class-members': 'error',
      'no-dupe-keys': 'error',
      'no-ex-assign': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-func-assign': 'warn',
      'no-invalid-regexp': 'warn',
      'no-obj-calls': 'warn',
      'no-regex-spaces': 'warn',
      'no-sparse-arrays': 'warn',
      'no-unreachable': 'error',
      'use-isnan': 'warn',
      'valid-typeof': 'warn',

      // ── Best Practices ──────────────────────────────────────────────
      'dot-notation': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-alert': 'warn',
      'no-caller': 'warn',
      'no-div-regex': 'warn',
      'no-eval': 'error',
      'no-extend-native': 'warn',
      'no-extra-bind': 'warn',
      'no-fallthrough': 'warn',
      'no-implied-eval': 'warn',
      'no-labels': 'warn',
      'no-iterator': 'warn',
      'no-lone-blocks': 'warn',
      'no-new': 'warn',
      'no-new-func': 'error',
      'no-new-wrappers': 'warn',
      'no-octal': 'warn',
      'no-octal-escape': 'warn',
      'no-proto': 'warn',
      'no-return-assign': 'warn',
      'no-script-url': 'warn',
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-useless-escape': 'warn',
      'no-void': 'warn',
      'radix': 'warn',
      'yoda': 'warn',

      // ── Variables ───────────────────────────────────────────────────
      'no-delete-var': 'warn',
      'no-global-assign': 'error',
      'no-label-var': 'warn',
      'no-shadow': 'off', // Handled by @typescript-eslint/no-shadow
      'no-shadow-restricted-names': 'warn',
      'no-undef': 'off', // Handled by TypeScript
      'no-undef-init': 'warn',
      'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars

      // ── Style ───────────────────────────────────────────────────────
      'consistent-this': 'warn',
      'no-array-constructor': 'warn',
      'no-empty-character-class': 'warn',
      'no-new-object': 'warn',
      'no-bitwise': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // ── Node.js ─────────────────────────────────────────────────────
      'no-mixed-requires': 'warn',
      'no-new-require': 'warn',
      'no-path-concat': 'warn',
      'no-restricted-modules': 'warn',

      // ── TypeScript ──────────────────────────────────────────────────
      '@typescript-eslint/no-shadow': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // ── React ───────────────────────────────────────────────────────
      'react/display-name': 'off',
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'react/no-did-mount-set-state': 'warn',
      'react/no-did-update-set-state': 'warn',
      'react/no-string-refs': 'error',
      'react/no-unstable-nested-components': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 'warn',

      // ── React Hooks ─────────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // ── React Native ────────────────────────────────────────────────
      'react-native/no-inline-styles': 'warn',

      // ── ESLint Comments ─────────────────────────────────────────────
      'eslint-comments/no-aggregating-enable': 'warn',
      'eslint-comments/no-unlimited-disable': 'warn',
      'eslint-comments/no-unused-disable': 'warn',
      'eslint-comments/no-unused-enable': 'warn',
    },
  },

  // ── Test files (relaxed rules) ────────────────────────────────────────
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    plugins: {
      'jest': jestPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'react-native/no-inline-styles': 'off',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'warn',
      'jest/no-identical-title': 'warn',
      'jest/valid-expect': 'warn',
    },
  },

  // ── Scripts and JS config files (relaxed rules) ───────────────────────
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ── Prettier (must be last – disables conflicting formatting rules) ───
  prettierConfig,
];
