# Dependency Update & Security Audit (npm/yarn/pnpm)

Sichere Aktualisierung von Dependencies mit Security-Checks.
Paketmanager: npm (Standard), yarn oder pnpm – Befehle ggf. anpassen.

## Ziel
Dependencies aktualisieren, Security-Vulnerabilities fixen, Breaking Changes prüfen

## Workflow

### 1. Aktuellen Status analysieren
- Zeige `npm outdated` Output
- Gruppiere Updates nach Typ:
  - **Patch Updates** (1.2.3 → 1.2.4) - Bugfixes, sicher
  - **Minor Updates** (1.2.0 → 1.3.0) - Neue Features, meist kompatibel
  - **Major Updates** (1.0.0 → 2.0.0) - Breaking Changes, Vorsicht!
- Zeige Security Audit: `npm audit`
- Priorisiere Security-relevante Updates

### 2. Security Vulnerabilities fixen (PRIORITÄT!)
- Zeige alle Vulnerabilities mit Severity (Critical, High, Medium, Low)
- Für jede Vulnerability:
  - Zeige betroffenes Package
  - Zeige empfohlene Fix-Version
  - Automatisch fixen falls möglich: `npm audit fix`
  - Falls Breaking Change: Manuell fixen mit `npm install package@version`

### 3. Patch & Minor Updates (meist sicher)
- Frage: "Alle Patch/Minor Updates installieren? (empfohlen)"
- Falls Ja:
  ```bash
  npm update  # Installiert alle Updates innerhalb semver range
  ```
- Falls Nein: Gehe durch einzelne Packages und frage jeweils

### 4. Major Updates (Breaking Changes möglich)
- Für jedes Major Update:
  - Zeige Package-Name, alte Version, neue Version
  - Suche nach CHANGELOG oder Breaking Changes:
    - Check npm page: `npm show <package> homepage` oder Suche auf npmjs.com
    - Check GitHub Releases des jeweiligen Repos (URL aus `npm show <package> repository.url`)
  - Zeige Breaking Changes falls gefunden
  - Frage: "Update installieren?"
  - Falls Ja: `npm install package@latest`

### 5. Dependencies Test-Run
Nach jedem Update-Batch:
- Führe `npm install` aus (um lock-file zu aktualisieren)
- Führe Tests aus: `npm run test`
- Führe Linting aus: `npm run lint`
- Führe Type-Check aus: `npm run type-check` (falls TypeScript)
- Führe Build aus: `npm run build`
- Falls Fehler:
  - Zeige Fehler
  - Versuche zu fixen
  - Falls nicht möglich: Rollback zu vorheriger Version

### 6. Update-spezifische Fixes

#### TypeScript Major Update
- Prüfe `tsconfig.json` für deprecated Options
- Aktualisiere `@types/*` Packages
- Prüfe auf neue strict Checks

#### React/React Native Major Update
- Prüfe auf deprecated APIs
- Aktualisiere React-Plugins (babel, etc.)
- Teste App vollständig

#### Expo Major Update
- Folge Expo Upgrade Guide: `npx expo upgrade`
- Prüfe `app.json` für neue Config-Optionen
- Teste auf realen Devices

#### Build Tools (Webpack, Vite, etc.)
- Prüfe Config-Files für Breaking Changes
- Teste Build-Output
- Prüfe Bundle-Size

### 7. Lock-File aktualisieren
- Stelle sicher dass `package-lock.json` committed wird
- Prüfe auf ungewollte Dependency-Änderungen:
  ```bash
  git diff package-lock.json
  ```
- Falls zu viele Änderungen: Nutze `npm ci` statt `npm install` für sauberen State

### 8. Dokumentation
- Aktualisiere CHANGELOG.md:
  ```markdown
  ## [Version] - YYYY-MM-DD
  ### Dependencies
  - Updated [package] from X.Y.Z to A.B.C
  - Fixed security vulnerability in [package]
  ```
- Falls Major Updates: Dokumentiere Breaking Changes
- Aktualisiere README falls Versions-Anforderungen ändern (z.B. Node.js Version)

### 9. Commit & PR erstellen
- Erstelle Feature-Branch: `git checkout -b chore/dependency-update-[YYYY-MM-DD]`
- Commit Änderungen:
  ```bash
  git add package.json package-lock.json CHANGELOG.md
  git commit -m "chore: Update dependencies and fix security vulnerabilities"
  ```
- Erstelle PR:
  ```bash
  gh pr create --base testing --title "chore: Dependency Update [Date]" --body "$(cat <<EOF
  ## Dependency Updates

  ### Security Fixes
  - [Package]: [Old] → [New] (Fixes CVE-XXXX)

  ### Major Updates
  - [Package]: [Old] → [New]
    - Breaking Changes: [Liste]

  ### Minor/Patch Updates
  - [Package]: [Old] → [New]

  ## Testing
  - [x] Tests passing
  - [x] Build successful
  - [x] Type-check passing
  - [x] Linting passing

  ## Impact
  [Beschreibung der Auswirkungen]
  EOF
  )"
  ```

### 10. Post-Update Monitoring
- Teste App gründlich (manuell und automatisiert)
- Achte auf Performance-Regression
- Monitore Error-Logs nach Deployment
- Falls Probleme: Schnelles Rollback vorbereiten

## Sicherheitschecks

**KRITISCH - Besondere Vorsicht bei:**
- ❌ Major Updates von Core-Dependencies (React, TypeScript, etc.)
- ❌ Updates die `node_modules` Struktur stark ändern
- ❌ Dependencies mit vielen Downstream-Dependencies
- ❌ Critical Security Fixes die Breaking Changes enthalten

**Immer testen:**
- ✅ Vollständiger Test-Suite Durchlauf
- ✅ Build erfolgreich
- ✅ App startet und funktioniert
- ✅ Keine neuen Console-Errors

## Rollback-Strategie

Falls nach Update Probleme auftreten:
```bash
# Rollback zu vorheriger Version
git checkout HEAD~1 package.json package-lock.json
npm ci  # Installiert exakt die Versionen aus lock-file
npm run test && npm run build

# Falls erfolgreich
git add package.json package-lock.json
git commit -m "revert: Rollback dependency update due to [reason]"
```

## Automatisierung (Optional)

### Dependabot Configuration
Erstelle `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "your-username"
    labels:
      - "dependencies"
      - "automated"
    # Gruppiere Minor/Patch Updates
    groups:
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
```

### Renovate (Alternative zu Dependabot)
- Mehr Konfigurationsmöglichkeiten
- Automatische Merge für Patch-Updates möglich
- Bessere Gruppierung von Updates

## Best Practices

✅ **Do:**
- Regelmäßig updaten (mindestens monatlich)
- Security-Updates sofort anwenden
- CHANGELOG dokumentieren
- Gründlich testen nach Updates
- Lock-Files committen

❌ **Don't:**
- Nicht alle Updates blind installieren
- Nicht ohne Tests updaten
- Nicht Major Updates kurz vor Release
- Nicht mehrere Major Updates gleichzeitig
- Nicht Lock-Files ignorieren

## Checkliste

- [ ] `npm outdated` analysiert
- [ ] `npm audit` geprüft
- [ ] Security Vulnerabilities gefixt
- [ ] Patch/Minor Updates installiert
- [ ] Major Updates einzeln geprüft
- [ ] Tests laufen durch
- [ ] Build erfolgreich
- [ ] Type-Check (falls TS) bestanden
- [ ] CHANGELOG aktualisiert
- [ ] PR erstellt und reviewed
- [ ] App getestet (dev environment)
- [ ] Keine neuen Errors/Warnings
