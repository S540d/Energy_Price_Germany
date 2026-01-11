// Custom matchers are now built-in to @testing-library/react-native v12.4+
// import '@testing-library/react-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-updates
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }) => children,
}));

// Mock victory-native components
jest.mock('victory-native', () => ({
  VictoryChart: 'VictoryChart',
  VictoryBar: 'VictoryBar',
  VictoryAxis: 'VictoryAxis',
  VictoryScatter: 'VictoryScatter',
  VictoryLine: 'VictoryLine',
}));

// Mock React Native Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock global __DEV__
global.__DEV__ = true;

// Mock window.localStorage for web tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.window = global.window || {};
global.window.localStorage = localStorageMock;
global.window.navigator = { language: 'en-US' };

// Mock document for web tests
global.document = global.document || {
  body: {
    style: {},
  },
};
