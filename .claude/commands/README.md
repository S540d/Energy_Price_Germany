# Claude Code Commands - Standard Templates

Wiederverwendbare Command-Templates für alle Projekte.

## Standard Commands (Empfohlen für jedes Projekt)

### 1. **aufräumen** - Tagesabschluss Workflow
Automatisierter Cleanup am Ende des Arbeitstags.

**Wann nutzen:** Täglich am Abend, nach größeren Feature-Sprints

**Was es tut:**
- Repository-Status prüfen
- Merged Branches löschen
- GitHub Actions Status zeigen
- Offene PRs/Issues listen
- Dependencies & Security prüfen
- Zusammenfassung erstellen

**Aufruf:** `/aufräumen` oder `claude aufräumen`

---

### 2. **pr-review** - Pull Request Review & Merge
Intelligenter PR-Review mit automatischer Suggestion-Umsetzung.

**Wann nutzen:** Vor dem Mergen eines PRs

**Was es tut:**
- PR-Status prüfen (CI/CD, Reviews, Conflicts)
- Code-Review durchführen (häufige Probleme erkennen)
- Review-Suggestions umsetzen
- Tests & Validierung
- CHANGELOG prüfen/aktualisieren
- Merge vorbereiten und durchführen (mit Bestätigung)

**Aufruf:** `/pr-review` oder `claude pr-review [PR-Nummer]`

**WICHTIG:** Stellt sicher, dass PR-Target-Branch aktuell ist!

---

### 3. **dependency-update** - Dependency Updates mit Security-Checks
Sichere Aktualisierung von npm/yarn Dependencies.

**Wann nutzen:** Mindestens monatlich, nach Security-Alerts

**Was es tut:**
- Outdated Dependencies analysieren
- Security Vulnerabilities fixen (Priorität!)
- Updates nach Typ gruppieren (Patch/Minor/Major)
- Breaking Changes prüfen
- Tests nach jedem Update-Batch
- CHANGELOG aktualisieren
- PR erstellen

**Aufruf:** `/dependency-update` oder `claude dependency-update`

**KRITISCH:** Immer testen nach Major Updates!

---

## Weitere empfohlene Commands

### 4. **release-prepare** - Release vorbereiten

**Zweck:** Einen neuen Release vorbereiten und validieren

**Was es tut:**
- Prüfe ob `testing` mit `staging` und `main` synchron ist
- Validiere CHANGELOG.md (enthält alle Änderungen seit letztem Release?)
- Version-Bump in package.json und app.json
- Git Tag erstellen (z.B. `v1.2.0`)
- Release-Notes generieren (aus CHANGELOG)
- PR erstellen: `main` ← `testing` (Production Release)

**Workflow:**
1. Alle Features in `testing` merged
2. `/release-prepare` ausführen
3. PR reviewen und mergen
4. Deployment triggert automatisch

---

### 5. **hotfix** - Kritischen Hotfix deployen

**Zweck:** Schneller Bugfix für Production ohne vollständigen Release-Prozess

**Was es tut:**
- Erstelle Hotfix-Branch von `main`: `hotfix/critical-bug-fix`
- Wende Fix an
- Tests & Validierung
- Version-Bump (Patch-Version, z.B. 1.2.0 → 1.2.1)
- CHANGELOG aktualisieren
- PR erstellen: `main` ← `hotfix/...` UND `testing` ← `hotfix/...`
- Nach Merge: Tag erstellen und deployen

**KRITISCH:** Hotfix muss auch zurück in `testing` gemergt werden!

**Workflow:**
```bash
# /hotfix ausführen
- Hotfix-Branch erstellen
- Fix implementieren
- Dual-PR erstellen (main + testing)
- Fast-track Review
- Deploy
```

---

### 6. **i18n-check** - Übersetzungen prüfen

**Zweck:** Fehlende oder inkonsistente Übersetzungen finden

**Was es tut:**
- Vergleiche Übersetzungsdateien (en.json, de.json, etc.)
- Finde fehlende Keys
- Finde ungenutzte Keys (im Code nicht referenziert)
- Finde hartcodierte Strings im Code (häufiges Problem!)
- Generiere Bericht mit Missing/Extra/Unused Keys

**Aufruf:** `/i18n-check`

**Output:**
```
🔍 Translation Check Report

❌ Missing Translations (de.json):
- settings.newFeature
- buttons.exportData

⚠️ Unused Keys:
- deprecated.oldButton (in en.json + de.json)

🚨 Hardcoded Strings Found:
- App.tsx:142 → "Settings" (should use t.settings)
- Component.tsx:87 → "Click here" (should use t.clickHere)

✅ 45/48 keys translated (93%)
```

---

### 7. **test-coverage** - Test-Coverage analysieren & verbessern

**Zweck:** Ungetestete Code-Bereiche identifizieren

**Was es tut:**
- Führe `npm run test:coverage` aus
- Analysiere Coverage-Report
- Identifiziere kritische Files mit <80% Coverage
- Priorisiere nach Wichtigkeit:
  1. Business Logic / Utils
  2. API-Handler / Data Fetchers
  3. Components (UI)
- Schlage Tests vor für ungetestete Funktionen

**Aufruf:** `/test-coverage`

