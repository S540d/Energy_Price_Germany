# 🔄 Cache Busting & Update Strategy

## Übersicht

EnergyPriceGermany verwendet eine Multi-Layer Cache-Busting-Strategie, die aus dem Eisenhauer-Projekt übernommen wurde, um sicherzustellen, dass Nutzer immer die neueste Version der PWA erhalten.

## Implementierte Ebenen

### 1. 📌 URL Query Parameters (Cache Busting)

**Was:** Versionsnummern in Asset-URLs
**Wie:** `script.js?v=1760210435078`

**Automatisch aktualisiert durch:** `update-cache-version.js`

### 2. 🔄 Service Worker Update Strategy

**Was:** Aggressives Update-Checking

**Implementiert in index.html:**
- ✅ Update-Check direkt beim Laden
- ✅ Update-Check alle 10 Sekunden
- ✅ Automatische Reload-Notification bei neuer Version
- ✅ `skipWaiting()` für sofortiges Aktivieren

### 3. 🗓️ Cache Name mit Datum

**Was:** Service Worker Cache Name enthält Version + Datum

**In service-worker.js:**
```javascript
const CACHE_VERSION = '1.0.0';
const BUILD_DATE = '2025-10-11';
const CACHE_NAME = `energy-price-germany-v${CACHE_VERSION}-${BUILD_DATE}`;
```

### 4. 🤖 Automatische Versionierung

**Was:** Build-Script aktualisiert alle Versionen automatisch

**Script:** `update-cache-version.js`

**Aktualisiert:**
- service-worker.js (CACHE_VERSION + BUILD_DATE)
- index.html (alle ?v= Parameter)
- manifest.json (version + build_date)

**Usage:**
```bash
# Version erhöhen und alle Versionen aktualisieren
npm run version:update

# Nur Cache-Versionen aktualisieren
npm run cache:update
```

## Deployment Workflow

### Bei jedem Update:

```bash
# 1. Version automatisch erhöhen und aktualisieren
npm run version:update

# 2. Bauen und deployen
npm run deploy
```

**Oder manuell:**
```bash
# Version patch erhöhen
npm version patch

# Cache-Versionen aktualisieren
npm run cache:update

# Bauen
npm run build:web

# Deployen
npm run deploy:gh-pages
```

## Wie lange dauert das Update?

| Layer | Update-Zeit |
|-------|------------|
| **Service Worker** | ~10 Sekunden (auto-check) |
| **Browser Cache** | Sofort (wegen ?v= Parameter) |
| **CDN Cache** | 1-5 Minuten (GitHub Pages) |

**Realität:** Nutzer sehen Updates innerhalb von **10-30 Sekunden** nach Reload.

## Troubleshooting

### "Ich sehe immer noch die alte Version!"

1. **Hard Refresh:**
   - Chrome/Edge: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
   - Firefox: `Ctrl + F5` / `Cmd + Shift + R`

2. **Service Worker manuell löschen:**
   ```
   Chrome DevTools → Application → Service Workers → Unregister
   Chrome DevTools → Application → Storage → Clear site data
   ```

3. **Warte 30 Sekunden:**
   - Auto-update sollte greifen
   - Refresh die Seite erneut

### "Update-Dialog erscheint nicht"

Der Dialog erscheint nur wenn:
- ✅ Service Worker bereits installiert war
- ✅ Eine neue Version verfügbar ist
- ✅ Nutzer die Seite neu lädt

**Erste Installation:** Kein Dialog, Service Worker wird still installiert.

## Best Practices

### ✅ DO:
- `npm run version:update` vor jedem Deploy
- Service Worker in DevTools testen
- Hard Refresh zum Testen verwenden

### ❌ DON'T:
- Versionsnummern manuell in Dateien ändern (Script nutzen!)
- Service Worker Cache im Code deaktivieren
- Deploy ohne Version-Update

## Summary

Die Multi-Layer-Strategie garantiert:
- ✅ Schnelle Updates (10-30 Sekunden)
- ✅ Automatische Benachrichtigung
- ✅ Keine manuellen Anpassungen
- ✅ Konsistente Versionierung

**Einfach `npm run deploy` und fertig!** 🚀</content>
<parameter name="filePath">/Users/svenstrohkark/Documents/Programmierung/Projects/EnergyPriceGermany/CACHE-BUSTING.md