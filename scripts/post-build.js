const fs = require('fs');
const path = require('path');

// Copy PWA files to dist folder (but NOT index.html - Expo generates that)
const filesToCopy = [
  { src: 'public/.nojekyll', dest: 'dist/.nojekyll' },
  { src: 'public/manifest.json', dest: 'dist/manifest.json' },
  { src: 'public/service-worker.js', dest: 'dist/service-worker.js' },
  { src: 'public/icon-180.png', dest: 'dist/icon-180.png' },
  { src: 'public/icon-192.png', dest: 'dist/icon-192.png' },
  { src: 'public/icon-512.png', dest: 'dist/icon-512.png' },
  { src: 'public/data/marketdata.json', dest: 'dist/data/marketdata.json' },
  { src: 'public/.well-known/assetlinks.json', dest: 'dist/.well-known/assetlinks.json' }
  // NOTE: index.html is NOT copied - we use the Expo-generated one with script tags
];

filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(__dirname, '..', src);
  const destPath = path.join(__dirname, '..', dest);

  if (fs.existsSync(srcPath)) {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${src} to ${dest}`);
  } else {
    console.warn(`⚠ File not found: ${src}`);
  }
});

// Modify the Expo-generated index.html for GitHub Pages and PWA
const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Add baseUrl prefix to all absolute paths for GitHub Pages subpath
  const baseUrl = '/Energy_Price_Germany';
  html = html.replace(/href="\/(?!\/)/g, `href="${baseUrl}/`);
  html = html.replace(/src="\/(?!\/)/g, `src="${baseUrl}/`);

  // Fix title and meta tags
  html = html.replace(/<title>.*?<\/title>/, '<title>Energy Prices Germany</title>');
  
  // Add PWA meta tags if not present
  if (!html.includes('apple-mobile-web-app-title')) {
    html = html.replace('</head>', `    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Energy Prices Germany" />
  </head>`);
  }

  // Add service worker registration script before </body> if not present
  if (!html.includes('serviceWorker')) {
    const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('${baseUrl}/service-worker.js?v=${Date.now()}')
            .then((registration) => {
              console.log('SW registered: ', registration);
              registration.update();
              setInterval(() => { registration.update(); }, 10000);
              
              navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                  showUpdateNotification(event.data.message);
                }
              });
              
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateNotification('Eine neue Version ist verfügbar. Seite neu laden?');
                  }
                });
              });
            })
            .catch((err) => console.log('SW registration failed: ', err));
        });
      }
      
      function showUpdateNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = \`
          position: fixed; top: 20px; right: 20px; background: #6200EE; color: white;
          padding: 16px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000; max-width: 300px; cursor: pointer;
        \`;
        notification.innerHTML = \`
          <div style="font-weight: 500; margin-bottom: 8px;">🔄 Update verfügbar</div>
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">\${message}</div>
          <div style="display: flex; gap: 8px;">
            <button id="update-yes" style="background: white; color: #6200EE; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 500; cursor: pointer;">Aktualisieren</button>
            <button id="update-no" style="background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 12px; border-radius: 4px; cursor: pointer;">Später</button>
          </div>
        \`;
        document.body.appendChild(notification);
        document.getElementById('update-yes').addEventListener('click', () => {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        });
        document.getElementById('update-no').addEventListener('click', () => notification.remove());
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 30000);
      }
    </script>
  `;
    html = html.replace('</body>', swScript + '\n  </body>');
  }

  fs.writeFileSync(indexPath, html);
  console.log('✓ Modified Expo-generated index.html for PWA and subpath deployment');
}

// Update cache version in service worker with timestamp
const swPath = path.join(__dirname, '..', 'dist', 'service-worker.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  const cacheVersion = `energy-price-germany-v${Date.now()}`;
  swContent = swContent.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = '${cacheVersion}';`);
  fs.writeFileSync(swPath, swContent);
  console.log(`✓ Updated service worker cache version to: ${cacheVersion}`);
}

console.log('✓ PWA files copied successfully!');
