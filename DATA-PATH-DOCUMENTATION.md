# 📁 Data Path Documentation

## 🎯 Single Source of Truth

**ALLE Pfade werden zentral in `config.js` definiert!**

⚠️ **WICHTIG**: Bei Pfadänderungen **NUR** `config.js` bearbeiten, nicht die einzelnen Dateien!

## 📂 Aktueller Pfad-Standard

```
Quelle:      public/data/marketdata.json
Archive:     public/data/archive/
Build:       dist/data/marketdata.json
Frontend:    ./data/marketdata.json (relative)
```

## 📋 Dateien die den Pfad verwenden

| Datei | Funktion | Verwendet config.js |
|-------|----------|-------------------|
| `config.js` | ✅ **ZENTRALE KONFIGURATION** | - |
| `update-marketdata.js` | Aktualisiert Daten manuell | ⚠️ TODO |
| `.github/workflows/fetch.yml` | GitHub Actions Workflow | ⚠️ Nicht möglich* |
| `scripts/post-build.js` | Kopiert Dateien nach dist/ | ⚠️ TODO |
| `services/energyDataManager.ts` | Lädt Daten im Frontend | ⚠️ TODO |
| `public/service-worker.js` | PWA Cache-Strategie | ⚠️ Wird generiert |
| `update-cache-version.js` | Cache-Busting | ⚠️ TODO |

\* GitHub Actions kann keine lokalen config.js importieren, daher dokumentiert

## 🔄 Geschichte der Pfad-Änderungen

1. **2025-10-07**: `marketdata.json` (root)
2. **2025-10-08**: `data/marketdata.json`
3. **2025-10-10**: `public/marketdata.json`
4. **2025-10-12**: `public/data/marketdata.json` ← **AKTUELL & FINAL**

## ✅ Warum `public/data/` die beste Lösung ist:

### Vorteile:
- ✅ **Klare Trennung**: Assets vs. Data
- ✅ **Skalierbar**: Weitere Data-Dateien können hinzugefügt werden
- ✅ **Organisiert**: Archive im selben Ordner (`public/data/archive/`)
- ✅ **Standard**: Entspricht Best Practices (z.B. Next.js, Create React App)

### Warum NICHT `public/` direkt:
- ❌ Vermischt Data mit Icons, Manifest, etc.
- ❌ Unübersichtlich bei mehreren Data-Files
- ❌ Archive wären in `public/archive/` (verwirrt mit anderen Assets)

### Warum NICHT Root-Level:
- ❌ Wird nicht automatisch in den Build kopiert
- ❌ Expo erwartet Assets in `public/`
- ❌ GitHub Pages würde separates Setup benötigen

## 🔒 Migration Plan (falls jemals nötig)

**Schritte für Pfad-Änderung:**

1. ✅ Update `config.js` mit neuem Pfad
2. ✅ Update `update-marketdata.js` (verwende config.js)
3. ✅ Update `scripts/post-build.js` (verwende config.js)
4. ✅ Update `services/energyDataManager.ts` (verwende config)
5. ✅ Update `update-cache-version.js` (verwende config.js)
6. ⚠️ Manuell: `.github/workflows/fetch.yml` anpassen
7. ✅ Alte Dateien verschieben: `mv public/data/* new/path/`
8. ✅ Commit & Deploy

## 🧪 Validierung nach Änderung

```bash
# 1. Lokaler Test
node update-marketdata.js
npm run build:web
npx serve dist -p 3000

# 2. Prüfen ob Datei existiert
ls -la public/data/marketdata.json
ls -la dist/data/marketdata.json

# 3. Deployment Test
npm run deploy:gh-pages
# Öffne: https://s540d.github.io/Energy_Price_Germany/
```

## 📝 Lessons Learned

> "Pfade sollten zentral definiert und dokumentiert werden, nicht verstreut über 6+ Dateien!"

**Problem**: Historisch wurde der Pfad mehrmals geändert, jedes Mal mussten viele Dateien angepasst werden.

**Lösung**: `config.js` als Single Source of Truth einführen.

**Zukunft**: Bei Pfadänderungen nur `config.js` + Workflow YAML + Dokumentation ändern.
