# Build-Dokumentation - Energy Price Germany

## Build-Übersicht

| Plattform | Methode | Ausgabe |
|-----------|---------|---------|
| Web | GitHub Actions (automatisch) | GitHub Pages |
| Android | Lokaler Build | `.aab` für Play Store |

---

## Android App Bundle bauen

### Voraussetzungen

- **Java 17** (`java -version` sollte `openjdk 17` zeigen)
  - Falls nicht vorhanden: `brew install openjdk@17`
- **Keystore** `@devsven__Energy_Price_Germany.jks` im Projekt-Root (gitignored)
- **Credentials** `credentials.json` im Projekt-Root (gitignored)

### Credentials-Struktur (`credentials.json`)

```json
{
  "android": {
    "keystore": {
      "keystorePath": "@devsven__Energy_Price_Germany.jks",
      "keystorePassword": "***",
      "keyAlias": "***",
      "keyPassword": "***"
    }
  }
}
```

### Build-Schritte

**Schritt 1: Android-Projekt generieren**

```bash
EXPO_ENV=production npx expo prebuild --platform android --clean
```

> Das `/android`-Verzeichnis wird neu generiert (nicht in Git).

**Schritt 2: Signierten AAB bauen**

```bash
cd android && ./gradlew bundleRelease --no-daemon --console=plain \
  -PMYAPP_UPLOAD_STORE_FILE=../@devsven__Energy_Price_Germany.jks \
  -PMYAPP_UPLOAD_STORE_PASSWORD=<keystorePassword> \
  -PMYAPP_UPLOAD_KEY_ALIAS=<keyAlias> \
  -PMYAPP_UPLOAD_KEY_PASSWORD=<keyPassword>
```

Werte aus `credentials.json` entnehmen.

**Ausgabe:**

```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Keystore-Informationen

| Property | Wert |
|----------|------|
| Datei | `@devsven__Energy_Price_Germany.jks` |
| SHA1 | `[REDACTED-SHA1]` |
| SHA256 | `[REDACTED-SHA256]` |

> **NIEMALS committen!** Bei Verlust kann die App nicht mehr aktualisiert werden. Backup sicher aufbewahren.

---

## Google Play Store Upload

1. Öffne [Google Play Console](https://play.google.com/console)
2. Wähle "Energy Prices Germany"
3. Gehe zu **Production** → **Create new release**
4. Lade `app-release.aab` hoch
5. Release Notes hinzufügen
6. Review & Roll Out

---

## Aktuelle Version

**Version:** 1.4.0
**Version Code:** 11
**Package:** `com.sven4321.energypricegermany`

> Versions-Wahrheit liegt in `app.json` → `expo.version` und `expo.android.versionCode`.
> Bei jedem Release muss der `versionCode` um 1 erhöht werden.

---

## Web-Build

Der Web-Build läuft vollautomatisch via GitHub Actions:

- **Trigger:** Push auf `main`, `staging` oder `testing`
- **Deployment:** GitHub Pages
- **URLs:**
  - Production: https://s540d.github.io/Energy_Price_Germany/
  - Staging: https://s540d.github.io/Energy_Price_Germany/staging/
  - Testing: https://s540d.github.io/Energy_Price_Germany/testing/

Manueller lokaler Web-Build:

```bash
npm run build:web     # Production Build
npm run serve:local   # Lokaler Dev-Server (Port 8080)
```

---

## AAB prüfen (optional)

```bash
# Signatur verifizieren
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab

# Mit bundletool testen (APKs aus AAB generieren)
bundletool build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks \
  --mode=universal
unzip app.apks -d apks/
adb install apks/universal.apk
```

---

## Troubleshooting

### Java-Version falsch
```bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
```

### Gradle-Build schlägt fehl
```bash
# Projekt neu generieren
EXPO_ENV=production npx expo prebuild --platform android --clean

# Gradle-Cache leeren
cd android && ./gradlew clean
```

### Keystore nicht gefunden
Sicherstellen dass `@devsven__Energy_Price_Germany.jks` im Projekt-Root liegt (nicht im `android/`-Verzeichnis).

---

## Build-Verlauf

| Version | versionCode | Datum | Anmerkung |
|---------|-------------|-------|-----------|
| 1.4.0 | 11 | Februar 2026 | Erster lokaler Build (ohne EAS) |
| 1.1.0 | 4 | November 2025 | EAS Build |

---

**Letzte Aktualisierung:** Februar 2026
**Build-System:** Lokaler Build (expo prebuild + Gradle)
