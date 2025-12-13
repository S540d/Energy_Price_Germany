module.exports = {
  root: true,
  extends: [
    '@react-native',
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
    'prefer-const': 'warn',

    // TypeScript specific
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
  },
  overrides: [
    {
      // Additional rules for TypeScript files
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
      },
    },
  ],
};
