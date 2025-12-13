# Pull Request

## Beschreibung

<!-- Kurze Beschreibung der Änderungen -->

## Art der Änderung

- [ ] Bugfix (non-breaking change)
- [ ] Neue Funktion (non-breaking change)
- [ ] Breaking Change (Fix oder Feature das bestehende Funktionalität ändert)
- [ ] Dokumentation Update

## Cross-Platform Kompatibilität

**Betrifft dieser PR plattformspezifischen Code?** Ja / Nein

Falls Ja, prüfe folgende Punkte:

### Web APIs
- [ ] Alle `window.*` Aufrufe haben `Platform.OS === 'web'` Check oder nutzen `utils/platform.ts`
- [ ] Keine direkte Verwendung von `document`, `navigator`, `localStorage` ohne Platform-Check
- [ ] `window.matchMedia` wird nur auf Web verwendet
- [ ] DOM Manipulationen sind Web-only

### Storage
- [ ] `AsyncStorage` für Mobile (iOS/Android)
- [ ] `localStorage` nur für Web mit Platform-Check
- [ ] Alternative: `Storage` Adapter aus `utils/platform.ts`

### Testing
- [ ] Code wurde auf **Web** getestet (Browser)
- [ ] Code wurde auf **Android** getestet (Emulator oder physisches Gerät)
- [ ] Code wurde auf **iOS** getestet (falls verfügbar)
- [ ] Keine console errors/warnings in Production

### Platform-Specific Features
- [ ] React Native Komponenten funktionieren auf Mobile
- [ ] Web-only Komponenten sind hinter Platform-Check
- [ ] Polyfills für fehlende APIs auf Mobile vorhanden

## Testing Checklist

- [ ] Lokaler Build erfolgreich (`npm run build:web` oder `./gradlew bundleRelease`)
- [ ] Keine TypeScript Errors
- [ ] Keine ESLint Warnings
- [ ] App startet ohne Crashes
- [ ] Geänderte Features funktionieren wie erwartet

## Screenshots / Videos

<!-- Falls UI-Änderungen: Screenshots oder Videos einfügen -->

**Web:**


**Mobile:**


## Zusätzliche Notizen

<!-- Weitere Informationen, Kontext, oder Begründung für Implementierungsdetails -->

## Reviewer Checklist

**Für den Reviewer:**

- [ ] Code folgt den Projekt-Konventionen
- [ ] Keine Web APIs ohne Platform-Check
- [ ] Keine Hard-coded Values (Config/Env Vars verwenden)
- [ ] Error Handling vorhanden
- [ ] Keine sensiblen Daten im Code
- [ ] Commit Messages sind aussagekräftig
