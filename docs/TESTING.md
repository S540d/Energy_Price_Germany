# Testing Energy Price Germany

Guide für die Arbeit mit den Testing, Staging und Production Umgebungen.

---

## 📋 Übersicht der Umgebungen

| Umgebung | Branch | URL | EXPO_ENV | Zielgruppe | APIs | Deploy |
|----------|--------|-----|----------|-----------|------|--------|
| **Production** | `main` | https://s540d.github.io/Energy_Price_Germany/ | production | End User | Production | Auto |
| **Staging** | `staging` | https://s540d.github.io/Energy_Price_Germany/staging/ | staging | QA / Beta Tester | Production* | Auto |
| **Testing** | `testing` | https://s540d.github.io/Energy_Price_Germany/testing/ | testing | Developer | Staging* | Auto |

*Kann je nach Konfiguration unterschiedlich sein (siehe .env Dateien)

---

## 🏗️ Lokale Entwicklung

### Environment-Variablen laden

Die App nutzt `.env.*` Dateien für Environment-spezifische Konfiguration:

```bash
# .env.production - Production Konfiguration
EXPO_ENV=production
EXPO_PUBLIC_BASE_URL=/Energy_Price_Germany
EXPO_PUBLIC_API_BASE=https://api.example.com

# .env.staging - Staging Konfiguration
EXPO_ENV=staging
EXPO_PUBLIC_BASE_URL=/Energy_Price_Germany/staging
EXPO_PUBLIC_API_BASE=https://staging-api.example.com

# .env.testing - Testing Konfiguration
EXPO_ENV=testing
EXPO_PUBLIC_BASE_URL=/Energy_Price_Germany/testing
EXPO_PUBLIC_API_BASE=https://staging-api.example.com
```

### Development Server starten

```bash
# Development gegen Testing Umgebung
EXPO_ENV=testing npm run dev

# Development gegen Staging Umgebung
EXPO_ENV=staging npm run dev

# Development gegen Production Umgebung
EXPO_ENV=production npm run dev
```

### Build lokal testen

```bash
# Build für Testing
EXPO_ENV=testing npm run build:testing

# Build für Staging
EXPO_ENV=staging npm run build:staging

# Build für Production
EXPO_ENV=production npm run build:production

# Nach dem Build: Dateien sind in dist/ Verzeichnis
ls -la dist/
```

---

## 🔄 Branching & Deployment Workflow

### Branch-Strategie

```
feature branch (lokale Entwicklung)
    ↓ Feature fertig & getestet
testing branch (Integration & Testing)
    ↓ Testing erfolgreich & QA-ready
staging branch (QA & Beta Testing)
    ↓ QA approved & ready für Production
main branch (Production Release)
    ↓ Automatisch deployed zu GitHub Pages
Live für alle User
```

### Workflow Schritt-für-Schritt

#### 1️⃣ **Feature Development**
```bash
# Erstelle Feature Branch von testing
git checkout testing
git pull origin testing
git checkout -b feature/some-feature

# Lokale Entwicklung & Tests
EXPO_ENV=testing npm run dev
npm run test

# Commit und Push
git add .
git commit -m "feat: Some feature"
git push -u origin feature/some-feature
```

#### 2️⃣ **Integration Testing (testing Branch)**
```bash
# Erstelle PR: feature/some-feature → testing
# GitHub Actions läuft automatisch
# Deploy zu: https://s540d.github.io/Energy_Price_Germany/testing/

# Prüfe Testing Deployment:
# - Öffne https://s540d.github.io/Energy_Price_Germany/testing/
# - Teste Funktionalität
# - Schaue GitHub Actions Logs
# - Prüfe Browser Console auf Errors
```

#### 3️⃣ **QA Testing (staging Branch)**
```bash
# Nach Testing approval: Merge feature → testing
# Erstelle PR: testing → staging
# GitHub Actions deployt zu: https://s540d.github.io/Energy_Price_Germany/staging/

# QA Team testet:
# - Alle Features funktionieren korrekt
# - Performance ist gut
# - Keine Console Errors
# - Mobile Design funktioniert
# - Dark/Light Mode funktioniert
```

#### 4️⃣ **Production Release (main Branch)**
```bash
# Nach QA approval: Merge staging → main
# GitHub Actions deployt automatisch zu Production
# URL: https://s540d.github.io/Energy_Price_Germany/

# Release ist live für alle User!
```

---

## 🤖 GitHub Actions Deployment

### Unified Deploy Workflow

Der neue `deploy-unified.yml` Workflow:

**Trigger:**
- Automatisch bei Push zu main, staging oder testing
- Manuell via `workflow_dispatch`
- Scheduled: Alle 6 Stunden für main branch

