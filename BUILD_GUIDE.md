# Android Build Guide - EAS Build

**Projekt:** Energy Price Germany
**Build System:** Expo Application Services (EAS)
**Platform:** Android (AAB für Google Play Store)

---

## 🚀 Quick Start

```bash
# Production Build für Play Store
npx eas build --platform android --profile production

# Build-Status überprüfen
npx eas build:list

# Neuesten Build herunterladen
npx eas build:download --platform android --profile production
```

---

## 📋 Voraussetzungen

### 1. EAS CLI installiert
```bash
npm install --save-dev eas-cli
# oder global: npm install -g eas-cli
```

### 2. Expo/EAS Account
- Account: `devsven`
- Projekt-ID: `db5fda3f-4953-4286-8682-b0a4b31573f2`
- Einloggen: `npx eas login`

### 3. Konfigurationsdateien
- ✅ `eas.json` - Build-Profile konfiguriert
- ✅ `app.json` - App-Metadaten (Version, Package, Permissions)
- ✅ Android Keystore - Automatisch von EAS verwaltet

---

## 🔧 Build-Profile

### Production (Play Store)
```bash
npx eas build --platform android --profile production
```
- **Output:** Android App Bundle (.aab)
- **Verwendung:** Google Play Store Submission
- **Signiert:** Mit automatischem Keystore
- **Dauer:** 10-20 Minuten

### Preview (Testing)
```bash
npx eas build --platform android --profile preview
```
- **Output:** APK (.apk)
- **Verwendung:** Interne Tests, direktes Installieren
- **Dauer:** ~10 Minuten

### Development
```bash
npx eas build --platform android --profile development
```
- **Output:** Development APK
- **Verwendung:** Entwicklung mit Live-Reload

---

## 📦 Build-Prozess

### Schritt 1: Version aktualisieren
Vor jedem neuen Build die Version erhöhen:

**In `app.json`:**
```json
{
  "expo": {
    "version": "1.2.0",        // Erhöhen (Semantic Versioning)
    "android": {
      "versionCode": 5          // MUSS erhöht werden!
    }
  }
}
```

**In `package.json`:**
```json
{
  "version": "1.2.0"
}
```

**Automatisch:**
```bash
npm run version:update  # Erhöht patch version (1.1.0 → 1.1.1)
```

### Schritt 2: Build starten
```bash
npx eas build --platform android --profile production
```

EAS fragt:
- ✅ Credentials? → "Use remote credentials" (empfohlen)
- ✅ Keystore? → "Yes" (nur beim ersten Build)

### Schritt 3: Build überwachen
```bash
# In der Console
npx eas build:list

# Oder Web-Dashboard
https://expo.dev/accounts/devsven/projects/Energy_Price_Germany/builds
```

### Schritt 4: Build herunterladen
```bash
# Neuesten Build herunterladen
npx eas build:download --platform android --profile production

# Spezifischen Build herunterladen
npx eas build:download --id <build-id>

# Beispiel (aktueller Build):
npx eas build:download --id 3e0a7596-316c-43e0-898c-2340ec220a47
```

Die AAB-Datei wird in den Downloads-Ordner gespeichert.

**Hinweis:** AAB/APK-Dateien werden nicht in git committed (zu groß, 83MB). Sie können jederzeit von EAS heruntergeladen werden.

---

## 🎯 Build für Google Play Store

### Dateien für Play Store Upload:
1. **AAB-Datei** (von EAS heruntergeladen)
2. **App-Icon** - `play-store-assets/icon-512x512.png`
3. **Feature Graphic** - `play-store-assets/feature-graphic.png`
4. **Screenshots** - `play-store-assets/Screenshot*.png`
5. **Store-Texte** - `ANDROID_STORE_CHECKLIST.md`

### Upload-Prozess:
1. Google Play Console öffnen: https://play.google.com/console
2. App-Release → Production → Neues Release erstellen
3. AAB hochladen
4. Store Listing vervollständigen
5. Zur Überprüfung einreichen

---

## 🔑 Keystore Management

### Automatisch (Empfohlen)
EAS verwaltet den Keystore automatisch:
- Beim ersten Build erstellt
- Sicher in der Cloud gespeichert
- Automatisch für alle Builds verwendet

