# Android AAB bauen (lokaler Build)

Baut einen signierten Android App Bundle (.aab) für den Play Store – vollständig lokal ohne EAS Cloud.

## Voraussetzungen prüfen

1. Prüfe ob `credentials.json` im Projekt-Root vorhanden ist
2. Prüfe ob `@devsven__Energy_Price_Germany.jks` im Projekt-Root vorhanden ist
3. Lies die Signing-Daten aus `credentials.json` (keystorePassword, keyAlias, keyPassword)
4. Stelle sicher, dass Java 17 installiert ist (`java -version`)
5. Stelle sicher, dass der aktuelle Branch `main` ist und kein uncommitted State existiert

## Build durchführen

### Schritt 1: Android-Projekt generieren
```bash
EXPO_ENV=production npx expo prebuild --platform android --clean
```

### Schritt 2: signing config in build.gradle prüfen/setzen
Nach dem prebuild muss `android/app/build.gradle` eine `release` signingConfig haben.
Prüfe ob `signingConfigs.release` vorhanden ist (nicht `signingConfigs.debug` für release buildType).
Falls nicht, füge es ein (siehe unten).

**WICHTIG:** Der Keystore-Pfad muss **absolut** übergeben werden, da `file()` in build.gradle
relativ zu `android/app/` auflöst, der Gradle-Befehl aber aus `android/` läuft.

### Schritt 3: Signierten AAB bauen
```bash
cd android && ./gradlew bundleRelease --no-daemon --console=plain \
  -PMYAPP_UPLOAD_STORE_FILE=<absoluter Pfad>/@devsven__Energy_Price_Germany.jks \
  -PMYAPP_UPLOAD_STORE_PASSWORD=<keystorePassword aus credentials.json> \
  -PMYAPP_UPLOAD_KEY_ALIAS=<keyAlias aus credentials.json> \
  -PMYAPP_UPLOAD_KEY_PASSWORD=<keyPassword aus credentials.json>
```

**Wichtig:** Lies die Werte aus `credentials.json` → `android.keystore.*` und setze sie ein.
Für den Pfad: `$(pwd)` im Projekt-Root verwenden oder absoluten Pfad hartcoden.

### Schritt 3: Ergebnis prüfen
Das fertige AAB liegt unter:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Zeige Dateigröße und Zeitstempel zur Bestätigung.

## Ausgabe
- Teile dem User mit, wo die AAB-Datei liegt
- Zeige Versionsnummer (aus `app.json`) und versionCode
- Weise darauf hin, dass die AAB manuell in die Google Play Console hochgeladen werden muss:
  https://play.google.com/console → Production → Create new release

## Fehlerbehandlung
- Falls `credentials.json` fehlt: Abbrechen und Hinweis geben
- Falls Keystore-Datei fehlt: Abbrechen und Hinweis geben
- Falls Java-Version falsch: Hinweis auf `brew install openjdk@17`
- Falls Gradle-Build fehlschlägt: Fehlermeldung ausgeben, `android/` Verzeichnis ist generiert (kein Git)
