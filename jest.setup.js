// Custom matchers are now built-in to @testing-library/react-native v12.4+
// import '@testing-library/react-native/extend-expect';

// Mock TurboModuleRegistry to prevent PlatformConstants errors
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  return {
    getEnforcing: (name) => {
      if (name === 'PlatformConstants') {
        return {
          getConstants: () => ({
            isTesting: true,
            reactNativeVersion: { major: 0, minor: 76, patch: 0 },
          }),
        };
      }
      if (name === 'DeviceInfo') {
        return {
          getConstants: () => ({
            Dimensions: {
              window: { width: 375, height: 667, scale: 2, fontScale: 1 },
              screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
            },
          }),
        };
      }
      return null;
    },
    get: (name) => {
      return null;
    },
  };
});

// Mock NativeDeviceInfo
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      Dimensions: {
        window: { width: 375, height: 667, scale: 2, fontScale: 1 },
        screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
      },
    }),
  },
}));

// Mock react-native Platform and other hooks
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn((obj) => obj.web || obj.default),
  },
  Linking: {
    openURL: jest.fn(),
  },
  useColorScheme: jest.fn(() => 'light'),
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn((obj) => obj),
    flatten: jest.fn((obj) => obj),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
    roundToNearestPixel: jest.fn((size) => size),
  },
}));

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

// Suppress console output during tests (log and debug)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
};