### Keystore ansehen
```bash
npx eas credentials

# Dann: Android → Production App → Keystore
```

### Keystore herunterladen (Backup)
```bash
npx eas credentials
# Wähle: Android → Production App → Keystore → Download
```

**Wichtig:** Backup des Keystores sicher aufbewahren! Ohne Keystore keine Updates möglich.

---

## 🐛 Troubleshooting

### Build schlägt fehl
```bash
# Logs ansehen
npx eas build:view <build-id>

# Neuesten Build-Log
npx eas build:view
```

Häufige Probleme:
- **Out of Memory:** Verkleinere Dependencies
- **Native Module Error:** Überprüfe react-native-Versionen
- **Keystore Error:** Regeneriere Credentials

### Version-Konflikt
```bash
# Versionen synchronisieren
npm run version:update
git add app.json package.json
git commit -m "chore: Bump version to X.X.X"
```

### Build hängt
- Warte mindestens 20 Minuten
- Checke Status: `npx eas build:list`
- Bei Timeout: Build neu starten

---

## 📊 Build-Historie

### Alle Builds anzeigen
```bash
npx eas build:list

# Nach Platform filtern
npx eas build:list --platform android

# Nur Production Builds
npx eas build:list --profile production
```

### Build abbrechen
```bash
npx eas build:cancel <build-id>
```

---

## 🔄 Versionierung

### Semantic Versioning
- **Major (1.0.0 → 2.0.0):** Breaking Changes
- **Minor (1.0.0 → 1.1.0):** Neue Features
- **Patch (1.0.0 → 1.0.1):** Bug Fixes

### versionCode (Android)
- **MUSS** bei jedem Play Store Update erhöht werden
- Integer, sequentiell (1, 2, 3, 4, ...)
- Kann nicht zurückgesetzt werden

### Aktuelle Version
- **Version:** 1.1.0
- **versionCode:** 4

---

## 📝 Checkliste vor Build

- [ ] Code committed und gepusht
- [ ] Version in `app.json` erhöht
- [ ] versionCode in `app.json` erhöht
- [ ] Version in `package.json` synchronisiert
- [ ] Tests durchgeführt (falls vorhanden)
- [ ] CHANGELOG aktualisiert (optional)
- [ ] EAS eingeloggt: `npx eas whoami`

---

## 🔗 Nützliche Links

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Build Dashboard:** https://expo.dev/accounts/devsven/projects/Energy_Price_Germany/builds
- **Google Play Console:** https://play.google.com/console
- **Keystore Guide:** https://docs.expo.dev/app-signing/app-credentials/

---

## 💡 Tipps

1. **Builds cachen:** EAS cached Dependencies, spätere Builds sind schneller
2. **Parallel Builds:** Mehrere Builds gleichzeitig möglich (iOS + Android)
3. **Auto-Submit:** Automatisches Hochladen zu Play Store möglich (siehe `eas.json`)
4. **Build Logs:** Logs werden 6 Monate gespeichert
5. **Free Tier:** 30 Builds/Monat kostenlos

---

## 📞 Support

Bei Problemen:
1. **EAS Docs:** https://docs.expo.dev/eas/
2. **Expo Discord:** https://chat.expo.dev/
3. **GitHub Issues:** https://github.com/expo/eas-cli/issues

---

## 📦 Letzter erfolgreicher Build

**Build-ID:** 3e0a7596-316c-43e0-898c-2340ec220a47
**Datum:** 2025-11-04 22:24:22 UTC
**Status:** ✅ SUCCESS
**Version:** 1.1.0 (versionCode: 4)
**Dauer:** 10 Minuten 5 Sekunden
**Größe:** 83 MB
**Datei:** energy-price-germany-v1.1.0-production.aab
**Speicherort:** play-store-assets/

**Build-Details:**
- Platform: Android
- Profile: production
- Build-Type: app-bundle (AAB)
- Keystore: Automatisch von EAS verwaltet (erstes Keystore für Projekt)
- Package: com.sven4321.energypricegermany

**Status:** ✅ Bereit für Play Store Upload!

---

*Erstellt: 2025-11-04*
*Projekt: Energy Price Germany*
*Owner: devsven*
*Letzter Build: 2025-11-04*
