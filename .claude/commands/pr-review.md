# Pull Request Review & Merge

Automatisierter PR-Review-Workflow: Prüfen, Suggestions umsetzen, Mergen

> **[GLOBAL POLICY] – verbindlich (Issue #7):**
> - PRs immer gegen `testing`, nie direkt gegen `main`
> - **Merge auf `main` nur mit expliziter schriftlicher Freigabe** – niemals eigenständig
> - `--delete-branch` nur für Feature-Branches (nie `testing`)
> - `--no-verify` nur auf explizite Bitte
> - Vor Merge immer Copilot-Suggestions abwarten und prüfen

## Ziel
Einen Pull Request gründlich prüfen, Code-Review-Suggestions umsetzen und für Merge vorbereiten.

## Workflow

### 1. PR Status prüfen
- Zeige PR-Details (Titel, Beschreibung, Files Changed)
- Prüfe ob PR-Ziel-Branch aktuell ist mit main (Ziel-Branch prüfen)
- Falls outdated: Frage ob Target-Branch in PR-Branch gemergt werden soll
- Prüfe CI/CD Status (Tests, Linting, Build)
- Zeige offene Review-Comments

### 2. Code Review durchführen
- Zeige alle Changed Files
- Prüfe auf häufige Probleme:
  - Hardcodierte Strings (sollten i18n nutzen)
  - Console.log Statements
  - Fehlende Error Handling
  - Code-Duplikation
  - Fehlende Tests für neue Features
  - Breaking Changes ohne CHANGELOG Update
  - Versions-Inkonsistenz (package.json vs app.json)

### 3. Review-Suggestions umsetzen
- Liste alle offenen Review-Comments
- Für jeden Comment:
  - Zeige Context (File, Line, Comment)
  - Frage ob Suggestion umgesetzt werden soll
  - Setze Änderung um
  - Markiere Comment als "Resolved"

### 4. Tests & Validierung
- Führe Tests aus: `npm run test`
- Führe Linting aus: `npm run lint`
- Führe Type-Check aus: `npm run type-check` (falls TypeScript)
- Prüfe Build: `npm run build`
- Falls Fehler: Zeige Fehler und biete Fixes an

### 5. CHANGELOG & Dokumentation
- Prüfe ob CHANGELOG.md aktualisiert wurde
- Falls neue Features/Breaking Changes: Schlage CHANGELOG-Eintrag vor
- Prüfe ob README/Docs aktualisiert werden müssen

### 6. Merge-Gate (review-gate) + KI-Review

**Kostenloses Gate (automatisch, keine API-Kosten):** Der Workflow
`reusable-mergeability.yml` läuft bei jedem PR, postet einen Sticky-Kommentar
(Zielbranch, Konflikt-Status, CI-Übersicht, Checkliste) und setzt den required
Status-Check **`review-gate`**:
- **kein Merge-Konflikt → grün** → Merge möglich (sofern auch CI grün ist).
- **Merge-Konflikt → rot** → Branch aktualisieren.

**Tiefer KI-Review (primärer Weg, abo-basiert, ohne Pay-per-Token):** Führe das
Slash-Command `/review` (bzw. `/code-review --comment`) aus Claude Code aus —
lokal am PC **oder** in einer Web-Session vom Telefon. Das ist durch dein
Pro/Max-Abo gedeckt und kostet keine metered API-Token. Mit `--comment` werden die
Findings als PR-Kommentare gepostet, mit `--fix` direkt im Working-Tree umgesetzt.

**Optionaler API-Fallback (kostet metered API):** Setze das Label **`ai-review`**
am PR → `pr-review.yml` postet einen beratenden Claude-Review (Haiku). Dieser
blockiert den Merge **nicht** — er ergänzt nur das kostenlose Gate.

> ℹ️ Der KI-Review ist beratend; verbindlich für den Merge sind die kostenlosen,
> deterministischen Checks (CI grün + `review-gate` grün + keine Konflikte).

### 7. Merge vorbereiten
- Prüfe ob alle Checks grün sind (inkl. `review-gate`)
- Zeige Merge-Status (Ready to merge? Conflicts?)
- Falls Konflikte: Zeige betroffene Files

### 8. Merge durchführen (nur wenn bestätigt)
**WICHTIG:** Vor Merge nochmal bestätigen lassen!

**Standardfall `feature → testing` (KEIN `--admin`):**
- Sobald alle Checks grün sind (review-gate grün / Label `ready to merge`),
  ist **kein** `--admin` nötig — das `protect-main`-Ruleset verlangt 0 Approvals.
- Merge: `gh pr merge <nr> --squash --delete-branch`
- Ausgabe: "✅ PR #XX successfully merged and branch deleted"

**Sonderfall `testing → main` (`--admin`, nur mit Freigabe):**
- Der Default-Branch `main` liegt unter einem zusätzlichen Ruleset (`Main`), das
  **1 Approval** verlangt. Als Solo-Dev kann man den eigenen PR nicht approven →
  dieser eine Block ist nur per Admin-Bypass lösbar. Das ist der **bewusste
  manuelle Release-Schritt**, NICHT mit dem `review-gate` zu verwechseln.
- Merge: `gh pr merge <nr> --squash --admin` (kein `--delete-branch` für langlebige Branches!)
- **Nur mit expliziter schriftlicher Freigabe** (siehe GLOBAL POLICY oben).

### 9. Post-Merge Cleanup
- Checkout zurück zu main/testing
- Pull neueste Änderungen
- Zeige nächste offene PRs (falls vorhanden)

## Fehlerbehandlung

### CI/CD Fails
- Zeige Fehler-Log
- Biete Fixes für häufige Probleme:
  - Test Failures → Zeige failed Tests, biete Fixes
  - Linting Errors → Auto-fix via `npm run lint -- --fix`
  - Build Errors → Zeige Fehler, analysiere Ursache

### Merge Conflicts
- Zeige betroffene Files
- Biete manuelle Resolution an:
  ```bash
  git checkout [pr-branch]
  git merge [target-branch]
  # Resolve conflicts manually
  git add .
  git commit -m "Resolve merge conflicts"
  git push
  ```

### Outdated Target Branch
- Empfehlung: Target-Branch in PR-Branch mergen
  ```bash
  git checkout [pr-branch]
  git merge origin/[target-branch]
  git push
  ```

## Sicherheitschecks

**KRITISCH - NIEMALS automatisch mergen wenn:**
- ❌ CI/CD Tests fehlgeschlagen
- ❌ Merge Conflicts vorhanden
- ❌ `review-gate` ist rot (Merge-Konflikt – erst Branch aktualisieren)
- ❌ Target-Branch ist `main` oder `production` (extra Vorsicht, nur mit Freigabe + `--admin`)

**Immer fragen vor:**
- Breaking Changes
- Dependency Updates (major versions)
- Konfigurationsänderungen (.github/, .env, etc.)

## Best Practices

✅ **Do:**
- Gründlich prüfen vor Merge
- Alle Review-Suggestions durchgehen
- Tests lokal laufen lassen
- CHANGELOG aktualisieren

❌ **Don't:**
- Nicht blind auto-mergen
- Nicht ohne Tests mergen
- Nicht direkt zu `main` mergen (außer Hotfixes)
- Nicht alte PRs mergen ohne Re-Review
