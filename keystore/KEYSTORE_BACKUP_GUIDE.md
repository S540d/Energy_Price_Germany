# Android Keystore Backup & Management Guide

**Projekt:** Energy Price Germany
**Kritikalität:** 🔴 EXTREM WICHTIG - Ohne Keystore keine App-Updates!

---

## ⚠️ WICHTIG: Warum Keystore-Backup?

Der Android Keystore ist **DER SCHLÜSSEL** zu deiner App:
- Ohne Keystore **keine Updates** im Play Store möglich
- Bei Verlust: Neue App mit neuem Package-Namen nötig (alle User verloren!)
- Play Store akzeptiert nur Updates vom gleichen Keystore
- **Unersetzbar** - es gibt kein "Password vergessen"

**👉 Erstelle SOFORT ein Backup, nachdem der erste Build fertig ist!**

---

## 🔑 Keystore herunterladen

### Methode 1: Via EAS CLI (Empfohlen)

```bash
# Interaktives Credentials-Menü öffnen
npx eas credentials

# Navigation:
# 1. Wähle: "Android"
# 2. Wähle: "Production App" (com.sven4321.energypricegermany)
# 3. Wähle: "Keystore: Manage your Android Keystore"
# 4. Wähle: "Download Keystore"
```

**Output:**
- Datei: `energypricegermany.jks` oder `energypricegermany.keystore`
- Speicherort: Aktuelles Verzeichnis

### Methode 2: Via EAS Dashboard

1. Öffne: https://expo.dev/accounts/devsven/projects/Energy_Price_Germany/credentials
2. Navigiere zu: Android → Production
3. Klicke: "Download Keystore"

---

## 📋 Keystore-Informationen anzeigen

```bash
npx eas credentials

# Dann: Android → Production App → Keystore → View credentials
```

**Wichtige Infos:**
- **Keystore Alias:** Wird für Signierung benötigt
- **Keystore Password:** Wird für Builds benötigt
- **Key Password:** Wird für Signierung benötigt

**Notiere diese Daten sicher!**

---

## 💾 Backup-Speicherorte

### ✅ Sichere Speicherorte:

1. **Passwort-Manager** (1Password, Bitwarden, etc.)
   - Speichere Keystore-Datei als "Secure Note" Attachment
   - Speichere alle Passwörter im gleichen Eintrag
   - Vorteil: Verschlüsselt, zugriffsgeschützt, gesynct

2. **Verschlüsselter Cloud-Speicher**
   - iCloud Keychain
   - Dropbox (verschlüsselter Ordner)
   - Google Drive (verschlüsselt)

3. **Lokale verschlüsselte Backups**
   - Externe Festplatte (verschlüsselt)
   - USB-Stick (verschlüsselt)
   - TimeMachine Backup (macOS)

4. **Private Git Repository** (nur wenn privat & verschlüsselt!)
   ```bash
   # NICHT ins öffentliche Repo!
   echo "*.jks" >> .gitignore
   echo "*.keystore" >> .gitignore
   ```

### ❌ NIEMALS:

- ❌ Unverschlüsselt in Cloud
- ❌ In öffentlichem GitHub Repository
- ❌ Per E-Mail verschicken
- ❌ Nur auf einem Gerät
- ❌ Ohne Backup

---

## 📦 Empfohlene Backup-Struktur

Erstelle einen sicheren Ordner:

```
Energy_Price_Germany_Credentials/
├── keystore/
│   ├── energypricegermany.jks
│   └── keystore-info.txt
├── passwords/
│   └── credentials.txt
└── README.md
```

**keystore-info.txt:**
```txt
Project: Energy Price Germany
Package: com.sven4321.energypricegermany
Keystore File: energypricegermany.jks

Created: 2025-11-04
Via: EAS Build (Expo)
First Build ID: 3e0a7596-316c-43e0-898c-2340ec220a47

Keystore Alias: [ALIAS]
Keystore Password: [PASSWORD]
Key Password: [KEY_PASSWORD]

SHA-256 Fingerprint: [FINGERPRINT]
(Für Google Play App Signing)

WICHTIG: Niemals public machen!
```

---

## 🔄 Keystore für lokale Builds verwenden

Wenn du den Keystore lokal nutzen willst:

### 1. Keystore-Datei platzieren

```bash
mkdir -p android/app/keystore
cp energypricegermany.jks android/app/keystore/
```

### 2. Gradle Properties erstellen

**Datei:** `android/gradle.properties`

```properties
# Keystore-Konfiguration
MYAPP_UPLOAD_STORE_FILE=keystore/energypricegermany.jks
MYAPP_UPLOAD_KEY_ALIAS=your-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your-store-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
```

**⚠️ WICHTIG:** `gradle.properties` in `.gitignore` hinzufügen!

