import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment
const env = process.env.EXPO_ENV || 'production';
const envFilePath = path.resolve(__dirname, `.env.${env}`);

// Load environment variables from appropriate .env file
dotenv.config({ path: envFilePath });

// Ensure required variables are set
const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || '/Energy_Price_Germany';
const apiBase = process.env.EXPO_PUBLIC_API_BASE || 'https://api.example.com';

// Environment-specific configurations
const envConfig = {
  production: {
    baseUrl: '/Energy_Price_Germany',
    apiBase: 'https://api.example.com',
    pathPrefix: '/Energy_Price_Germany'
  },
  staging: {
    baseUrl: '/Energy_Price_Germany/staging',
    apiBase: 'https://staging-api.example.com',
    pathPrefix: '/Energy_Price_Germany/staging'
  },
  testing: {
    baseUrl: '/Energy_Price_Germany/testing',
    apiBase: 'https://staging-api.example.com',
    pathPrefix: '/Energy_Price_Germany/testing'
  }
};

const currentConfig = envConfig[env] || envConfig.production;

export default {
  expo: {
    name: 'Energy Prices Germany',
    slug: 'Energy_Price_Germany',
    version: '1.3.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    privacy: 'public',
    primaryColor: '#4CAF50',
    description: 'Real-time visualization of electricity prices and renewable energy share in Germany. Track market prices, renewable energy percentages, and their correlation over time.',
    keywords: [
      'energy',
      'electricity',
      'prices',
      'renewable',
      'germany',
      'market',
      'visualization',
      'charts'
    ],
    category: 'utilities',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sven4321.energypricegermany'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.sven4321.energypricegermany',
      versionCode: 10,
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE'
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.sven4321.energypricegermany',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 's540d.github.io',
              pathPrefix: currentConfig.pathPrefix
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        }
      ]
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      baseUrl: currentConfig.baseUrl
    },
    extra: {
      eas: {
        projectId: 'db5fda3f-4953-4286-8682-b0a4b31573f2'
      },
      // Expose environment config to app
      environment: env,
      baseUrl: currentConfig.baseUrl,
      apiBase: currentConfig.apiBase
    },
    owner: 'devsven',
    updates: {
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/db5fda3f-4953-4286-8682-b0a4b31573f2'
    },
    runtimeVersion: {
      policy: 'appVersion'
    }
  }
};
