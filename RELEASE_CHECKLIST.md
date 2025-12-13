# Release Checklist

Diese Checklist muss vor jedem Release durchlaufen werden.

## Pre-Release Testing

### Web Platform
- [ ] Build erfolgreich: `npm run build:web`
- [ ] App startet ohne Fehler
- [ ] Alle Features funktionieren im Browser
- [ ] Getestet in Chrome
- [ ] Getestet in Safari (falls verfügbar)
- [ ] Mobile Browser Simulation (Chrome DevTools)
- [ ] Dark Mode funktioniert
- [ ] Settings werden korrekt gespeichert

### Android Platform
- [ ] Build erfolgreich: `./gradlew bundleRelease`
- [ ] APK installiert auf physischem Gerät
- [ ] App startet ohne Crash
- [ ] Alle Features funktionieren
- [ ] Dark Mode funktioniert
- [ ] Settings werden korrekt gespeichert
- [ ] Keine Permissions Errors
- [ ] Deep Links funktionieren (falls vorhanden)

### iOS Platform (falls relevant)
- [ ] Build erfolgreich
- [ ] App auf Simulator getestet
- [ ] App auf physischem Gerät getestet
- [ ] Alle Features funktionieren

## Code Quality

### Cross-Platform Checks
- [ ] Alle Web APIs haben `Platform.OS === 'web'` Check
- [ ] `AsyncStorage` verwendet für Mobile Storage
- [ ] `localStorage` nur für Web mit Platform-Check
- [ ] Keine `window.*` Calls ohne Platform-Check
- [ ] Keine `document.*` Calls ohne Platform-Check

### Code Review
- [ ] Keine console.log in Production Code
- [ ] Keine TODO/FIXME Kommentare ohne Issue
- [ ] Keine hardcoded Credentials oder API Keys
- [ ] Error Handling vorhanden
- [ ] TypeScript Errors: 0
- [ ] ESLint Warnings: 0

## Version & Metadata

### Version Numbers
- [ ] `package.json` version aktualisiert
- [ ] `app.json` version aktualisiert
- [ ] `app.json` android.versionCode erhöht
- [ ] `Android/app/build.gradle.kts` versionCode erhöht
- [ ] `Android/app/build.gradle.kts` versionName aktualisiert
- [ ] `App.tsx` APP_VERSION Konstante aktualisiert

### Git
- [ ] Alle Änderungen committed
- [ ] Commit Messages sind aussagekräftig
- [ ] Branch ist up-to-date mit main
- [ ] Keine merge conflicts

## Documentation

- [ ] CHANGELOG.md aktualisiert
- [ ] Release Notes geschrieben
- [ ] README aktualisiert (falls nötig)
- [ ] Breaking Changes dokumentiert
- [ ] Migration Guide (falls Breaking Changes)

## Build Artifacts

### Android
- [ ] Signiertes AAB generiert
- [ ] AAB nach `Android/release/` kopiert
- [ ] Dateiname: `1x1-trainer-v{VERSION}-signed.aab`
- [ ] Dateigröße überprüft (sollte ~5MB sein)

### Web
- [ ] Build in `dist/` Verzeichnis
- [ ] Assets korrekt kopiert
- [ ] Deployment vorbereitet

## Deployment

### Git
- [ ] Git Tag erstellt: `git tag v{VERSION}`
- [ ] Tag gepusht: `git push origin v{VERSION}`
- [ ] Commits gepusht: `git push origin main`

### Play Store (Android)
- [ ] AAB auf Play Store Console hochgeladen
- [ ] Release Notes (EN) ausgefüllt
- [ ] Release Notes (DE) ausgefüllt
- [ ] Screenshots aktuell
- [ ] Store Listing überprüft
- [ ] Release an Internal Testing Track

### Web (GitHub Pages)
- [ ] `npm run deploy` ausgeführt
- [ ] Website erreichbar unter `https://s540d.github.io/1x1_Trainer/`
- [ ] Alle Features funktionieren online

## Post-Release

### Monitoring
- [ ] App startet ohne Crashes (erste 24h beobachten)
- [ ] Keine kritischen Fehler in Logs
- [ ] User Feedback monitoren

### Communication
- [ ] Release Notes veröffentlicht
- [ ] GitHub Release erstellt
- [ ] README Badge aktualisiert (falls vorhanden)

## Rollback Plan

Falls kritische Probleme auftreten:

1. **Play Store:** Previous version wiederherstellen
2. **Web:** Previous version deployen: `git revert` + `npm run deploy`
3. **Hotfix:** Neuen Branch erstellen, fixen, express release

---

**Release Version:** v______
**Release Datum:** __________
**Erstellt von:** __________
**Überprüft von:** __________

**Unterschrift:** ____________