**Prozess:**
1. Branch Detection (main/staging/testing)
2. Environment bestimmen (EXPO_ENV)
3. Dependencies installieren (npm ci)
4. Build erstellen (npm run build:*)
5. Deploy zu GitHub Pages (gh-pages branch)
6. Folder Management:
   - Production: Andere Environments bewahren
   - Staging/Testing: Nur eigene Folder updaten

**Logs checken:**
1. Gehe zu https://github.com/S540d/Energy_Price_Germany/actions
2. Suche nach letztem Deploy Workflow
3. Klicke auf Job für Details
4. Prüfe "Build" Step auf Errors
5. Prüfe "Deploy to GitHub Pages" Step auf Status

---

## 🧪 Testing Checklisten

### Feature Testing (Testing Branch)

- [ ] Feature lokal im Dev Server funktioniert
- [ ] Feature im Testing Build funktioniert (npm run build:testing)
- [ ] Keine Console Errors im Browser
- [ ] Responsives Design (Desktop, Tablet, Mobile)
- [ ] Dark Mode funktioniert
- [ ] Light Mode funktioniert
- [ ] Service Worker funktioniert (Offline Mode)
- [ ] Keine Performance-Regression

### QA Testing (Staging Branch)

- [ ] Feature funktioniert auf Staging URL
- [ ] URLs sind korrekt (alle Links zeigen auf /staging/)
- [ ] keine Hardcoded Production URLs
- [ ] API Calls gehen an richtige Staging APIs
- [ ] Cache wird korrekt aktualisiert
- [ ] Service Worker zeigt richtige Version
- [ ] PWA funktioniert (App installieren)
- [ ] Data Export funktioniert

### Production Testing (Main Branch)

- [ ] Feature funktioniert auf Production URL
- [ ] URLs sind korrekt (keine /staging/ oder /testing/ links)
- [ ] API Calls gehen an Production APIs
- [ ] Performance ist gut
- [ ] Keine Console Errors
- [ ] Mobile funktioniert
- [ ] PWA funktioniert
- [ ] Alle Deployments erfolgreich

---

## 🔍 Troubleshooting

### GitHub Actions Deployment fehlgeschlagen

**Problem:** Workflow Status ist RED ❌

**Lösung:**
1. Gehe zu Actions Tab
2. Klicke auf fehlgeschlagenen Workflow
3. Schaue "Build" Step:
   - npm install Fehler? → npm ci neu versuchen
   - Build Fehler? → Logs prüfen, lokal bauen
4. Schaue "Deploy to GitHub Pages" Step:
   - Git Push Fehler? → Branch Protection checken
   - Permissions? → GitHub Token Secrets prüfen

### URLs sind falsch nach Deploy

**Problem:** Seite funktioniert aber Links sind kaputt

**Lösung:**
1. Prüfe `.env.*` Dateien: EXPO_PUBLIC_BASE_URL korrekt?
2. Prüfe `app.config.js`: baseUrl wird richtig gesetzt?
3. Prüfe `dist/index.html`: Schaue <base> Tag oder URLs
4. Lösche Browser Cache:
   - DevTools → Application → Clear Storage
   - Oder: Ctrl+Shift+Delete (Hard Refresh)

### Alte Cache wird angezeigt

**Problem:** Service Worker cached alte Version

**Lösung:**
1. Service Worker deregistrieren:
   - DevTools → Application → Service Workers
   - "Unregister" Button
2. Hard Refresh: Ctrl+Shift+Delete
3. Oder: Private/Incognito Window öffnen

### fetch.yml lädt alte Daten

**Problem:** marketdata.json wird nicht aktualisiert

**Lösung:**
1. Prüfe fetch.yml logs in Actions
2. Stelle sicher fetch.yml nutzt KEINE EXPO_ENV Variable
3. fetch.yml sollte IMMER gegen Production APIs laufen
4. Manueller Trigger: Actions → fetch.yml → "Run workflow"

---

## 📊 Environment-Validierung

### Validiere dass EXPO_ENV richtig gesetzt ist

```bash
# Checke .env Datei
cat .env.testing
# Output sollte:
# EXPO_ENV=testing

# Prüfe app.config.js
head -20 app.config.js
# Sollte .env Datei laden und EXPO_ENV lesen

# Prüfe Build Output
npm run build:testing
ls -la dist/
# dist/ Ordner sollte korrekte baseUrl enthalten
```

### Validiere URLs in dist/index.html

```bash
# Nach jedem Build prüfen:
grep -i "base\|href" dist/index.html

# Für Testing sollte sein:
# href="/Energy_Price_Germany/testing/

# Für Staging sollte sein:
# href="/Energy_Price_Germany/staging/

# Für Production sollte sein:
# href="/Energy_Price_Germany/
```

### Validiere Service Worker

```bash
# Service Worker Datei sollte existieren
ls -la dist/service-worker.js

# Cache Name sollte umgebungs-spezifisch sein
grep "cache-testing\|cache-staging\|cache-prod" dist/service-worker.js
```

---

