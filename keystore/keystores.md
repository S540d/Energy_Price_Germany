# 🔐 Keystore - Energy Price Germany

## ⚠️ KRITISCH - NICHT LÖSCHEN!

Dieses Verzeichnis enthält die **Signing-Keys** für die Android-App.

---

## 📄 Keystore-Datei

**Dateiname:** `@devsven__Energy_Price_Germany.jks`

| Property | Wert |
|----------|------|
| Type | JKS (Java KeyStore) |
| Key Alias | `3b9f32cd6d66828def76c27fa7602031` |
| MD5 Fingerprint | `49:12:91:DB:9D:62:85:17:E6:E0:FD:B3:24:59:8B:42` |
| SHA1 Fingerprint | `EA:0D:A7:16:A1:CD:E1:C1:7C:F7:0D:1F:A8:14:99:8D:35:62:51:F3` |
| SHA256 Fingerprint | `14:91:FB:86:0D:D5:A5:20:C5:5D:6B:21:6E:BC:71:D3:9A:B9:08:CD:92:3C:26:6B:22:25:62:F9:7A:FA:47:71` |
| Erstellt | November 2025 |

---

## 🔒 Sensitive Keystore Information

**NIEMALS COMMITTEN ODER TEILEN!**

**Die tatsächlichen Credentials sind in `credentials.json` (lokal, nicht in Git) gespeichert.**

Erforderliche Informationen:
- Keystore password: `[in credentials.json]`
- Key alias: `[in credentials.json]`
- Key password: `[in credentials.json]`
- Path to Keystore: `@devsven__Energy_Price_Germany.jks`

---

## 🏗️ Build-Konfiguration

### EAS Build (credentials.json)

**Lokale Datei (nicht in Git):**

```json
{
  "android": {
    "keystore": {
      "keystorePath": "@devsven__Energy_Price_Germany.jks",
      "keystorePassword": "[SENSITIVE - siehe lokale credentials.json]",
      "keyAlias": "[SENSITIVE - siehe lokale credentials.json]",
      "keyPassword": "[SENSITIVE - siehe lokale credentials.json]"
    }
  }
}
```

### eas.json

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "local"
      }
    }
  }
}
```

---

## 🔐 Git Protection

✅ **Keystore ist in `.gitignore` geschützt:**

```gitignore
# Native
*.jks
credentials.json

# Keystore directory
keystore/
```

**Überprüfung:**
```bash
git check-ignore -v credentials.json
git check-ignore -v keystore/@devsven__Energy_Price_Germany.jks
```

---

## ⚠️ WICHTIG

### Warum ist der Keystore so wichtig?

1. **App-Updates:** Nur mit diesem Keystore können App-Updates im Play Store hochgeladen werden
2. **Einmalig:** Wenn der Keystore verloren geht, kann die App NICHT mehr aktualisiert werden
3. **Neu starten:** Bei Verlust muss die App komplett neu im Play Store veröffentlicht werden (neue Package ID)

### Was passiert bei Verlust?

❌ **Ohne Keystore:**
- Keine Updates mehr möglich
- Neue App muss erstellt werden
- Alle Nutzer müssen neue App installieren
- Alle Bewertungen gehen verloren
- Alle Downloads/Statistiken gehen verloren

---

## 📦 Verwendung

### Mit EAS Build

```bash
# Production Build (nutzt credentials.json automatisch)
npx eas-cli build --platform android --profile production
```

### Manuell (falls nötig)

```bash
# Signatur überprüfen (Passwort siehe credentials.json)
keytool -list -v -keystore @devsven__Energy_Price_Germany.jks \
  -storepass [KEYSTORE_PASSWORD]
```

---

## 📚 Referenzen

- [BUILD.md](../BUILD.md) - Komplette Build-Dokumentation
- [KEYSTORE_BACKUP_GUIDE.md](./KEYSTORE_BACKUP_GUIDE.md) - Backup-Strategien
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

---

**Status:** ✅ Gesichert und geschützt
**Letztes Update:** 8. November 2025
**Build-System:** EAS Build
