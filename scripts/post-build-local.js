const { runPostBuild } = require('./post-build-core');

// Local test build: no baseUrl prefix, never indexed
runPostBuild({
  baseUrl: '',
  local: true,
  isProduction: false,
  successMessage: '✓ Local build completed successfully!',
});
