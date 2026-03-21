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
  Image: 'Image',
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

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const RN = require('react-native');

  const createAnimatedComponent = (Component) => {
    const AnimatedComponent = React.forwardRef(({ children, ...rest }, ref) => {
      return React.createElement(Component || 'View', { ...rest, ref }, children);
    });
    AnimatedComponent.displayName = `Animated.${Component?.displayName || Component?.name || 'Component'}`;
    return AnimatedComponent;
  };

  return {
    __esModule: true,
    default: {
      View: createAnimatedComponent('View'),
      Text: createAnimatedComponent('Text'),
      Image: createAnimatedComponent('Image'),
      ScrollView: createAnimatedComponent('ScrollView'),
      createAnimatedComponent,
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((fn) => ({})),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    withDelay: jest.fn((_delay, val) => val),
    withSequence: jest.fn((...vals) => vals[vals.length - 1]),
    withRepeat: jest.fn((val) => val),
    cancelAnimation: jest.fn(),
    useAnimatedRef: jest.fn(() => ({ current: null })),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    runOnJS: jest.fn((fn) => fn),
    interpolate: jest.fn((val) => val),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      bezier: jest.fn(() => jest.fn()),
      inOut: jest.fn((easing) => easing),
      back: jest.fn(() => jest.fn()),
      out: jest.fn((easing) => easing),
      in: jest.fn((easing) => easing),
    },
    FadeIn: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
    FadeOut: { duration: jest.fn(() => ({})) },
    SlideInDown: { duration: jest.fn(() => ({ springify: jest.fn(() => ({})) })) },
    SlideOutDown: { duration: jest.fn(() => ({})) },
    Layout: { springify: jest.fn(() => ({})) },
  };
});

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
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
