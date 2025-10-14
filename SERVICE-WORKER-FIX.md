# Service Worker Fix: Recurring White Page Issue

## Problem

Die Website zeigte wiederholt eine weiße Seite mit 404-Fehlern für JavaScript-Dateien nach jedem Deployment.

### Fehler-Symptom
```
GET https://s540d.github.io/Energy_Price_Germany/_expo/static/js/web/index-[OLD_HASH].js
Status: 404 Not Found
```

## Root Cause Analysis

### Das Problem lag in der Service Worker Cache-Strategie:

1. **Expo Build Process**
   - Bei jedem Build generiert Expo einen neuen Hash für JavaScript-Bundles
   - Beispiel: `index-e20545aa4666cdea7f6d12382dc40aef.js`
   - Der Hash ändert sich bei JEDEM Build, selbst ohne Code-Änderungen

2. **Service Worker Caching**
   - Alte Implementierung: **Cache First** für `index.html`
   - Service Worker cached `index.html` mit Referenz zu altem JS-Hash
   - Neues Deployment ersetzt die JS-Datei mit neuem Hash
   - Gecachte `index.html` versucht alte JS-Datei zu laden
   - → 404 Error → Weiße Seite

### Warum passierte das "ständig"?

- Jedes Deployment ändert den JS-Hash
- Service Worker liefert alte `index.html` aus Cache
- Alte JS-Datei existiert nicht mehr auf Server
- → Immer wieder dasselbe Problem nach jedem Deploy

## Lösung

### Geänderte Cache-Strategie in `public/service-worker.js`:

```javascript
// VORHER: Cache First für alle statischen Assets (inkl. index.html)
// → Problem: Alte index.html mit veraltetem JS-Hash

// NACHHER: Network First für index.html
if (url.pathname.includes('index.html') || url.pathname.endsWith('/')) {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Immer zuerst vom Netzwerk laden
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Nur bei Netzwerkfehler aus Cache
        return caches.match(event.request);
      })
  );
  return;
}
```

### Vorteile der neuen Strategie:

✅ **index.html** wird immer frisch vom Server geladen  
✅ Enthält immer den korrekten, aktuellen JS-Hash  
✅ JavaScript-Dateien werden erfolgreich geladen  
✅ Keine 404-Fehler mehr  
✅ Offline-Funktionalität bleibt erhalten (Cache als Fallback)  

## Vergleich der Cache-Strategien

| Ressource | Alte Strategie | Neue Strategie | Grund |
|-----------|---------------|----------------|-------|
| `index.html` | Cache First ❌ | **Network First** ✅ | Muss aktuellen JS-Hash haben |
| `*.js` | Network First ✅ | Network First ✅ | Schnelle Updates |
| `marketdata.json` | Network First ✅ | Network First ✅ | Immer frische Daten |
| Bilder, Fonts | Cache First ✅ | Cache First ✅ | Selten geändert |

## Weitere Verbesserungen

### Version Bump (1.0.2 → 1.0.3)
- Erzwingt Aktivierung des neuen Service Workers
- Löscht alte Caches automatisch

### Zusätzliche Maßnahmen im Code:
- Service Worker Kommentar aktualisiert
- Cache-Name enthält Version und Datum
- Automatisches `skipWaiting()` beim Install
- Automatisches `claim()` beim Activate

## Testing

### So testen Sie den Fix:

1. **Hard Refresh durchführen:**
   ```
   Strg+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Service Worker manuell deregistrieren:**
   - DevTools öffnen (F12)
   - Application Tab
   - Service Workers
   - "Unregister" klicken
   - Seite neu laden

3. **Inkognito-Fenster verwenden:**
   - Kein Cache, keine Service Worker
   - Zeigt echte Server-Antwort

## Lessons Learned

1. **HTML mit dynamischen Referenzen darf nicht aggressiv gecached werden**
   - Expo/Metro ändert JS-Hashes bei jedem Build
   - HTML muss immer frisch sein

2. **Network First ist nicht immer langsamer**
   - Browser macht Request parallel zum Cache-Check
   - Bei gutem Netzwerk kaum Unterschied
   - Verhindert Stale-Content-Probleme

3. **Service Worker können mehr schaden als nutzen**
   - Wenn falsch konfiguriert → Broken Website
   - Vorsicht bei statischen Site Generatoren
   - Immer mit Fallback-Strategie arbeiten

## Related Issues

- Weiße Seite nach Deployment
- 404-Fehler für `_expo/static/js` Dateien
- Service Worker cached alte Version
- GitHub Pages Jekyll-Problem (separates Issue)

## Version History

- **v1.0.0-1.0.2**: Cache First für index.html ❌
- **v1.0.3+**: Network First für index.html ✅

## Commit

```
Fix: Service Worker now uses Network First for index.html
```

Commit-Hash: `645f6d38`  
Date: 2025-10-14
