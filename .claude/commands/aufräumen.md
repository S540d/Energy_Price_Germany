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
    # Phantom-Divergenz ausblenden: nur Nicht-Auto-Commits auf main zählen.
    # Auto-Commits = extern gezogene Marktdaten o.ä. (marketdata.json, energy-charts,
    # plant data, "[skip ci]", "chore(data)"). Diese landen per Workflow direkt auf main
    # und erzeugen sonst Dauer-Divergenz, obwohl inhaltlich nichts auseinanderläuft.
    real_main_ahead=$(git log --oneline origin/testing..origin/main 2>/dev/null \
      | grep -vicE 'update marketdata|energy-charts|chore\(data\)|\[skip ci\]|auto-update' )
    echo "$repo | testing +$test_ahead | main +$main_ahead (echt: $real_main_ahead)"
  fi
done
```

Zeige das Ergebnis als Markdown-Tabelle:

| Projekt | testing ahead | main ahead (echt) | Status |
|---|---|---|---|
| ... | ... | ... | ✅ OK / 🔴 Sync-PR nötig |

**Statusregeln (auf `real_main_ahead` basieren, NICHT auf `main_ahead`):**
- ✅ OK — `real_main_ahead = 0` (egal wie viele Auto-Marktdaten-Commits auf main liegen —
  diese sind erwartet und kein Grund für einen Sync-PR)
- 🔴 Sync-PR nötig — `real_main_ahead > 0` (echte, nicht-automatische Commits liegen nur auf
  main und fehlen in testing → `sync: main → testing` PR erstellen)

> **Warum:** Workflows committen extern gezogene Daten (z.B. `marketdata.json`) direkt auf
> `main`. Ohne Filter meldet der Check Dauer-Divergenz, obwohl nichts Echtes auseinanderläuft.
> Maßgeblich ist deshalb `real_main_ahead`.

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
