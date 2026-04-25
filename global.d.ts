// Global type augmentation for React Native test environments
// __DEV__ is declared as a const in react-native/src/types/globals.d.ts,
// but needs to be accessible as globalThis.__DEV__ in Jest test files.
declare global {
  var __DEV__: boolean;
}

export {};
