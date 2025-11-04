# Expo Bare Workflow Migration Guide

**Projekt:** Energy Price Germany
**Von:** Managed Workflow
**Zu:** Bare Workflow
**Warum:** Volle Kontrolle über nativen Code

---

## 🤔 Was ist Bare Workflow?

### Managed Workflow (aktuell)
- ✅ Einfach, wenig Konfiguration
- ✅ EAS Build kümmert sich um alles
- ❌ Limitierter Zugriff auf nativen Code
- ❌ Manche native Modules nicht möglich

### Bare Workflow (nach Migration)
- ✅ Vollständiger Zugriff auf Android/iOS Code
- ✅ Alle native Modules möglich
- ✅ Custom native Konfiguration
- ❌ Mehr Wartungsaufwand
- ❌ Updates komplexer

---

## 🎯 Wann migrieren?

**Migriere WENN:**
- ✅ Du custom native Module brauchst
- ✅ Du native Code anpassen willst
- ✅ Spezielle Build-Konfigurationen nötig
- ✅ Unabhängigkeit von Expo wichtig

**NICHT migrieren WENN:**
- ✅ Managed Workflow ausreicht
- ✅ Du keine Native-Erfahrung hast
- ✅ Einfachheit wichtiger ist
- ✅ Keine speziellen Anforderungen

**Aktueller Status:** Managed Workflow reicht für dein Projekt!

---

## 🚀 Migration durchführen

### Schritt 1: Backup & Git

```bash
# Neuen Branch erstellen
git checkout -b bare-workflow-migration

# Oder: Backup erstellen
cp -r . ../Energy_Price_Germany_backup
```

### Schritt 2: Expo Prebuild ausführen

```bash
# Generiert /android und /ios Ordner
npx expo prebuild

# Oder mit clean (empfohlen für erste Migration)
npx expo prebuild --clean
```

**Was passiert:**
- Erstellt `/android` Verzeichnis mit vollständigem Android-Projekt
- Erstellt `/ios` Verzeichnis mit vollständigem iOS-Projekt
- Generiert native Konfigurationen aus `app.json`
- Installiert native Dependencies

**Änderungen in Git:**
```bash
git status

# Neue Ordner:
# android/
# ios/

# Geänderte Dateien:
# .gitignore
# package.json
# etc.
```

### Schritt 3: .gitignore anpassen

Expo fügt automatisch hinzu, aber prüfe:

```gitignore
# Expo
.expo/
dist/

# Native
android/
ios/

# ODER: Native Code tracken (empfohlen für bare workflow)
!android/
!ios/

# Aber: Sensible Dateien ignorieren
android/app/keystore/
android/gradle.properties
android/local.properties
ios/Pods/
```

**Entscheidung:**
- **Tracken:** Volle Kontrolle, eigene Änderungen versioniert
- **Nicht tracken:** Immer von app.json neu generieren

### Schritt 4: Dependencies überprüfen

```bash
# Alle Dependencies neu installieren
npm install

# Native Dependencies verlinken (falls nötig)
cd ios && pod install && cd ..
```

### Schritt 5: Test-Build

```bash
# Android Test
npx expo run:android

# iOS Test (nur macOS)
npx expo run:ios

# Oder mit Gradle direkt
cd android && ./gradlew assembleDebug
```

---

## 🔧 Native Code anpassen

### Android

**Hauptdateien:**

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml     ← Permissions, Activities
│   │   ├── java/
│   │   │   └── com/sven4321/energypricegermany/
│   │   │       ├── MainActivity.java    ← Main Activity
│   │   │       └── MainApplication.java ← App Config
│   │   └── res/                    ← Resources (Icons, etc.)
│   └── build.gradle                ← App Build Config
├── build.gradle                    ← Project Build Config
└── gradle.properties               ← Gradle Properties
```

**Beispiel: Custom Permission hinzufügen**

`android/app/src/main/AndroidManifest.xml`:
```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Neue Permission -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application>
        ...
    </application>
</manifest>
```

**Beispiel: Build-Konfiguration anpassen**

`android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.sven4321.energypricegermany"
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 4
        versionName "1.1.0"

        // Custom Build-Config
        buildConfigField "String", "API_URL", "\"https://api.example.com\""
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### iOS

**Hauptdateien:**

```
ios/
├── EnergyPriceGermany/
│   ├── AppDelegate.h              ← App Delegate Header
│   ├── AppDelegate.mm             ← App Delegate Implementation
│   ├── Info.plist                 ← App Configuration
│   └── Images.xcassets/           ← Icons, Images
├── EnergyPriceGermany.xcodeproj/  ← Xcode Project
└── Podfile                        ← CocoaPods Dependencies
```

---

## 🔄 Workflow nach Migration

### Development

```bash
# Start Metro Bundler
npm start

# Android
npx expo run:android

# iOS
npx expo run:ios
```

### Builds

**Mit EAS (weiterhin möglich!):**
```bash
npx eas build --platform android --profile production
```

**Lokal:**
```bash
# Android
cd android && ./gradlew bundleRelease

# iOS (macOS only)
cd ios && xcodebuild -workspace EnergyPriceGermany.xcworkspace \
  -scheme EnergyPriceGermany -configuration Release archive
```

### Updates

**App-Updates:**
```bash
# Version erhöhen
# 1. In app.json
# 2. In android/app/build.gradle (versionCode)
# 3. In ios/EnergyPriceGermany/Info.plist (CFBundleVersion)

# Neu bauen
npx eas build
```

