module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'react-native|' +
      '@react-native|' +
      'expo|' +
      '@expo|' +
      'victory-native|' +
      '@shopify/react-native-skia|' +
      'react-native-svg|' +
      '@react-native-async-storage|' +
      'react-native-safe-area-context|' +
      'react-native-reanimated|' +
      'react-native-worklets|' +
      'expo-status-bar|' +
      'expo-updates|' +
      'expo-splash-screen|' +
      'expo-linear-gradient' +
    ')/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)', '**/*.test.(ts|tsx|js)'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!jest.config.js',
    '!babel.config.js',
  ],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
