# Changelog - 14. Oktober 2025

## 🐛 Bugfix: GitHub Pages 404 Error für _expo Directory

### Problem
- Website auf https://s540d.github.io/Energy_Price_Germany/ zeigte nur weiße Seite
- Browser Console zeigte 404 Fehler für `/_expo/static/js/web/*.js`
- Ursache: GitHub Pages verwendet Jekyll, das Verzeichnisse mit Unterstrich ignoriert

### Lösung
- ✅ `.nojekyll` Datei hinzugefügt in `public/` Ordner
- ✅ `scripts/post-build.js` aktualisiert um `.nojekyll` nach `dist/` zu kopieren
- ✅ `package.json` aktualisiert: `--dotfiles` Flag für `gh-pages` Deployment
- ✅ Erfolgreicher Deploy auf GitHub Pages mit `.nojekyll` im `gh-pages` Branch

### Geänderte Dateien
1. `public/.nojekyll` - Neu erstellt (leere Datei)
2. `scripts/post-build.js` - `.nojekyll` zur Copy-Liste hinzugefügt
3. `package.json` - `deploy:gh-pages` Script mit `--dotfiles` Flag erweitert

### Commits
- `8a04a9ff` - Fix: Add .nojekyll to resolve GitHub Pages 404 error for _expo directory
- `b72fa676` - Update service-worker.js cache version

---

## 🛠️ Verbesserung: Lokales Testing Setup

### Problem
- Lokales Testing war schwierig weil Build für GitHub Pages (mit `/Energy_Price_Germany/` Prefix) erstellt wurde
- `python3 -m http.server` konnte die App nicht korrekt laden

### Lösung
- ✅ Neues Script `scripts/post-build-local.js` erstellt
- ✅ Neue npm Scripts hinzugefügt:
  - `npm run build:local` - Build ohne baseUrl Prefix für lokales Testing
  - `npm run serve:local` - Build + Start lokaler Server auf Port 8080

### Geänderte Dateien
1. `scripts/post-build-local.js` - Neu erstellt (wie post-build.js, aber ohne baseUrl Prefix)
2. `package.json` - Neue Scripts `build:local` und `serve:local` hinzugefügt

### Verwendung
```bash
# Für lokales Testing:
npm run serve:local
# Öffne: http://localhost:8080

# Für Production/GitHub Pages:
npm run build:web
npm run deploy
```

---

## 📋 Wichtige Hinweise

### DO-NOT-CHANGE-PATHS.md - Konformität ✓
- ❌ KEINE Pfadänderungen vorgenommen
- ✅ `public/data/marketdata.json` bleibt unverändert
- ✅ Nur `.nojekyll` Support-Datei hinzugefügt

### DEPLOYMENT-STRATEGY.md - Konformität ✓
- ✅ Kompatibel mit Triple-Redundant Deployment Strategy
- ✅ Keine Änderungen an Workflows (fetch.yml, deploy.yml, scheduled-deploy.yml)
- ✅ Löst das Kern-Problem (404 für `_expo` Ordner)

### DATA-MERGE-STRATEGY.md - Konformität ✓
- ✅ Keine Änderungen an Daten-Merge-Logik
- ✅ Energy Charts + aWATTar Strategie unberührt

---

## ✅ Verifikation

### GitHub Pages Status
```bash
# Prüfe .nojekyll im gh-pages Branch
git ls-tree gh-pages -r --name-only | grep nojekyll

# Expected: .nojekyll
```

### Lokales Testing
```bash
# Build für lokales Testing
npm run build:local

# Server starten
cd dist && python3 -m http.server 8080

# Browser öffnen: http://localhost:8080
# Expected: App lädt erfolgreich
```

### Production Testing
```bash
# Öffne: https://s540d.github.io/Energy_Price_Germany/
# Expected: App lädt erfolgreich (nach ~1-2 Minuten Cache-Update)
```

---

**Status**: ✅ Implementiert und deployed  
**Branch**: `smaller-design-improvements`  
**Pushed**: Ja  
**Deployed**: Ja (gh-pages Branch aktualisiert)