**Native Code-Updates:**
```bash
# Bei Expo-SDK-Update
expo upgrade

# Native Code neu generieren (überschreibt Änderungen!)
npx expo prebuild --clean
```

---

## 🛠️ Native Modules hinzufügen

### Beispiel: Custom Native Module

**1. Installation:**
```bash
npm install react-native-custom-module

# iOS: Pods installieren
cd ios && pod install && cd ..
```

**2. Auto-Linking prüfen:**
```bash
# Meist automatisch durch React Native
npx react-native link
```

**3. Manuelle Konfiguration (falls nötig):**

**Android:** `android/app/build.gradle`
```gradle
dependencies {
    implementation project(':react-native-custom-module')
}
```

**iOS:** Meist durch CocoaPods automatisch

---

## 🔙 Zurück zu Managed Workflow?

**Möglich, aber:**
- Alle nativen Änderungen gehen verloren
- `/android` und `/ios` Ordner löschen
- `npx expo prebuild` nicht mehr ausführen
- EAS Build generiert native Code neu

**Hybrid-Ansatz (empfohlen):**
- Native Code committen
- Aber: Mit `expo prebuild` synchron halten
- Custom-Änderungen dokumentieren
- Bei Expo-Updates vorsichtig sein

---

## 📊 Vergleich: Managed vs. Bare

| Aspekt | Managed | Bare |
|--------|---------|------|
| **Setup** | ⭐⭐⭐⭐⭐ Einfach | ⭐⭐ Komplex |
| **Kontrolle** | ⭐⭐ Limitiert | ⭐⭐⭐⭐⭐ Vollständig |
| **Wartung** | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐ Hoch |
| **Native Modules** | ⭐⭐⭐ Meiste | ⭐⭐⭐⭐⭐ Alle |
| **Updates** | ⭐⭐⭐⭐⭐ Einfach | ⭐⭐ Komplex |
| **EAS Build** | ✅ Ja | ✅ Ja |
| **Build-Zeit** | ⭐⭐⭐⭐ Schnell | ⭐⭐⭐ Mittel |

---

## ⚠️ Wichtige Hinweise

### 1. App.json weiterhin wichtig

Auch im Bare Workflow:
- `app.json` ist Master-Konfiguration
- `expo prebuild` generiert daraus native Config
- Custom-Änderungen können überschrieben werden!

### 2. Expo SDK Updates

```bash
# Update-Prozess
expo upgrade

# Native Code neu generieren (Vorsicht!)
npx expo prebuild --clean

# Oder: Nur Dependencies aktualisieren
npm update
cd ios && pod update && cd ..
```

### 3. Custom Native Code

**Best Practice:**
- Dokumentiere alle nativen Änderungen
- Nutze expo-modules-core für custom Module
- Verwende Expo Config Plugins wo möglich

**Expo Config Plugin (statt direkter Änderung):**
```javascript
// app.config.js
module.exports = {
  expo: {
    plugins: [
      [
        "@config-plugins/custom-plugin",
        {
          permission: "WRITE_EXTERNAL_STORAGE"
        }
      ]
    ]
  }
};
```

---

## 🎯 Empfehlung für dein Projekt

**Aktuell: NICHT migrieren**

Gründe:
- ✅ Managed Workflow reicht völlig aus
- ✅ Keine custom native Module nötig
- ✅ EAS Build funktioniert perfekt
- ✅ Wartungsaufwand minimal

**Wann migrieren:**
- Wenn du custom native Features brauchst
- Wenn du mehr Kontrolle willst
- Wenn du native Entwicklung lernen willst

**Alternative:**
- Bei Bedarf: `expo prebuild` temporär für Debugging
- Nicht committen
- Zurück zu managed mit `git clean -fdx android ios`

---

## ✅ Migration Checkliste

Falls du migrierst:

- [ ] Backup erstellt (Git Branch oder Kopie)
- [ ] `expo prebuild` erfolgreich
- [ ] Test-Build funktioniert (Android & iOS)
- [ ] Alle Features getestet
- [ ] Native Dependencies verlinkt
- [ ] Build-Prozess dokumentiert
- [ ] Team informiert über Änderungen
- [ ] CI/CD angepasst (falls vorhanden)
- [ ] Keystore konfiguriert
- [ ] Production Build erfolgreich

---

## 🔗 Nützliche Links

- **Expo Bare Workflow:** https://docs.expo.dev/bare/overview/
- **Expo Prebuild:** https://docs.expo.dev/workflow/prebuild/
- **Config Plugins:** https://docs.expo.dev/config-plugins/introduction/
- **Native Modules:** https://docs.expo.dev/modules/overview/

---

## 💡 Best Practices

1. ✅ **Nicht überstürzt migrieren** - Managed reicht meist
2. ✅ **Dokumentiere native Änderungen**
3. ✅ **Nutze Config Plugins** statt direkter Änderungen
4. ✅ **Teste nach Migration gründlich**
5. ✅ **Backup vor Migration**
6. ✅ **Team-Training** für native Entwicklung

---

**Status:** 📖 Dokumentation bereit
**Empfehlung:** ⏸️ WARTEN - Erst bei Bedarf migrieren
**Aktueller Workflow:** ✅ Managed Workflow (perfekt!)

---

*Erstellt: 2025-11-04*
*Projekt: Energy Price Germany*
*Current: Managed Workflow → Keep it!*