## 📝 Dokumentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System-Architektur & Diagramme
- [DATA-MERGE-STRATEGY.md](DATA-MERGE-STRATEGY.md) - Wie Daten geladen & merged werden
- [BUILD.md](BUILD.md) - Build-Prozess & Optionen
- [ANDROID_STORE_CHECKLIST.md](ANDROID_STORE_CHECKLIST.md) - Android Release Checkliste

---

## 🚀 Wichtige Hinweise

### fetch.yml läuft unabhängig

- fetch.yml lädt täglich neue Daten gegen Production APIs
- EXPO_ENV beeinflusst fetch.yml NICHT
- fetch.yml sollte IMMER gegen Production APIs laufen
- Funktioniert unabhängig welcher Branch deployt wird

### Keine sed-Injektionen mehr

- Alte Workflows haben sed benutzt um Pfade zur Deploy-Zeit zu ändern
- Neuer Workflow nutzt EXPO_ENV aus .env Dateien
- Viel sauberer & wartbarer!

### Smart Folder Management

- Production Deploy: Bewahrt staging/ und testing/ Folders
- Staging Deploy: Updated nur staging/ Folder
- Testing Deploy: Updated nur testing/ Folder
- Keine Konflikte mehr zwischen Environments!

---

## 📱 Mobile App Deployment (EAS Build)

### EAS Channels Setup

Das Projekt nutzt **EAS (Expo Application Services)** für Mobile App Builds mit drei separaten Channels:

| Channel | Branch | Platform | Distribution | EXPO_ENV | Zielgruppe |
|---------|--------|----------|--------------|----------|-----------|
| **testing** | testing | Android/iOS | Internal | testing | Developer |
| **staging** | staging | Android/iOS | Internal | staging | QA/Beta Tester |
| **production** | main | Android/iOS | Store | production | End User |

### Build Commands

```bash
# Testing Builds (Internal Distribution)
npm run eas:build:testing              # Android + iOS
npm run eas:build:android:testing      # Nur Android
npm run eas:build:ios:testing          # Nur iOS

# Staging Builds (Internal Distribution)
npm run eas:build:staging              # Android + iOS
npm run eas:build:android:staging      # Nur Android
npm run eas:build:ios:staging          # Nur iOS

# Production Builds (Store Distribution)
npm run eas:build:production           # Android + iOS
npm run eas:build:android:production   # Nur Android (AAB für Play Store)
npm run eas:build:ios:production       # Nur iOS (App Store)
```

### EAS Build Workflow

```
1. Code Development auf Feature Branch
   ↓
2. Merge zu testing Branch
   ↓
3. EAS Build Testing
   npm run eas:build:testing
   ↓
4. Internal Testing auf echten Geräten
   ↓ (Approved)
5. Merge zu staging Branch
   ↓
6. EAS Build Staging
   npm run eas:build:staging
   ↓
7. QA Testing auf echten Geräten
   ↓ (Approved)
8. Merge zu main Branch
   ↓
9. EAS Build Production
   npm run eas:build:production
   ↓
10. Submit zu App Stores
```

### Build Profiles (eas.json)

Alle drei Build-Profile nutzen die gleichen `.env.*` Dateien wie Web-Deployments:

**Testing Profile:**
- Distribution: Internal
- Channel: testing
- EXPO_ENV: testing
- Android: APK (schnellere Builds)
- iOS: Real Device Build

**Staging Profile:**
- Distribution: Internal
- Channel: staging
- EXPO_ENV: staging
- Android: APK
- iOS: Real Device Build

**Production Profile:**
- Distribution: Store
- Channel: production
- EXPO_ENV: production
- Android: AAB (Google Play Store)
- iOS: App Store Build

### Erste Schritte mit EAS

1. **EAS CLI installieren** (falls noch nicht vorhanden):
```bash
npm install -g eas-cli
```

2. **Bei Expo anmelden**:
```bash
eas login
```

3. **Projekt konfigurieren**:
```bash
eas build:configure
```

4. **Ersten Build starten**:
```bash
npm run eas:build:testing
```

5. **Build Status prüfen**:
```bash
eas build:list
```

### Wichtige Hinweise zu EAS

- **Credentials**: Android Keystore wird via `credentials.json` lokal verwaltet
- **iOS**: Benötigt Apple Developer Account für iOS Builds
- **Build Time**: Erste Builds dauern 10-15 Minuten, danach schneller durch Caching
- **Internal Distribution**: Testing & Staging Builds können via Link geteilt werden
- **Store Submission**: Production Builds werden manuell zu Stores submitted

### Links & Ressourcen

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Channels](https://docs.expo.dev/eas-update/channels/)
- [Managing Credentials](https://docs.expo.dev/app-signing/managed-credentials/)

---

**Last Updated:** 2026-01-10
**Version:** 1.1
**Status:** Complete for Phase 2 & 3 + EAS Setup