**Output:**
```
📊 Test Coverage Report

⚠️ Low Coverage (<80%):
- utils/dataFetcher.ts → 62% (CRITICAL - Business Logic!)
  Missing tests for:
  - fetchBackupData()
  - validateApiResponse()

- services/regionalData.ts → 71%
  Missing tests for:
  - parsePostalCode()

✅ High Coverage (>90%):
- utils/theme.ts → 95%
- components/ChartComponent.tsx → 92%

Overall: 78% coverage (Target: 80%)
Next Steps: Add tests for critical utils first
```

---

### 8. **lighthouse-audit** - Performance & Accessibility Audit

**Zweck:** Lighthouse-Audit durchführen und Optimierungen vorschlagen

**Was es tut:**
- Führe Lighthouse Audit aus (Performance, A11y, Best Practices, SEO)
- Zeige Scores und kritische Probleme
- Priorisiere Fixes nach Impact
- Schlage konkrete Verbesserungen vor

**Aufruf:** `/lighthouse-audit`

**Output:**
```
🚦 Lighthouse Audit Results

Performance: 72/100 ⚠️
- Largest Contentful Paint: 3.2s (Target: <2.5s)
  → Optimize images (use WebP, lazy loading)
- Total Blocking Time: 450ms (Target: <200ms)
  → Reduce JavaScript bundle size

Accessibility: 95/100 ✅
- Missing alt text on 2 images
  → Add descriptive alt attributes

Best Practices: 88/100 ⚠️
- Uses deprecated APIs
  → Update to modern APIs

SEO: 100/100 ✅

Next Steps:
1. Optimize bundle size (code splitting)
2. Implement image lazy loading
3. Add missing alt texts
```

---

### 9. **db-backup** - Database Backup erstellen (für Backend-Projekte)

**Zweck:** Regelmäßige Datenbank-Backups

**Was es tut:**
- Erstelle Backup der Datenbank (PostgreSQL, MongoDB, etc.)
- Komprimiere Backup (gzip)
- Upload zu Cloud-Storage (S3, Google Cloud Storage)
- Verifiziere Backup-Integrität
- Cleanup alte Backups (>30 Tage)
- Sende Bestätigungs-Notification

**Aufruf:** `/db-backup`

---

### 10. **env-check** - Environment-Konfiguration validieren

**Zweck:** Prüfe ob alle erforderlichen Environment-Variables gesetzt sind

**Was es tut:**
- Lese `.env.example`
- Prüfe ob alle Keys in `.env.production`, `.env.staging`, `.env.testing` vorhanden
- Warne bei fehlenden Variablen
- Prüfe auf häufige Fehler (z.B. exposed Secrets in Git)

**Aufruf:** `/env-check`

**Output:**
```
🔍 Environment Configuration Check

✅ .env.production - OK
✅ .env.staging - OK
⚠️ .env.testing - Missing:
  - DATABASE_URL
  - API_KEY

🚨 Security Issues:
- .env file is tracked in Git! (add to .gitignore)

Recommendation:
1. Add missing variables to .env.testing
2. Add .env to .gitignore
3. Use GitHub Secrets for CI/CD
```

---

## Command-Erstellung

### Neue Commands hinzufügen

1. **Erstelle Markdown-Datei:**
   ```
   .claude/commands/mein-command.md
   ```

2. **Struktur:**
   ```markdown
   # Command-Titel

   Beschreibung was der Command macht

   ## Workflow

   ### Schritt 1
   - Was passiert
   - Erwartetes Resultat

   ### Schritt 2
   - ...

   ## Fehlerbehandlung
   - Wie mit Fehlern umgehen

   ## Best Practices
   - Tipps
   ```

3. **Command registrieren:**
   - Nutze Command via `/command-name` oder `claude command-name`

### Best Practices für Commands

✅ **Do:**
- Klare Schritt-für-Schritt Anweisungen
- Fehlerbehandlung dokumentieren
- Sicherheitschecks einbauen (z.B. "Frage vor destructive actions")
- Nützliche Output-Beispiele zeigen

❌ **Don't:**
- Zu generische Beschreibungen
- Fehlende Fehlerbehandlung
- Keine Sicherheitschecks
- Zu viele manuelle Schritte (sollte weitgehend automatisiert sein)

---

## Integration in Projekte

### Schritt 1: Commands kopieren
```bash
mkdir -p .claude/commands
cp project-templates/automation-templates/.claude/commands/*.md .claude/commands/
```

### Schritt 2: Projekt-spezifisch anpassen
- Öffne jeden Command
- Ersetze generische Platzhalter:
  - `[Project Name]` → Dein Projekt-Name
  - `npm run ...` → Deine Scripts
  - API-Namen, File-Paths, etc.

### Schritt 3: CLAUDE.md aktualisieren
```markdown
## Available Commands

- `/aufräumen` - Daily cleanup and sync
- `/pr-review [PR-Number]` - Review and merge PR
- `/dependency-update` - Update dependencies safely
- `/release-prepare` - Prepare a new release
```

---

## Wartung

### Commands aktuell halten
- Reviewe Commands nach größeren Architektur-Änderungen
- Aktualisiere wenn neue Tools/Workflows hinzukommen
- Entferne veraltete Commands
- Teile neue nützliche Commands zurück ins Template-Repo!

---

## Feedback & Verbesserungen

Hast du einen nützlichen Command entwickelt?
→ Erstelle einen PR im `project-templates` Repo!

**Template-Repo:** [GitHub Link einfügen]
