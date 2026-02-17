module.exports = {
  root: true,
  extends: [
    '@react-native',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // ===========================================================================
    // Custom Rules for Cross-Platform Safety
    // ===========================================================================

    // Warn on console.log (should be removed in production)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Strict equality
    'eqeqeq': ['error', 'always'],

    // No var, use const/let
    'no-var': 'error',
    'prefer-const': 'error',

    // ===========================================================================
    // TypeScript Rules - Strict
    // ===========================================================================

    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
    }],
    '@typescript-eslint/no-non-null-assertion': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      // Relax rules in test files
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
      },
    },
    {
      // Relax rules in scripts and config files
      files: ['scripts/**', '*.js'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
  ],
};
