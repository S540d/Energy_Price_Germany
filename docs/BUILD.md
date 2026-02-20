# Build-Dokumentation - Energy Price Germany

## 🏗️ Build-System

Dieses Projekt nutzt **EAS Build** (Expo Application Services) für Android-Builds.

---

## 📦 Android App Bundle erstellen

### Voraussetzungen

- Expo Account (devsven)
- EAS CLI installiert: `npm install -g eas-cli`
- Eingeloggt: `eas login`

### Build ausführen

```bash
# Production Build (AAB für Play Store)
npx eas-cli build --platform android --profile production

# Preview Build (APK zum Testen)
npx eas-cli build --platform android --profile preview
```

### Build-Profile (eas.json)

#### Production
- **Format:** App Bundle (.aab)
- **Signierung:** Lokal via `credentials.json`
- **Verwendung:** Google Play Store Upload

#### Preview
- **Format:** APK (.apk)
- **Distribution:** Internal Testing
- **Verwendung:** Lokale Tests

---

## 🔐 Keystore-Konfiguration

### credentials.json

Die Keystore-Informationen sind in `credentials.json` gespeichert:

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

**WICHTIG:**
- `credentials.json` ist in `.gitignore`
- Keystore liegt im `keystore/`-Verzeichnis
- Details siehe: `keystore/keystores.md`

### Keystore-Fingerprints

| Property | Wert |
|----------|------|
| SHA1 | `EA:0D:A7:16:A1:CD:E1:C1:7C:F7:0D:1F:A8:14:99:8D:35:62:51:F3` |
| SHA256 | `14:91:FB:86:0D:D5:A5:20:C5:5D:6B:21:6E:BC:71:D3:9A:B9:08:CD:92:3C:26:6B:22:25:62:F9:7A:FA:47:71` |

---

## 📱 Aktuelle Version

**Version:** 1.3.0
**Version Code:** 10
**Package:** com.sven4321.energypricegermany

---

## 🚀 Build-Verlauf

### v1.1.0 (Build 4)
- **Datum:** 8. November 2025
- **Build-ID:** f0e2b03d-bf45-4763-ad88-97eb7b0c44db
- **Build-Logs:** https://expo.dev/accounts/devsven/projects/Energy_Price_Germany/builds/f0e2b03d-bf45-4763-ad88-97eb7b0c44db

---

## 📥 Build herunterladen

```bash
# AAB von EAS herunterladen
npx eas-cli build:download --platform android --profile production
```

Oder direkt vom Artifact Link (siehe Build-Logs).

---

## 🔍 Build überprüfen

### AAB inspizieren

```bash
# Mit bundletool
bundletool dump manifest --bundle=builds/energy-price-germany-v1.1.0.aab

# Signatur überprüfen
jarsigner -verify -verbose -certs builds/energy-price-germany-v1.1.0.aab
```

### Lokales Testen

```bash
# APKs aus AAB generieren
bundletool build-apks \
  --bundle=builds/energy-price-germany-v1.1.0.aab \
  --output=app.apks \
  --mode=universal

# APK extrahieren
unzip app.apks -d apks/

# Auf Gerät installieren
adb install apks/universal.apk
```

---

## 📤 Google Play Store Upload

### Manueller Upload

1. Öffne [Google Play Console](https://play.google.com/console)
2. Wähle "Energy Prices Germany"
3. Gehe zu **Production** → **Create new release**
4. Upload: `builds/energy-price-germany-v1.1.0.aab`
5. Release Notes hinzufügen
6. Review & Roll Out

### Automatischer Upload (Optional)

Mit EAS Submit:

```bash
npx eas-cli submit --platform android --profile production
```

**Benötigt:** `google-service-account.json` (siehe `eas.json`)

---

## ⚠️ Wichtige Hinweise

### Versionierung

- **Version Name:** In `app.json` → `expo.version`
- **Version Code:** Automatisch via EAS (remote)
- Bei jedem Play Store Upload muss Version Code erhöht werden

### Keystore

- **NIEMALS** committen!
- Backups sicher aufbewahren (siehe `keystore/KEYSTORE_BACKUP_GUIDE.md`)
- Bei Verlust: App kann NICHT mehr aktualisiert werden

### Build-Zeiten

- **EAS Build:** ~5-10 Minuten
- **Google Review:** 1-3 Tage
- **Veröffentlichung:** Automatisch nach Approval

---

## 🛠️ Troubleshooting

### Build schlägt fehl

```bash
# Logs ansehen
npx eas-cli build:view

# Lokal testen
npx expo run:android
```

### Credentials-Fehler

```bash
# Credentials zurücksetzen
npx eas-cli credentials

# Oder manuell credentials.json prüfen
```

### Version-Konflikt

```bash
# Remote Version anzeigen
npx eas-cli build:version:get --platform android

# Remote Version setzen
npx eas-cli build:version:set --platform android
```

---

## 📚 Referenzen

- [EAS Build Dokumentation](https://docs.expo.dev/build/introduction/)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Google Play Console](https://play.google.com/console)
- [Expo Project](https://expo.dev/accounts/devsven/projects/Energy_Price_Germany)

---

**Letzte Aktualisierung:** Februar 2026
**Build-System:** EAS Build (Expo)
**Status:** ✅ Bereit für Play Store