```bash
echo "android/gradle.properties" >> .gitignore
```

### 3. Gradle Build-Konfiguration

**Datei:** `android/app/build.gradle`

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### 4. Lokalen Build erstellen

```bash
cd android
./gradlew bundleRelease

# AAB liegt dann in:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🔐 Keystore-Sicherheit

### Zugriffskontrolle

```bash
# Keystore nur für dich lesbar machen (macOS/Linux)
chmod 600 energypricegermany.jks

# Ordner schützen
chmod 700 android/app/keystore/
```

### Verschlüsselung

**macOS:**
```bash
# Keystore in verschlüsseltes Disk Image packen
hdiutil create -encryption AES-256 -size 10m -volname "AppKeys" \
  -fs HFS+ KeystoreBackup.dmg -srcfolder android/app/keystore/
```

**Linux:**
```bash
# Mit GPG verschlüsseln
gpg --symmetric --cipher-algo AES256 energypricegermany.jks
```

---

## 🆘 Notfall-Plan

### Szenario 1: Keystore verloren

❌ **Keine Lösung!**
- App kann nicht mehr aktualisiert werden
- Neue App mit neuem Package-Namen nötig
- Alle bisherigen User verloren

**Prävention:** MULTIPLE BACKUPS!

### Szenario 2: EAS hat Keystore, du nicht

✅ **Lösung:** Keystore von EAS herunterladen (siehe oben)

### Szenario 3: Passwort vergessen

❌ **Keine Lösung!**
- Keystore ohne Passwort unbrauchbar
- Siehe Szenario 1

**Prävention:** Passwörter im Passwort-Manager!

### Szenario 4: EAS verschwindet

✅ **Lösung:** Mit lokalem Keystore weitermachen
- Keystore lokal speichern (siehe oben)
- Lokale Builds mit Gradle (siehe oben)
- Oder zu anderen CI/CD migrieren (GitHub Actions, etc.)

---

## ✅ Backup-Checkliste

Nach dem ersten erfolgreichen Build:

- [ ] Keystore von EAS heruntergeladen
- [ ] Keystore an mindestens 2 sicheren Orten gespeichert
- [ ] Alle Passwörter im Passwort-Manager gespeichert
- [ ] SHA-256 Fingerprint notiert (für Play Console)
- [ ] Backup getestet (Keystore öffnen, Passwort prüfen)
- [ ] .gitignore aktualisiert (kein versehentliches Commit)
- [ ] Dokumentation mit Keystore-Location erstellt

---

## 📊 Keystore-Informationen prüfen

### Mit keytool (Java)

```bash
# Keystore-Informationen anzeigen
keytool -list -v -keystore energypricegermany.jks

# SHA-256 Fingerprint anzeigen (für Play Console)
keytool -list -v -keystore energypricegermany.jks -alias your-alias

# Gültigkeit prüfen
keytool -list -keystore energypricegermany.jks
```

**Wichtig:** Notiere den SHA-256 Fingerprint - wird für Google Play App Signing benötigt!

---

## 🔄 Keystore rotieren (Fortgeschritten)

**Wann:** Nur bei Sicherheitsvorfällen nötig

**Problem:** Play Store erlaubt keine Keystore-Änderung für bestehende Apps!

**Lösung:** Google Play App Signing nutzen (empfohlen)
- Google verwaltet finalen Signing-Key
- Du kannst Upload-Key rotieren
- Siehe: https://support.google.com/googleplay/android-developer/answer/9842756

---

## 🔗 Nützliche Links

- **EAS Credentials Docs:** https://docs.expo.dev/app-signing/app-credentials/
- **Android Keystore Docs:** https://developer.android.com/studio/publish/app-signing
- **Play App Signing:** https://support.google.com/googleplay/android-developer/answer/9842756

---

## 📞 Support

Bei Problemen mit Credentials:

1. **EAS Support:** support@expo.dev
2. **Expo Discord:** https://chat.expo.dev/
3. **Docs:** https://docs.expo.dev/app-signing/

---

## 💡 Best Practices

1. ✅ **Backup sofort nach erstem Build**
2. ✅ **Mindestens 3 Backup-Locations**
3. ✅ **Passwörter im Passwort-Manager**
4. ✅ **Regelmäßig Backup-Zugriff testen**
5. ✅ **Keystore NIEMALS committen**
6. ✅ **Google Play App Signing aktivieren** (zusätzliche Sicherheit)

---

**Status:** ⏳ Warte auf ersten Build-Abschluss
**Nächster Schritt:** Keystore sofort nach Build-Erfolg herunterladen!
**Backup-Location:** [NOCH FESTLEGEN]

---

*Erstellt: 2025-11-04*
*Projekt: Energy Price Germany*
*Kritikalität: 🔴 EXTREM HOCH*
