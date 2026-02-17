/**
 * Environment Configuration Module
 *
 * Provides environment-specific configuration for the application.
 * Configuration is read from .env files at build time.
 */

// Type definitions for environment
export enum Environment {
  PRODUCTION = 'production',
  STAGING = 'staging',
  TESTING = 'testing',
}

export interface EnvironmentConfig {
  env: Environment;
  isProd: boolean;
  isStaging: boolean;
  isTesting: boolean;
  baseUrl: string;
  apiBase: string;
}

/**
 * Get the current environment from build-time environment variables.
 * This reads from process.env which is populated from .env files.
 */
function getCurrentEnvironment(): EnvironmentConfig {
  const env = (process.env.EXPO_ENV || 'production') as Environment;
  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || '/Energy_Price_Germany';
  const apiBase = process.env.EXPO_PUBLIC_API_BASE || 'https://api.example.com';

  return {
    env,
    isProd: env === Environment.PRODUCTION,
    isStaging: env === Environment.STAGING,
    isTesting: env === Environment.TESTING,
    baseUrl,
    apiBase,
  };
}

/**
 * Validate environment configuration.
 * Ensures that testing/staging don't accidentally use production APIs or vice versa.
 */
function validateEnvironment(config: EnvironmentConfig): void {
  // Prevent testing/staging from using production API
  // Production uses 'api.example.com', while staging/testing use 'staging-api.example.com'
  if ((config.isTesting || config.isStaging) && !config.apiBase.includes('staging')) {
    throw new Error(
      `🚨 Security Error: ${config.env} environment is configured with production API! ` +
        `This is a critical misconfiguration. Please check .env.${config.env}`
    );
  }

  // Prevent production from using staging/testing API
  if (config.isProd && config.apiBase.includes('staging')) {
    throw new Error(
      `🚨 Security Error: production environment is configured with staging/test API! ` +
        `This is a critical misconfiguration. Please check .env.production`
    );
  }

  // Prevent production from using test baseUrl
  if (config.isProd && (config.baseUrl.includes('testing') || config.baseUrl.includes('staging'))) {
    throw new Error(
      `🚨 Security Error: production environment is configured with test baseUrl! ` +
        `This is a critical misconfiguration. Please check .env.production`
    );
  }

  // Warn if baseUrl doesn't match expected pattern
  if (config.isTesting && !config.baseUrl.includes('testing')) {
    console.warn(`⚠️  Warning: testing environment baseUrl doesn't contain 'testing'`);
  }
  if (config.isStaging && !config.baseUrl.includes('staging')) {
    console.warn(`⚠️  Warning: staging environment baseUrl doesn't contain 'staging'`);
  }
}

// Initialize and validate environment
const environment = getCurrentEnvironment();
validateEnvironment(environment);

export default environment;

/**
 * Utility functions for environment-specific logic
 */

/**
 * Get the full API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  const base = environment.apiBase.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Get the base URL for assets (useful for service worker, etc.)
 */
export function getAssetBaseUrl(): string {
  return environment.baseUrl;
}

/**
 * Check if we're in a specific environment
 */
export function isEnvironment(env: Environment): boolean {
  return environment.env === env;
}
