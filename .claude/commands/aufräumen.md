# Tagesabschluss: Aufräumen und Synchronisieren

Führe den täglichen Cleanup-Workflow durch:

## 1. Repository Status prüfen
- Prüfe `git status` für uncommitted changes
- Liste alle lokalen Branches
- Prüfe ob lokaler main Branch mit origin synchron ist

## 2. Branches aufräumen
- Liste alle merged Feature Branches (lokal und remote)
- Frage ob diese gelöscht werden sollen
- Lösche approved Branches

## 3. GitHub Actions Status
- Liste letzte 5 Workflow Runs (Deploy, Tests, etc.)
- Zeige Failed Runs falls vorhanden
- Prüfe wichtige automatisierte Workflows

## 4. Open Pull Requests
- Liste alle offenen PRs
- Zeige Status (Approved? Mergeable? CI passing?)
- Weise auf alte PRs hin (>7 Tage)

## 5. Issues Management
- Liste Issues mit "Priority" oder "Bug" Label
- Zeige kürzlich geschlossene Issues (heute)
- Weise auf Issues ohne Label hin

## 6. Dependencies & Security
- Prüfe ob `package.json` Updates braucht (via npm outdated)
- Prüfe auf Security Vulnerabilities (npm audit)
- Zeige Warnungen falls vorhanden

## 7. Data Status (falls relevant)
- Prüfe letzte Aktualisierung von kritischen Daten-Files
- Zeige ob Daten aktuell sind
- Manuelles Update anbieten falls nötig

## 8. Sync & Push
- Pushe alle lokalen Commits
- Hole neueste Änderungen von origin
- Zeige finale Status-Zusammenfassung

## 9. Zusammenfassung
Erstelle eine kurze Zusammenfassung:
- Anzahl gelöschter Branches
- Anzahl gepushter Commits
- Status der Environments (Production, Staging)
- Daten-Aktualität (falls relevant)
- Offene Issues/PRs
- Nächste TODOs für morgen
