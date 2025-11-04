# Lokale Android Builds (ohne EAS) - Guide

**Projekt:** Energy Price Germany
**Alternative zu:** EAS Build
**Warum:** Volle Kontrolle, keine Cloud-Abhängigkeit

---

## 🎯 Wann lokale Builds?

**Verwende lokale Builds wenn:**
- ✅ EAS Build-Limit erreicht
- ✅ Vollständige Kontrolle gewünscht
- ✅ Offline arbeiten nötig
- ✅ Custom native Module
- ✅ CI/CD (GitHub Actions, etc.)
- ✅ Kostenersparnis bei vielen Builds

**Verwende EAS Build wenn:**
- ✅ Einfachheit wichtiger als Kontrolle
- ✅ Keine lokale Android-Umgebung
- ✅ Wenige Builds pro Monat
- ✅ Keine Zeit für Setup

---

## 📋 Voraussetzungen

### 1. Entwicklungsumgebung

**macOS:**
```bash
# Homebrew installieren (falls nicht vorhanden)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Java JDK 17 installieren
brew install openjdk@17

# Java-Path setzen
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

**Windows:**
- Installiere JDK 17 von: https://adoptium.net/
- Setze JAVA_HOME in Systemvariablen

### 2. Android Studio & SDK

**Download:** https://developer.android.com/studio

**Installation:**
1. Android Studio installieren
2. SDK Manager öffnen (Settings → Appearance & Behavior → System Settings → Android SDK)
3. Installieren:
   - ✅ Android SDK Platform 34 (oder höher)
   - ✅ Android SDK Build-Tools 34.0.0
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator (optional, für Tests)

**Umgebungsvariablen setzen:**

**macOS/Linux (~/.zshrc oder ~/.bashrc):**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Windows (Systemvariablen):**
```
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
PATH=%PATH%;%ANDROID_HOME%\platform-tools
PATH=%PATH%;%ANDROID_HOME%\tools
```

### 3. Verifiziere Installation

```bash
# Java Version prüfen
java -version
# Sollte zeigen: openjdk version "17.x.x"

# Android SDK prüfen
echo $ANDROID_HOME
# Sollte Pfad zum SDK zeigen

# ADB prüfen
adb version
# Sollte Version anzeigen
```

---

## 🔨 Build-Prozess

### Schritt 1: Native Android-Code generieren

```bash
# Pre-Build: Generiert native Android/iOS Code
npx expo prebuild --platform android

# WICHTIG: Diese Befehle erstellen einen /android Ordner
# Danach hast du vollen Zugriff auf native Android-Konfiguration
```

**Was passiert:**
- Erstellt `/android` Verzeichnis
- Generiert `build.gradle`, `AndroidManifest.xml`, etc.
- Konfiguriert native Dependencies
- Projekt ist nun "bare workflow"

**Warnung:** Nach `expo prebuild` kannst du EAS Build weiternutzen ODER lokale Builds, aber das Projekt ist dann "ejected".

### Schritt 2: Keystore konfigurieren

**A) Keystore von EAS verwenden:**

```bash
# 1. Keystore von EAS herunterladen (siehe KEYSTORE_BACKUP_GUIDE.md)
npx eas credentials
# → Android → Production → Keystore → Download

# 2. Keystore platzieren
mkdir -p android/app/keystore
mv energypricegermany.jks android/app/keystore/

# 3. Credentials konfigurieren
# Siehe unten: "Keystore-Konfiguration"
```

**B) Neuen Keystore erstellen (nur wenn kein EAS-Keystore):**

```bash
keytool -genkeypair -v -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias energypricegermany \
  -keystore android/app/keystore/energypricegermany.jks \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Energy Price Germany, OU=Development, O=YourCompany, L=City, S=State, C=DE"
```

**⚠️ ACHTUNG:** Wenn du einen neuen Keystore erstellst, kannst du KEINE Updates für die bestehende App im Play Store hochladen!

### Schritt 3: Keystore-Konfiguration

**Datei erstellen:** `android/gradle.properties`

```properties
# Release Keystore Configuration
MYAPP_UPLOAD_STORE_FILE=keystore/energypricegermany.jks
MYAPP_UPLOAD_KEY_ALIAS=your-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your-store-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password

# Andere Properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
android.useAndroidX=true
android.enableJetifier=true
```

**WICHTIG:** Datei in `.gitignore` hinzufügen!

```bash
echo "android/gradle.properties" >> .gitignore
```

### Schritt 4: Build.gradle anpassen

**Datei:** `android/app/build.gradle`

Füge signingConfigs hinzu:

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
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### Schritt 5: Build erstellen

**AAB (für Play Store):**
```bash
cd android
./gradlew bundleRelease

# Output:
# android/app/build/outputs/bundle/release/app-release.aab
```

**APK (für direktes Installieren):**
```bash
cd android
./gradlew assembleRelease

# Output:
# android/app/build/outputs/apk/release/app-release.apk
```

**Build mit Expo CLI:**
```bash
# AAB
npx expo run:android --variant release

# APK (automatisch installiert wenn Gerät verbunden)
npx expo run:android --device
```

### Schritt 6: Build überprüfen

```bash
# AAB Inhalt prüfen
bundletool build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=/tmp/app.apks \
  --mode=universal

# APK installieren (Gerät per USB verbunden)
adb install android/app/build/outputs/apk/release/app-release.apk

# Oder direkt:
cd android && ./gradlew installRelease
```

---

## 🔧 Optimierungen

### ProGuard (Code-Shrinking)

**Datei:** `android/app/proguard-rules.pro`

```pro
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Victory Native (Charts)
-keep class com.horcrux.svg.** { *; }

