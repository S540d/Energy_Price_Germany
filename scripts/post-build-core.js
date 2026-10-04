const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Copied into dist/ for every build (NOT index.html - Expo generates that)
const COMMON_FILES = [
  'public/.nojekyll',
  'public/manifest.json',
  'public/service-worker.js',
  'public/icon-180.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/data/marketdata.json',
  'public/.well-known/assetlinks.json',
];

function copyFiles(files) {
  files.forEach(src => {
    const dest = src.replace(/^public\//, 'dist/');
    const srcPath = path.join(ROOT, src);
    const destPath = path.join(ROOT, dest);

    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${src} to ${dest}`);
    } else {
      console.warn(`⚠ File not found: ${src}`);
    }
  });
}

// Service worker registration + update banner (built with the DOM API, XSS-safe)
function serviceWorkerScript(swUrl) {
  return `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('${swUrl}?v=${Date.now()}')
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

        // Create notification structure using DOM API (XSS-safe)
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: 500; margin-bottom: 8px;';
        title.textContent = '🔄 Update verfügbar';

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'font-size: 14px; opacity: 0.9; margin-bottom: 12px;';
        messageDiv.textContent = message; // XSS-safe: textContent instead of innerHTML

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 8px;';

        const updateBtn = document.createElement('button');
        updateBtn.id = 'update-yes';
        updateBtn.style.cssText = 'background: white; color: #6200EE; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 500; cursor: pointer;';
        updateBtn.textContent = 'Aktualisieren';

        const laterBtn = document.createElement('button');
        laterBtn.id = 'update-no';
        laterBtn.style.cssText = 'background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 12px; border-radius: 4px; cursor: pointer;';
        laterBtn.textContent = 'Später';

        buttonContainer.appendChild(updateBtn);
        buttonContainer.appendChild(laterBtn);
        notification.appendChild(title);
        notification.appendChild(messageDiv);
        notification.appendChild(buttonContainer);

        document.body.appendChild(notification);
        updateBtn.addEventListener('click', () => {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        });
        laterBtn.addEventListener('click', () => notification.remove());
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 30000);
      }
    </script>
  `;
}

/**
 * Post-processes the Expo web export in dist/.
 *
 * @param {object} options
 * @param {string} options.baseUrl        Prefix for absolute asset paths ('' = none, local build)
 * @param {boolean} options.local         Local build: "(LOCAL)" title, never indexed, own cache name
 * @param {boolean} options.isProduction  Canonical production deployment (indexed, robots/sitemap)
 * @param {string} options.successMessage Final log line
 */
function runPostBuild({ baseUrl, local, isProduction, successMessage }) {
  const indexed = isProduction && !local;
  const files = [...COMMON_FILES];
  // robots.txt / sitemap.xml only apply to the canonical production deployment
  if (indexed) files.push('public/robots.txt', 'public/sitemap.xml');
  copyFiles(files);

  const indexPath = path.join(ROOT, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');

    if (local) {
      html = html.replace(/<title>.*?<\/title>/, '<title>Energy Prices Germany (LOCAL)</title>');
    } else {
      // Add baseUrl prefix to all absolute paths for GitHub Pages subpath
      html = html.replace(/href="\/(?!\/)/g, `href="${baseUrl}/`);
      html = html.replace(/src="\/(?!\/)/g, `src="${baseUrl}/`);

      // Keep the SEO title from public/index.html — overwriting it here would drop the
      // German keywords. Only add a fallback title if the generated file has none.
      if (!/<title>[^<]+<\/title>/.test(html)) {
        html = html.replace('</head>', '    <title>Energy Prices Germany</title>\n  </head>');
      }

      // SEO meta tags (description, robots, Open Graph) already ship in public/index.html,
      // which Metro's web export uses as its template (Issue S540d/project-templates#95).
      // The testing deployment lives under a subpath and is not the canonical URL, so it
      // must not be indexed even though the template defaults to "index, follow".
      if (!isProduction) {
        html = html.replace(
          /<meta name="robots" content="[^"]*" \/>/,
          '<meta name="robots" content="noindex, nofollow" />'
        );
      }
    }

    // Fallback: add description/robots if the template somehow lacks them
    if (!html.includes('name="description"')) {
      if (local) {
        html = html.replace(
          '</head>',
          `    <meta name="description" content="Visualisierung von Energiepreisen und erneuerbaren Energien in Deutschland" />
    <meta name="robots" content="noindex, nofollow" />
  </head>`
        );
      } else {
        const seoDescription =
          'Aktuelle Börsenstrompreise (Day-Ahead) und Ökostrom-Anteil in Deutschland – kostenlos, ohne Werbung und ohne Tracking.';
        const canonicalUrl = 'https://s540d.github.io/Energy_Price_Germany/';
        const robotsContent = isProduction ? 'index, follow' : 'noindex, nofollow';
        html = html.replace(
          '</head>',
          `    <meta name="description" content="${seoDescription}" />
    <meta name="robots" content="${robotsContent}" />
    <meta property="og:title" content="Energy Prices Germany" />
    <meta property="og:description" content="${seoDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${canonicalUrl}icon-512.png" />
  </head>`
        );
      }
    }

    // Add PWA meta tags if not present
    if (!html.includes('apple-mobile-web-app-title')) {
      html = html.replace(
        '</head>',
        `    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Energy Prices Germany" />
  </head>`
      );
    }

    // Add service worker registration script before </body> if not present
    if (!html.includes('serviceWorker')) {
      const swUrl = local ? './service-worker.js' : `${baseUrl}/service-worker.js`;
      html = html.replace('</body>', serviceWorkerScript(swUrl) + '\n  </body>');
    }

    fs.writeFileSync(indexPath, html);
    console.log(
      local
        ? '✓ Modified Expo-generated index.html for LOCAL testing (no baseUrl prefix)'
        : '✓ Modified Expo-generated index.html for PWA and subpath deployment'
    );
  }

  // Update cache version in service worker with timestamp
  const swPath = path.join(ROOT, 'dist', 'service-worker.js');
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    const cacheVersion = `energy-price-germany-${local ? 'local-' : ''}v${Date.now()}`;
    swContent = swContent.replace(
      /const CACHE_NAME = '[^']+';/,
      `const CACHE_NAME = '${cacheVersion}';`
    );
    fs.writeFileSync(swPath, swContent);
    console.log(`✓ Updated service worker cache version to: ${cacheVersion}`);
  }

  console.log(successMessage);
}

module.exports = { runPostBuild };
