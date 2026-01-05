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

// 1. Update service-worker.js in both public and dist
function updateServiceWorker() {
    const swPaths = [
        path.join(__dirname, 'public', 'service-worker.js'),
        path.join(__dirname, 'dist', 'service-worker.js')
    ];

    swPaths.forEach(swPath => {
        if (!fs.existsSync(swPath)) {
            console.log(`⚠️  ${path.basename(swPath)} not found, skipping`);
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
        if (content.includes('CACHE_VERSION')) {
            content = content.replace(
                /const CACHE_VERSION = '[^']*';/,
                `const CACHE_VERSION = '${require('./package.json').version}';`
            );
        }

        // Update cache busting comment
        content = content.replace(
            /\/\/ Cache busting.*/,
            `// Cache busting - updated ${now.toISOString()}`
        );

        fs.writeFileSync(swPath, content);
        console.log(`✅ ${path.basename(swPath)} updated`);
    });
}

// 2. Update index.html with cache-busting parameters (both public and dist)
function updateIndexHtml() {
    const htmlPaths = [
        path.join(__dirname, 'public', 'index.html'),
        path.join(__dirname, 'dist', 'index.html')
    ];

    htmlPaths.forEach(htmlPath => {
        if (!fs.existsSync(htmlPath)) {
            console.log(`⚠️  ${path.basename(htmlPath)} not found, skipping`);
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
            /\.register\('\/service-worker\.js'\)/,
            `.register('/service-worker.js?v=${buildTime}')`
        );

        fs.writeFileSync(htmlPath, content);
        console.log(`✅ ${path.basename(htmlPath)} cache-busting updated`);
    });
}

// 3. Update manifest.json version (both public and dist)
function updateManifest() {
    const manifestPaths = [
        path.join(__dirname, 'public', 'manifest.json'),
        path.join(__dirname, 'dist', 'manifest.json')
    ];

    manifestPaths.forEach(manifestPath => {
        if (!fs.existsSync(manifestPath)) {
            console.log(`⚠️  ${path.basename(manifestPath)} not found, skipping`);
            return;
        }

        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

            // Read version from package.json
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            manifest.version = packageJson.version;
            manifest.build_date = buildDate;

            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            console.log(`✅ ${path.basename(manifestPath)} updated`);
        } catch (error) {
            console.log(`❌ Error updating ${path.basename(manifestPath)}:`, error.message);
        }
    });
}

// 4. Create version info file in dist
function createVersionInfo() {
    const distPath = path.join(__dirname, 'dist');
    
    // Check if dist directory exists
    if (!fs.existsSync(distPath)) {
        console.log('⚠️  dist directory not found, skipping version.json');
        return;
    }

    const versionInfo = {
        version: require('./package.json').version,
        buildDate: buildDate,
        buildTime: buildTime,
        commit: process.env.GITHUB_SHA || 'local',
        timestamp: now.toISOString()
    };

    fs.writeFileSync(
        path.join(distPath, 'version.json'),
        JSON.stringify(versionInfo, null, 2)
    );

    console.log('✅ version.json created');
}

// 5. Add aggressive cache update to service worker (both public and dist)
function addAggressiveCacheUpdate() {
    const swPaths = [
        path.join(__dirname, 'public', 'service-worker.js'),
        path.join(__dirname, 'dist', 'service-worker.js')
    ];

    swPaths.forEach(swPath => {
        if (!fs.existsSync(swPath)) {
            return;
        }

        let content = fs.readFileSync(swPath, 'utf8');

        // Check if aggressive cache update is already implemented
        if (content.includes('Aggressive update checking and auto-reload notification')) {
            console.log(`✅ Aggressive cache update already implemented in ${path.basename(swPath)}`);
            return;
        }

        // Add force update on activate only if not already present
        if (!content.includes('Force update on activate')) {
            const activateCode = `
// Force update on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
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
            console.log(`✅ Aggressive cache update added to ${path.basename(swPath)}`);
        }
    });
}

// 6. Update data file references with cache busting (in service worker and other files)
function updateDataCacheBusting() {
    const filesToUpdate = [
        path.join(__dirname, 'public', 'service-worker.js'),
        path.join(__dirname, 'dist', 'service-worker.js'),
        // Add other files that reference data files if needed
    ];

    filesToUpdate.forEach(filePath => {
        if (!fs.existsSync(filePath)) {
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // Update marketdata.json references with cache busting
        // First remove any existing ?v= parameters to avoid stacking
        content = content.replace(
            /\/data\/marketdata\.json(\?v=[^'")\s]*)?/g,
            `/data/marketdata.json?v=${buildTime}`
        );

        // Update any other data file references if they exist
        content = content.replace(
            /\/data\/([^'"?]+\.json)(\?v=[^'")\s]*)?/g,
            `/data/$1?v=${buildTime}`
        );

        fs.writeFileSync(filePath, content);
        console.log(`✅ Data cache-busting updated in ${path.basename(filePath)}`);
    });
}

// Run all updates
try {
    updateServiceWorker();
    updateIndexHtml();
    updateManifest();
    createVersionInfo();
    addAggressiveCacheUpdate();
    // Note: updateDataCacheBusting() is not called to avoid modifying service worker pattern matching

    console.log('🎉 Cache version update complete!');
    console.log(`📅 Build Date: ${buildDate}`);
    console.log(`⏰ Build Time: ${buildTime}`);

} catch (error) {
    console.error('❌ Cache update failed:', error.message);
    process.exit(1);
}
