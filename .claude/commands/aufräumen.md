# Tagesabschluss: Aufräumen und Synchronisieren

Führe den täglichen Cleanup-Workflow durch:

## 0. Branch-Übersicht: testing vs. main (alle Repos)

**Nur lokal anwendbar** — der Pfad `/Users/svenstrohkark/...` existiert nur auf
diesem Mac. In Remote-Execution-Sessions trifft `[ -d "$dir/.git" ]` nie zu, die
Schleife läuft ohne Ausgabe und ohne Fehler durch. Läuft die Session nicht lokal
auf diesem Rechner: Abschnitt überspringen und dem Nutzer explizit sagen, dass
diese Prüfung hier nicht durchgeführt werden konnte — nicht stillschweigend
weiterlaufen.

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

**Wichtig:** `git branch --merged` und `git merge-base --is-ancestor` sind bei
Squash-Merge-Policy unbrauchbar — sie melden gemergte Branches als „nicht gemergt".
Maßgeblich ist die PR-Historie, und dort das Feld `merged_at` (nicht `merged`;
letzteres ist über MCP-GitHub-Tools unzuverlässig und liefert teils `false`
auch bei nachweislich gemergten PRs).

```bash
git fetch --all --prune -q
for b in $(git branch -r --format='%(refname:short)' \
           | grep -vE 'origin/(HEAD|main|testing|staging|gh-pages)$'); do
  br=${b#origin/}
  pr=$(gh pr list --head "$br" --state merged --json number,mergedAt --limit 1)
  if [ "$(echo "$pr" | jq 'length')" -gt 0 ]; then
    echo "✅ $br → PR #$(echo "$pr" | jq -r '.[0].number') gemergt"
  else
    echo "⚠️  $br → kein gemergter PR — Inhalt prüfen"
  fi
done
```

Bei `⚠️` zweite Stufe, bevor gelöscht wird — prüft, ob der Branch-Inhalt
inhaltlich schon im Ziel liegt (z.B. bei umbenanntem Squash-Commit):

```bash
mb=$(git merge-base origin/testing origin/$br)
files=$(git diff --name-only $mb origin/$br)
[ -n "$files" ] && git diff --name-only origin/testing origin/$br -- $files
# leere Ausgabe = Inhalt vollständig in testing → löschbar
```

- **Vor dem Löschen fragen**, nur bestätigte Branches löschen
- `main`, `testing`, `staging`, `gh-pages` **nie** löschen — auch nicht beim Bulk-Delete
- Schlägt `git push --delete` mit HTTP 403 fehl (Remote-Execution-Umgebungen):
  Exit-Code ist trotzdem 0 und die letzte Zeile lautet „Everything up-to-date".
  Nicht als Erfolg werten — stattdessen den fertigen Löschbefehl für die lokale
  Ausführung ausgeben.
- Feature-Branches nach Merge löschen: `gh pr merge --delete-branch` explizit
  verwenden. `scripts/apply-rulesets.sh` setzt `delete_branch_on_merge=false`
  zentral (seit Issue #122 Korrektur 4, siehe `dev-standards/global-policy.md`,
  „Merge-Methode zentral erzwingen") — GitHubs Auto-Delete löscht sonst auch
  den Head-Branch von Release-PRs (`testing → main`), also `testing` selbst

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

### 5a. Erledigte Issues aufspüren (Issue #111)
`Closes #X` schließt ein Issue nur beim Merge in den **Default-Branch** (`main`).
Da alle PRs nach `testing` gehen, greift das Keyword faktisch nie — Issues bleiben
offen, obwohl der Code längst gemergt ist.

Gemergte `testing`-PRs gegen die offenen Issues abgleichen:

```bash
SLUG=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
OPEN=$(gh issue list -R "$SLUG" --state open --limit 100 --json number -q '.[].number' | tr '\n' ' ')
gh pr list -R "$SLUG" --state merged --base testing --limit 60 --json number,body \
  --jq '.[] | (.body // "") as $b
        | ($b|[scan("(?i)(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#(\\d+)")]|flatten|unique) as $r
        | select($r|length>0) | "\(.number) \($r|join(" "))"' |
while read -r pr refs; do
  for i in $refs; do
    case " $OPEN " in *" $i "*) echo "Issue #$i erledigt durch PR #$pr";; esac
  done
done
```

**Nur vorschlagen, nicht automatisch schließen.** Sammel-/Meta-Issues ("Backlog",
"Maßnahmenkatalog", "Tracking") werden von Teil-PRs oft fälschlich mit `Closes`
referenziert, sind aber nicht erledigt. Vor dem Schließen den Issue-Titel lesen.

Beim Schließen den Grund vermerken, damit die Historie nachvollziehbar bleibt:

```bash
gh issue close -R "$SLUG" <N> -c "Umgesetzt in #<PR>, gemergt nach \`testing\`."
```

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
