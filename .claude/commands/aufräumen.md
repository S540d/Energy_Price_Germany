# Tagesabschluss: Aufräumen und Synchronisieren

Führe den täglichen Cleanup-Workflow durch:

## 0. Branch-Übersicht: testing vs. main (alle Repos)

Erstelle zu Beginn eine Tabelle aller Repositories mit dem Stand von `testing` gegenüber `main`:

```bash
for repo in Eisenhauer 1x1_Trainer DrawFromMemory EnergyPriceGermany Pflanzkalender safe_my_plants CD-to-Spotify-PWA project-templates; do
  dir="/Users/svenstrohkark/Documents/Programmierung/Projects/$repo"
  if [ -d "$dir/.git" ]; then
    cd "$dir"
    git fetch --all --prune -q 2>/dev/null
    ab=$(git rev-list --left-right --count origin/main...origin/testing 2>/dev/null)
    main_ahead=$(echo $ab | awk '{print $1}')
    test_ahead=$(echo $ab | awk '{print $2}')
    echo "$repo | testing +$test_ahead | main +$main_ahead"
  fi
done
```

Zeige das Ergebnis als Markdown-Tabelle:

| Projekt | testing ahead | main ahead | Status |
|---|---|---|---|
| ... | ... | ... | ✅ OK / ⚠️ Divergiert / 🔴 main voraus |

**Statusregeln:**
- ✅ OK — main_ahead = 0 (testing enthält main vollständig)
- ⚠️ Leicht divergiert — main_ahead ≤ 3 und nur Auto-Commits (z.B. marketdata)
- 🔴 main voraus — main_ahead > 0 mit echten Commits → Sync-PR nötig

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
- Zeige alle lokalen Commits, die noch nicht gepusht sind (`git log @{u}..HEAD`)
- **Frage vor Push:** "Soll ich diese Commits jetzt pushen?" — nie automatisch pushen
- Falls Ja: pushe und hole neueste Änderungen von origin
- Zeige finale Status-Zusammenfassung

## 9. Zusammenfassung
Erstelle eine kurze Zusammenfassung:
- Anzahl gelöschter Branches
- Anzahl gepushter Commits
- Status der Environments (Production, Staging)
- Daten-Aktualität (falls relevant)
- Offene Issues/PRs
- Nächste TODOs für morgen