# Expo
-keep class expo.modules.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }
```

### Build-Performance

**Datei:** `android/gradle.properties`

```properties
# Gradle Performance
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true

# Memory
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError
```

### Build-Varianten

**Datei:** `android/app/build.gradle`

```gradle
android {
    ...
    flavorDimensions "version"
    productFlavors {
        production {
            dimension "version"
            applicationIdSuffix ""
            versionNameSuffix ""
        }
        staging {
            dimension "version"
            applicationIdSuffix ".staging"
            versionNameSuffix "-staging"
        }
    }
}
```

Build mit:
```bash
./gradlew bundleProductionRelease
./gradlew bundleStagingRelease
```

---

## 🚀 CI/CD Integration

### GitHub Actions

**Datei:** `.github/workflows/android-build.yml`

```yaml
name: Android Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate native code
      run: npx expo prebuild --platform android --clean

    - name: Decode Keystore
      env:
        KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
      run: |
        echo $KEYSTORE_BASE64 | base64 -d > android/app/keystore/release.jks

    - name: Create gradle.properties
      env:
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      run: |
        echo "MYAPP_UPLOAD_STORE_FILE=keystore/release.jks" >> android/gradle.properties
        echo "MYAPP_UPLOAD_KEY_ALIAS=$KEY_ALIAS" >> android/gradle.properties
        echo "MYAPP_UPLOAD_STORE_PASSWORD=$KEYSTORE_PASSWORD" >> android/gradle.properties
        echo "MYAPP_UPLOAD_KEY_PASSWORD=$KEY_PASSWORD" >> android/gradle.properties

    - name: Build AAB
      run: |
        cd android
        ./gradlew bundleRelease

    - name: Upload AAB
      uses: actions/upload-artifact@v3
      with:
        name: app-release.aab
        path: android/app/build/outputs/bundle/release/app-release.aab
```

**Secrets in GitHub einrichten:**

```bash
# 1. Keystore zu Base64 konvertieren
base64 -i android/app/keystore/energypricegermany.jks | pbcopy

# 2. In GitHub: Settings → Secrets → New repository secret
# Name: KEYSTORE_BASE64
# Value: [Paste from clipboard]

# 3. Weitere Secrets:
# KEYSTORE_PASSWORD = dein-store-password
# KEY_ALIAS = dein-key-alias
# KEY_PASSWORD = dein-key-password
```

---

## 🐛 Troubleshooting

### Problem: "SDK location not found"

```bash
# Lösung: local.properties erstellen
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### Problem: "Execution failed for task ':app:validateSigningRelease'"

```bash
# Lösung: Keystore-Pfad prüfen
ls -la android/app/keystore/
cat android/gradle.properties
```

### Problem: "Out of memory"

```bash
# Lösung: Gradle Memory erhöhen
echo "org.gradle.jvmargs=-Xmx4096m" >> android/gradle.properties
```

### Problem: "Task :app:bundleReleaseJsAndAssets FAILED"

```bash
# Lösung: Metro Bundler Cache löschen
npx react-native start --reset-cache

# Oder Gradle Cache
cd android && ./gradlew clean
```

### Problem: Build sehr langsam

```bash
# Lösung 1: Gradle Daemon aktivieren
echo "org.gradle.daemon=true" >> android/gradle.properties

# Lösung 2: Parallele Builds
echo "org.gradle.parallel=true" >> android/gradle.properties

# Lösung 3: Build Cache nutzen
echo "org.gradle.caching=true" >> android/gradle.properties
```

---

## 📊 Build-Zeiten

**Erste Build:** 15-30 Minuten
**Nachfolgende Builds:** 3-10 Minuten (mit Cache)

**Optimierungen:**
- Gradle Daemon: -50% Zeit
- Build Cache: -40% Zeit
- Parallel Builds: -30% Zeit
- Mehr RAM: -20% Zeit

---

## ✅ Checkliste

Vor dem ersten lokalen Build:

- [ ] Java JDK 17 installiert
- [ ] Android Studio & SDK installiert
- [ ] Umgebungsvariablen gesetzt
- [ ] `expo prebuild` ausgeführt
- [ ] Keystore vorhanden und konfiguriert
- [ ] `gradle.properties` erstellt (nicht committed!)
- [ ] Build.gradle angepasst
- [ ] Erster Build erfolgreich
- [ ] AAB auf Gerät getestet

---

## 🔗 Nützliche Links

- **Android Studio:** https://developer.android.com/studio
- **Gradle Docs:** https://docs.gradle.org/
- **React Native Build:** https://reactnative.dev/docs/signed-apk-android
- **Expo Prebuild:** https://docs.expo.dev/workflow/customizing/
- **ProGuard:** https://www.guardsquare.com/manual/configuration

---

## 💡 Best Practices

1. ✅ **Keystore niemals committen**
2. ✅ **gradle.properties in .gitignore**
3. ✅ **Regelmäßig testen** (nicht nur vor Release)
4. ✅ **Build-Logs aufbewahren**
5. ✅ **CI/CD für automatische Builds**
6. ✅ **AAB für Play Store, APK für Testing**

---

**Status:** 📖 Dokumentation bereit
**Nächster Schritt:** Nach erstem EAS Build lokal testen
**Estimated Setup Time:** 1-2 Stunden

---

*Erstellt: 2025-11-04*
*Projekt: Energy Price Germany*
*Alternative zu: EAS Build*
