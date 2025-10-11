#!/usr/bin/env node

/**
 * Cache Version Updater - Automatic Cache Busting for Expo Web Build
 *
 * This script automatically updates cache versions across the dist folder
 * to ensure users always get the latest version without manual cache clearing.
 */

const fs = require('fs');
const path = require('path');

// Get current timestamp for cache busting
const now = new Date();
const buildDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const buildTime = now.getTime(); // Unix timestamp

console.log('🔄 Updating cache versions for EnergyPriceGermany...');

// 1. Update service-worker.js in dist
function updateServiceWorker() {
    const swPath = path.join(__dirname, 'dist', 'service-worker.js');

    if (!fs.existsSync(swPath)) {
        console.log('❌ dist/service-worker.js not found');
        return;
    }

    let content = fs.readFileSync(swPath, 'utf8');

    // Update BUILD_DATE if it exists
    if (content.includes('BUILD_DATE')) {
        content = content.replace(
            /const BUILD_DATE = '[^']*';/,
            `const BUILD_DATE = '${buildDate}';`
        );
    }

    // Update CACHE_VERSION
    content = content.replace(
        /CACHE_VERSION\s*=\s*['"][^'"]*['"]/,
        `CACHE_VERSION = 'v${buildTime}'`
    );

    // Update cache busting comment
    content = content.replace(
        /\/\/ Cache busting.*/,
        `// Cache busting - updated ${now.toISOString()}`
    );

    fs.writeFileSync(swPath, content);
    console.log('✅ service-worker.js updated');
}

// 2. Update index.html with cache-busting parameters
function updateIndexHtml() {
    const htmlPath = path.join(__dirname, 'dist', 'index.html');

    if (!fs.existsSync(htmlPath)) {
        console.log('❌ dist/index.html not found');
        return;
    }

    let content = fs.readFileSync(htmlPath, 'utf8');

    // Update script references with cache busting (including expo bundle)
    content = content.replace(
        /src="([^"]+\.js)(\?v=[^"]*)?"/g,
        `src="$1?v=${buildTime}"`
    );

    // Update CSS references with cache busting
    content = content.replace(
        /href="([^"]+\.css)(\?v=[^"]*)?"/g,
        `href="$1?v=${buildTime}"`
    );

    // Update service worker registration with version
    content = content.replace(
        /\.register\('\.\/service-worker\.js'\)/,
        `.register('./service-worker.js?v=${buildTime}')`
    );

    fs.writeFileSync(htmlPath, content);
    console.log('✅ index.html cache-busting updated');
}

// 3. Update manifest.json version
function updateManifest() {
    const manifestPath = path.join(__dirname, 'dist', 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
        console.log('❌ dist/manifest.json not found');
        return;
    }

    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Read version from package.json
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        manifest.version = packageJson.version;
        manifest.build_date = buildDate;

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ manifest.json updated');
    } catch (error) {
        console.log('❌ Error updating manifest.json:', error.message);
    }
}

// 4. Create version info file in dist
function createVersionInfo() {
    const versionInfo = {
        version: require('./package.json').version,
        buildDate: buildDate,
        buildTime: buildTime,
        commit: process.env.GITHUB_SHA || 'local',
        timestamp: now.toISOString()
    };

    fs.writeFileSync(
        path.join(__dirname, 'dist', 'version.json'),
        JSON.stringify(versionInfo, null, 2)
    );

    console.log('✅ version.json created');
}

// 5. Add aggressive cache update to service worker
function addAggressiveCacheUpdate() {
    const swPath = path.join(__dirname, 'dist', 'service-worker.js');

    if (!fs.existsSync(swPath)) {
        return;
    }

    let content = fs.readFileSync(swPath, 'utf8');

    // Add force update on activate
    if (!content.includes('Force update on activate')) {
        const activateCode = `
// Force update on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Cache cleaned, claiming clients');
      return self.clients.claim();
    })
  );
});
`;
        content = content.replace(
            /(self\.addEventListener\('install')/,
            activateCode + '\n$1'
        );

        fs.writeFileSync(swPath, content);
        console.log('✅ Aggressive cache update added to service-worker.js');
    }
}

// Run all updates
try {
    updateServiceWorker();
    updateIndexHtml();
    updateManifest();
    createVersionInfo();
    addAggressiveCacheUpdate();

    console.log('🎉 Cache version update complete!');
    console.log(`📅 Build Date: ${buildDate}`);
    console.log(`⏰ Build Time: ${buildTime}`);

} catch (error) {
    console.error('❌ Cache update failed:', error.message);
    process.exit(1);
}
