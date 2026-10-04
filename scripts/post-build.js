const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `../.env.${process.env.EXPO_ENV || 'production'}`) });
const { runPostBuild } = require('./post-build-core');

runPostBuild({
  // baseUrl is set by the build script via EXPO_ENV
  baseUrl: process.env.EXPO_PUBLIC_BASE_URL || '/Energy_Price_Germany',
  local: false,
  // Only the production deployment (main branch, canonical root URL) should be indexed.
  // The testing deployment lives under a subpath and would otherwise be duplicate content.
  isProduction: (process.env.EXPO_ENV || 'production') === 'production',
  successMessage: '✓ PWA files copied successfully!',
});
