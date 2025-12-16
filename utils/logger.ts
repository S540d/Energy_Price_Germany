/**
 * Centralized logging utility
 * In development mode: logs to console
 * In production mode: only errors are logged
 */

const isDevelopment = __DEV__;

export const logger = {
  debug: isDevelopment ? console.log.bind(console) : () => {},
  info: isDevelopment ? console.info.bind(console) : () => {},
  warn: isDevelopment ? console.warn.bind(console) : () => {},
  error: console.error.bind(console), // Always log errors
};
