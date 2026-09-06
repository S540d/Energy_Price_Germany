# Claude Code Instructions - Energy Price Germany

## Project Overview
Energy Price Germany - A visualization app for German electricity market prices and renewable energy share with real-time data from multiple APIs.

**Tech Stack:**
- React Native with Expo 55
- TypeScript
- react-native-svg (custom chart rendering)
- react-native-reanimated 4.x (upgraded from 3.x – Issue #247, closed)
- expo-linear-gradient (shimmer effects in SkeletonLoader)
- AsyncStorage (data persistence)
- Cloudflare Worker (CORS proxy for regional data)
- GitHub Pages (web deployment)

## Key Project Documents
- [Architecture](../docs/ARCHITECTURE.md) - System architecture and data flow
- [Data Merge Strategy](../docs/DATA-MERGE-STRATEGY.md) - How data from multiple sources is combined
- [Changelog](../CHANGELOG.md) - Version history
- [Vorfallsarchiv](docs/INCIDENTS.md) - Chronik der Betriebsvorfälle, aus denen die Regeln unten entstanden sind
- [Build Guide](../docs/BUILD.md) - Build and deployment instructions
- [Privacy Policy](../PRIVACY_POLICY.md) - Data privacy information
- [Store Description](../docs/STORE_DESCRIPTION.md) - Play Store listing text

## Workflow & Git Management
### Branch Strategy & PR Workflow

**Gilt für ALLE Änderungen, sofern nicht ausdrücklich anders gesagt:**

1. **Immer einen PR** — auch für Kleinigkeiten.
2. **Ziel-Branch ist `testing`** — nie direkt auf `main`/`staging` committen.
3. **In Claude-Code-Remote-Sessions zuerst umbranchen.** Die vorgegebene
   Arbeits-Branch zweigt von `main` ab, nicht von `testing`:
   ```bash
   git fetch origin testing && git checkout -B <branch> origin/testing
   ```
   Ohne das entsteht ein riesiger, irreführender Diff gegen `testing`, und dort
   bereits vorhandene Fixes werden dupliziert oder überschrieben.
4. **`testing` kann bei `fetch.yml` HINTER `main` liegen.** Hotfixes gehen
   gelegentlich direkt auf `main` und werden nicht zurückgemergt. Vor dem
   Anfassen von `fetch.yml` prüfen:
   ```bash
   git show origin/main:.github/workflows/fetch.yml    | grep -c fetch-energy-charts.sh
   git show origin/testing:.github/workflows/fetch.yml | grep -c fetch-energy-charts.sh
   ```
5. **Bei Konflikten in `fetch.yml`: messen, nicht raten.** Nicht pauschal eine
   Seite nehmen — die Obermenge über Marker bestimmen:
   ```bash
   for m in merge-history.js NEW_REN OLD_REN merge-market-data.js \
            fetch-energy-charts.sh data-health-check.js; do
     printf '%-24s main=%s testing=%s\n' "$m" \
       "$(git show origin/main:.github/workflows/fetch.yml    | grep -c "$m")" \
       "$(git show origin/testing:.github/workflows/fetch.yml | grep -c "$m")"
   done
   ```
   Die Seite, die bei **allen** Markern ≥ der anderen liegt, ist die Obermenge.
   Liegt jede Seite bei irgendeinem Marker vorn, ist es ein echter inhaltlicher
   Konflikt — dann Hand anlegen, nicht `--ours`/`--theirs`.
6. **Ein Sync-PR `main → testing` muss als „Create a merge commit" gemergt
   werden, nicht als Squash.** Squash verwirft den zweiten Parent, `main` wird
   nie Vorfahre von `testing`, und der nächste Release-PR ist wieder
   konfliktbehaftet.
   ```bash
   git log --format='%h parents=%p' -1 origin/testing   # zwei Parents = angekommen
   git merge-base --is-ancestor origin/main origin/testing && echo OK
   ```
   → Hintergrund und Symptome: [`docs/INCIDENTS.md`](docs/INCIDENTS.md#2026-09-02--squash-only-blockierte-den-release-438-439).
   Zentrale Abhilfe in **#450**.

> ⚠️ **`fatal: refusing to merge unrelated histories` = shallow clone**, nicht
> umgeschriebene History. **Niemals `--allow-unrelated-histories`** verwenden:
> ```bash
> git rev-parse --is-shallow-repository   # true = genau dieser Fall
> git fetch --unshallow origin
> ```
> → [`docs/INCIDENTS.md`](docs/INCIDENTS.md#2026-09-02--shallow-clone-sieht-aus-wie-umgeschriebene-history)

### Pull Request Requirements

- Titel referenziert die Issue-Nummer (z. B. „Fix #145: Jest configuration")
- Body erklärt **was** und **warum**
- Ziel-Branch: **immer `testing`** (sofern nicht anders gesagt)
- CI abwarten; nie bei rotem CI mergen

### Dependabot-PRs: Ausnahme von der `testing`-Regel

Dependabot legt seine PRs **direkt gegen `main`** an — das ist Standardverhalten
bei UI-Konfiguration (Settings → Security → Dependabot); es gibt **keine**
`.github/dependabot.yml` im Repo, die das umlenken würde. Das ist eine bewusste
Ausnahme von „Ziel-Branch immer `testing`", keine Fehlkonfiguration.

- Solche PRs referenzieren **keine** GitHub-Issues — nach dem Merge gibt es
  nichts zum Schließen.
- Bei `main` als Ziel laufen alle ~15 `ci-cd.yml`-Checks (nicht nur
  `review-gate`), da der `pull_request`-Trigger dort greift.
- Merge nach `main` braucht laut globaler Policy weiterhin **explizite
  schriftliche Freigabe** — die Dependabot-Zielsetzung ändert daran nichts.
- **Beobachtung (2026-09-03, PRs #440–#442):** Der Merge lief über die
  GitHub-API glatt durch, **ohne** `--admin` und ohne vorheriges Approval —
  obwohl das `Main`-Ruleset laut Doku oben „Required Approvals = 1" verlangt.
  Nicht als Freibrief für menschliche PRs missverstehen: naheliegende
  Erklärung ist, dass das Ruleset Bot-Autoren (`dependabot[bot]`) oder
  reine Squash-Merges über die API anders behandelt als PRs mit
  Code-Änderungen von Menschen/Claude. Nicht verifiziert — vor der nächsten
  Regeländerung am Ruleset gezielt gegenprüfen.

### Merge-Gate: `review-gate` kommt von `mergeability.yml`

Den required Status-Check **`review-gate`** setzt der kostenlose Workflow
`mergeability.yml` (aus project-templates). Er prüft Konfliktfreiheit und
Ziel-Branch-Policy — **kein** inhaltliches Code-Review, **kein** Autofix. Wer
darauf wartet, dass ein Agent Findings selbst wegfixt, wartet vergeblich.

Der KI-Review liegt in `pr-review.yml` und läuft **nur on-demand** über das Label
`ai-review` (kostet metered API-Token). Kostenlos und bevorzugt: `/review` aus
Claude Code.

**Checks je Ziel-Branch:** `ci-cd.yml` triggert bewusst nur auf PRs gegen `main`.
Ein PR gegen `testing` hat daher nur 2 Checks (`review-gate` + `mergeability`),
einer gegen `main` rund 15. Das Fehlen von `🔍 Code Quality & Linting` auf einem
`testing`-PR ist **kein** Defekt.

### Versions-Bump ist kein Automatismus (Session vom 05.09.2026)

Zwischen 1.9.0 (27.06.2026) und 1.10.0 (05.09.2026) liefen **fünf** Releases
`testing → main` (#421–#458), ohne dass jemand `version`/`versionCode`
angehoben hat — `[Unreleased]` in `CHANGELOG.md` wuchs über zwei Monate an,
inkl. eines potenziell absturzrelevanten Fixes (#376), der so ungenutzt blieb.

**Vor jedem Release-PR `testing → main` prüfen:**
```bash
git show origin/main:app.json | grep -E '"version"|versionCode'
git show origin/testing:CHANGELOG.md | grep -n '^## \['
```
Steht unter `## [Unreleased]` etwas User-Relevantes, gehört ein Versions-Bump
(`package.json`, `app.json` `version`+`versionCode`, `App.tsx` `APP_VERSION`,
`package-lock.json`) **in denselben PR**, der nach `testing` geht — nicht erst
im Release-PR nach `main` nachgezogen.

### Release-PRs testing → main

`main` liegt unter dem `Main`-Ruleset mit **Required Approvals = 1**. Als Solo-Dev
kann man den eigenen PR nicht approven → Admin-Bypass nötig:

```bash
gh pr merge <nr> --squash --admin      # KEIN --delete-branch: testing ist der Head!
```

> **Nur mit ausdrücklicher schriftlicher Freigabe.** Das ist der bewusste manuelle
> Release-Schritt, nicht mit dem `review-gate` zu verwechseln.

**Nach dem Merge prüfen:**
```bash
git ls-remote --heads origin | grep testing    # muss existieren
```

> ⚠️ **Branch-Protection: Eine aktive Regel beweist nichts.** Immer zusätzlich die
> Bypass-Actors prüfen — eine Regel mit `bypass_mode: always` für die eigene Rolle
> ist Dekoration. Der belastbare Test ist ein echter Versuch, kein Blick ins UI:
> ```bash
> git push origin --delete testing     # muss GH013 liefern
> ```
> Umgekehrt gilt: **Ein Bypass ist nicht nur ein Risiko, sondern eine
> Abhängigkeit.** Vor dem Entfernen prüfen, *wer* außer Menschen darüber schreibt
> — hier pusht `fetch.yml` mit einem User-PAT bis zu 6× täglich direkt auf `main`.
> Beide Lehren stammen aus realen Ausfällen:
> [`docs/INCIDENTS.md`](docs/INCIDENTS.md#2026-09-0203--datenpipeline-steht-13-stunden-445-446).

> ⚠️ **`github-actions[bot]` ist in Rulesets NICHT als Bypass-Actor wählbar.**
> GitHub lässt das prinzipiell nicht zu. Wählbar sind Rollen, Teams, installierte
> GitHub Apps und **Deploy Keys**. Wer danach im UI sucht, sucht vergeblich.

### Git-Operationen aus der Remote-Execution-Umgebung

**Push auf Feature-Branches funktioniert normal** (`git push -u origin HEAD:<branch>`).

Auf `testing`/`main` lehnt das **Ruleset** ab — nicht die Authentifizierung:
```
remote: error: GH013: Repository rule violations found for refs/heads/testing.
remote: - Changes must be made through a pull request.
```
Der Unterschied ist praktisch relevant: **GH013 heißt „nimm den PR-Weg"**, nicht
„nimm die API" — die MCP-API trifft dieselbe Regel. Ein echtes **403** („Resource
not accessible by integration") kommt dagegen von zu engen Token-Scopes und
betrifft u. a. `mcp__github__actions_run_trigger` (workflow_dispatch,
`rerun_failed_jobs`); solche Läufe muss ein Mensch im UI anstoßen.

**Branches löschen ist aus dieser Umgebung nicht möglich.**
`git push origin --delete <branch>` schlägt fehl, **meldet aber Exit-Code 0** und
„Everything up-to-date" — nicht als Erfolg werten. Ein MCP-Tool zum Löschen einer
Ref gibt es nicht (nur `create_branch`). Stattdessen den fertigen Befehl zur
lokalen Ausführung ausgeben. Vorher prüfen, ob der Branch wirklich gemergt ist:
**nicht** über `git merge-base --is-ancestor` (bei Squash-Merges falsch-negativ),
sondern über das PR-Feld `merged_at` (nicht `merged` — das steht in MCP-Antworten
öfter fälschlich auf `false`, siehe project-templates#101).

**Einzelne Dateien direkt auf einem Branch** (wo erlaubt):
`mcp__github__create_or_update_file` (Blob-SHA nötig: `git rev-parse
origin/<branch>:<path>`) bzw. `mcp__github__push_files`. Für den Branch-HEAD
(Commit-SHA) `git rev-parse origin/<branch>` ohne Pfad.

### Sicherheitshinweis: MCP-Token und KI-gesteuerte Pushes

- MCP-GitHub-Token mit **minimalen Scopes** (empfohlen: `repo` ohne `admin`)
- KI-gesteuerte Direktpushes auf `main`/`testing` bergen dieselben Risiken wie
  manuelle Force-Pushes — im Zweifel den PR-Weg nehmen
- Nach MCP-Push-Sitzungen das **Audit-Log** prüfen (Settings → Audit log)

### CI-Laufzeit: Daten-Commits sind vom App-Build entkoppelt (#394, #400)

Vier Vorkehrungen verhindern, dass jeder Daten-Commit einen vollen App-Build
auslöst. **Alle vier lassen sich versehentlich leicht wieder aushebeln:**

**1. `ci-cd.yml`: `paths-ignore: ['public/data/**']` — nur am `push`-Trigger.**
Der `pull_request`-Trigger hat bewusst **kein** `paths-ignore`, damit der required
Check `🔍 Code Quality & Linting` jeden PR gated. Ergänzt man es dort „der
Symmetrie halber", fällt der Merge-Gate aus.

**2. `deploy-unified.yml`: der Job `refresh-data` überspringt Daten-Commits.**
```yaml
if: github.ref == 'refs/heads/main' &&
    (github.event_name != 'push' || !startsWith(github.event.head_commit.message, 'Update marketdata.json'))
```
Ohne diesen Guard entsteht eine Rückkopplung Daten-Commit → Deploy → Fetch → …
> ⚠️ Die Bedingung hängt an der **exakten Commit-Message** aus `fetch.yml`. Wer
> sie ändert, reaktiviert die Schleife **still** — kein Fehler, kein Hinweis.

**3. `deploy-unified.yml`: Cron 1× täglich (`30 3 * * *`), nicht 5×.**

**4. CodeQL läuft über `.github/workflows/codeql.yml`** (Advanced Setup), damit
`paths-ignore` überhaupt greifen kann — im GitHub-verwalteten *Default Setup* ist
es über keine Datei im Repo steuerbar.

**❌ Kein `paths-ignore` in `deploy-unified.yml`!** Naheliegend, würde aber die
Datenauslieferung brechen: `public/data/**` gelangt ausschließlich über den Deploy
ins Pages-Artefakt. Der geplante schlanke Daten-Deploy steht in **#452**.

**Wirkung immer messen statt schätzen** (`list_workflow_runs` + `jq` nach
`created_at`/`event` gruppieren). Gemessene Wirkung der vier Maßnahmen und die
Fallstricke der CodeQL-Umstellung:
[`docs/INCIDENTS.md`](docs/INCIDENTS.md#2026-08--ci-laufzeit-daten-commits-lösten-volle-app-builds-aus-394-400).

> ### ⚠️ Workflow-Semantik — gilt für den GESAMTEN Inhalt, nicht nur für Trigger
>
> Der `push`-Trigger wird aus der Workflow-Datei **des gepushten Branches**
> gelesen, `schedule` immer aus dem **Default-Branch** (`main`) — und zwar
> **jede Zeile** des Workflows, nicht nur die `on:`-Sektion.
>
> **Konsequenz für `fetch.yml`:** Ein Fix, der nur auf `testing` liegt, ist
> **vollständig wirkungslos**. Er wird erst mit dem Release nach `main` scharf.
> Bereits dreimal passiert (#418, #435, #445).
>
> **Prüfbefehl vor jeder Wirksamkeits-Annahme:**
> ```bash
> git show origin/main:.github/workflows/fetch.yml | grep -c "<neues-Element>"
> ```
> Liefert das `0`, ist der Fix noch nicht scharf — egal wie grün `testing` aussieht.

### `fetch.yml`: Resilienz-Konventionen — nicht zurückbauen (Issues #418, #423, #425, #435)

Fünf Vorkehrungen halten die Datenpipeline stabil. Alle sehen nach
Redundanz aus und sind es nicht:

**1. Alle Energy-Charts-Calls laufen über `scripts/fetch-energy-charts.sh` (#435).**
```yaml
- name: Try fetching from Energy Charts API (preferred source)
  id: energy_charts
  continue-on-error: true
  run: scripts/fetch-energy-charts.sh de public/data
```
Aufruf: `scripts/fetch-energy-charts.sh <country-code> <output-dir>`. Das Skript
schreibt `<output-dir>/price_raw.json` und `<output-dir>/renewable_raw.json` —
genau die Pfade, die die nachgelagerten `node -e`-Process-Steps lesen.

Vertrag des Skripts:
- **Exponentielles Backoff 5 s / 15 s / 45 s** statt des früheren fixen
  `--retry-delay 5`. Drei Versuche im 5-s-Abstand laufen gegen ein Rate-Limit,
  das minutenlang hält, wirkungslos ins Leere.
- **`Retry-After` wird respektiert** (bei 429/503, gedeckelt auf 60 s). Das ist
  der eigentliche Fix für den Vorfall vom 2026-09-02.
- **Retry-würdig:** HTTP 429/5xx sowie curl-Exit 7, 28, 35, 52, 55, 56. Alles
  andere (DNS, URL-Fehler) bricht sofort ab — ein Retry heilt es nicht.
- **Payload-Validierung** per `jq` nach jedem erfolgreichen Download; schlägt sie
  fehl, gilt der Versuch als fehlgeschlagen (siehe „stummer Ausfall" unten).
- **Semantik unverändert:** `price` required (Exit ≠ 0), `ren_share_forecast`
  non-fatal. `success=true` nach `$GITHUB_OUTPUT`, sobald `price` valide ist.
- Env-Overrides nur für Tests: `ENERGY_CHARTS_API_BASE`, `FETCH_MAX_ATTEMPTS`,
  `FETCH_BACKOFF_DELAYS`, `FETCH_RETRY_AFTER_CAP`.

> ⚠️ **Die Retry-Logik nicht wieder in die einzelnen Länder-Blöcke zurückziehen.**
> Vor #435 stand sie als `CURL_OPTS` siebenfach dupliziert im Workflow. `CURL_OPTS`
> existiert nur noch für den **aWATTar**-Call und darf nicht wieder auf die
> Energy-Charts-Blöcke ausgedehnt werden.

**1b. 6 Cron-Slots mit datenbasiertem Gate (#435).**
`- cron: '0 3,6,9,13,16,19 * * *'`. Nur **03 und 13 UTC laufen unbedingt**
(Nacht-Update / primärer Day-Ahead-Slot); 06, 09, 16 und 19 UTC gehen durch den
`gate`-Job und starten den ~90 s teuren `update`-Job nur, wenn sie etwas
verbessern würden. Das Gate fetcht dazu zwei billige DE-Calls (dasselbe Skript,
in `$RUNNER_TEMP`) und setzt `run-fetch=true`, wenn **eines** zutrifft:
1. `max(unix_seconds)` der API **>** `max(start_timestamp)/1000` der committeten
   Datei (neue Preis-Abdeckung), **oder**
2. Zahl der Punkte mit `ren_share != null` **für heute (Europe/Berlin)** aus der
   API **>** derselbe Wert aus der Datei (Erneuerbaren-Lücke schließt sich).

Fehlt die Probe-Datei, entscheidet das Gate **fail open** (`run-fetch=true`) —
der `update`-Job kann mit eigenen Retries und aWATTar-Fallback mehr ausrichten.

> **Ersetzt die Commit-Message-Heuristik aus #406**
> (`grep -Eq "@ ${TODAY}T(1[3-9]) UTC"`). Die prüfte nur, *ob* committet wurde,
> nicht *ob Daten fehlen* — im 429-Fall vom 2026-09-02 hätte sie den Fallback
> fälschlich übersprungen, weil ein Commit (mit Preisen, ohne Erneuerbare)
> existierte. Nicht wieder einführen.

**1c. Der `Data health check` liegt in `scripts/data-health-check.js` (#435/#445, schließt #417).**
Letzter Step im `update`-Job, `if: always()`, also **nach** dem Commit — die
Daten werden in jedem Fall veröffentlicht. Hat DE **0 Punkte mit
`renewable_share != null` für heute (Europe/Berlin)**, setzt das Skript
`::error::` und `exit 1`; GitHub verschickt daraufhin die Standard-„workflow run
failed"-Mail. Das ist der Benachrichtigungsweg aus #417 — ohne Webhook, Secret
oder Kosten. Der Workflow-Step ist nur noch `run: node scripts/data-health-check.js`.
Semantik-Absicherung: `scripts/__tests__/data-health-check.test.js`.

Nicht-fatal (nur `::warning::`, Run bleibt grün): `source == "awattar"` für DE
und jedes **Beta-Land** mit 0 Erneuerbaren-Punkten.

> ⚠️ **Datenlücken färben den Run NICHT rot** (geändert mit der Retrospektive
> zu #445). Der Befund geht in ein automatisch verwaltetes Issue mit Label
> `data-health` (öffnen / höchstens ein Kommentar pro Tag / schließen bei
> Erholung). Grund: Solange ein Datenausfall den Run rot färbte, war **rot
> mehrdeutig** — Upstream-Ausfall oder echter Defekt. Genau dadurch blieb der
> Exit-9-Dauerfehler aus #445 stundenlang unentdeckt: Ein Dauer-Rot sah aus wie
> ein funktionierender Alarm.
>
> **Seither gilt: rot = der Workflow ist defekt.** Diese Eindeutigkeit ist der
> eigentliche Wert — nicht wieder aufweichen, indem fachliche Befunde in den
> Exit-Code wandern.

> ⚠️ **Kein Apostroph in `node -e '…'`-Inline-Blöcken — und lieber gar keine
> mehrzeiligen `node -e`-Blöcke mehr (#445).** Der Health-Check war ursprünglich
> inline geschrieben und enthielt im deutschen Fehlertext
> `die App zeigt 'Erneuerbare: --'`. Die einfachen Quotes schlossen den
> `node -e '…'`-String vorzeitig, `node` bekam `--` als Option und starb mit
> **Exit 9, bevor eine einzige Prüfung lief** — der Step färbte damit **jeden**
> Run rot, unabhängig von der Datenlage, und machte den Alarm aus #417 wertlos
> (ein Dauer-Rot ist von einem echten Ausfall nicht unterscheidbar).
> Deutsche Texte in `fetch.yml` sind voller Anführungszeichen; jede nennenswerte
> Logik gehört deshalb in eine Datei unter `scripts/` (wie
> `fetch-energy-charts.sh`), nicht in einen Inline-Block.
>
> **Seit der Retrospektive maschinell durchgesetzt** — `npm run lint:workflows`
> (`scripts/lint-workflows.js`), im CI-Job `⚙️ Workflow Linting` und im
> Pre-Commit-Hook, sobald `.github/workflows/**` gestaged ist.
>
> ⚠️ **`actionlint`/`shellcheck` finden diese Fehlerklasse NICHT** — nicht darauf
> verlassen. Nachgemessen am 2026-09-03 gegen die fehlerhafte Fassung
> (`9abdda2`): 48 Findings, kein einziges auf dem Bug. Der Grund ist subtil: Ein
> Apostroph im Body ist für die Shell **syntaktisch korrekt**, aus einem String
> werden nur mehrere Wörter — an der Stelle meldet shellcheck bloß `SC2016`
> (info), das bei jedem `node -e` normal ist. Der Fehler ist semantisch, nicht
> syntaktisch. Deshalb der eigene Guard **zusätzlich** zu actionlint.

**2. `ren_share_forecast` ist in ALLEN Ländern non-fatal (`|| true`), `price` bleibt required.**
Vorher hatten DE und NL `|| exit 1`. Ein Ausfall dieses **einen** Endpunkts
verwarf damit auch die validen Day-Ahead-Preise und zwang den ganzen Block in
den aWATTar-Fallback. Wer das „der Strenge halber" zurückdreht, reaktiviert
genau diesen Fehler.

**3. Commit-Erkennung zählt zusätzlich die Erneuerbaren-Abdeckung.**
```bash
if [ "$OLD_TS" != "$NEW_TS" ] || [ "$NEW_REN" -gt "$OLD_REN" ]; then
```
Der reine Zeitstempel-Vergleich reichte nicht: Nach einem aWATTar-Fallback
reicht der Datensatz bereits bis zum Ende des Folgetages, ein späterer
erfolgreicher Energy-Charts-Lauf liefert denselben `max(start_timestamp)` und
wurde samt seiner frisch geholten Erneuerbaren-Werte verworfen.
> Bewusst `-gt` (Zunahme), nicht `!=`: Ein Rückgang bedeutet einen Fallback ohne
> Erneuerbaren-Daten und darf vorhandene Werte nicht überschreiben. Ein Wechsel
> von `source` allein ist aus demselben Grund **kein** Auslöser —
> `energy-charts → awattar` wäre eine Verschlechterung.

#### Zwei Fallstricke der Datenquelle

**Der aWATTar-Fallback liefert per Design KEINE Erneuerbaren-Daten.**
`interpolateAwattarData()` setzt `renewable_share: null` — hart, für jeden
Punkt. Symptom in der App: Kachel „Erneuerbare jetzt" zeigt `--` und
„Tages-Ø 0.0 %", während die Preise völlig normal aussehen. Wer diesen
Symptomen begegnet, prüft als Erstes `jq -r .source public/data/marketdata.json`.

**`ren_share_forecast` kann HTTP 200 mit leeren Arrays liefern.**
```json
{"unix_seconds":[],"ren_share":[],...,"substitute":false,"deprecated":false}
```
Das ist der **stumme** Ausfall und der gefährlichere: `curl -f` meldet Erfolg,
`JSON.parse` läuft durch, und der Guard `if (renewable.unix_seconds &&
renewable.ren_share)` **passiert sogar** — `[]` ist in JS truthy. Der Workflow
endet grün. Der Ausfall ist länderspezifisch.
→ [`docs/INCIDENTS.md`](docs/INCIDENTS.md#2026-08-31--ren_share_forecast-liefert-http-200-mit-leeren-arrays)

> **Guard-Ort seit #435:** `scripts/fetch-energy-charts.sh` validiert die Payload
> direkt nach dem Download —
> `jq -e '(.unix_seconds|length) > 0 and (.ren_share|length) > 0'` (für `price`
> analog mit `.price`). Schlägt das fehl, zählt der Versuch als Fehlschlag und
> wird wiederholt; nach dem letzten Versuch wird die Datei **gelöscht**, damit
> der `fs.existsSync(...)`-Guard im Process-Step greift, statt stillschweigend
> `null`-Werte zu schreiben. Retries sind hier entgegen der früheren Annahme
> **nicht** sinnlos: der Endpunkt erholt sich erfahrungsgemäß.
> **Offener Bug (#425, `priority: high`):** Nur DE merged über
> `scripts/merge-market-data.js` mit der bestehenden Datei. Die sechs anderen
> Länder überschreiben ihre `marketdata.json` vollständig — ein einziger
> ausbleibender `ren_share_forecast` löscht dort die **gesamte**
> Erneuerbaren-Historie. Am 2026-08-31 standen NL/CH/FR/BE/DK auf 0 Werten,
> DE dank Merge noch auf 651.

#### Diagnose-Reihenfolge bei „Website zeigt alte Daten"

Ein grüner Workflow bedeutet **nicht**, dass Daten ankamen — die Fallbacks
sorgen dafür, dass fast nichts hart fehlschlägt. In dieser Reihenfolge prüfen:

1. `jq -r .source public/data/marketdata.json` — `awattar` heißt: Energy Charts
   ist ausgefallen, keine Erneuerbaren-Daten.
2. Abdeckung statt Fehler prüfen: Zahl der Punkte mit `renewable_share != null`
   und wie weit sie reichen — nicht nur `max(start_timestamp)`.
3. Im Job-Log die Zeile `- Renewable points: N` je Land; `0` bei grünem Lauf ist
   der stumme Fall oben.
4. Erst dann Workflow-Logs auf `curl:`-Fehler durchsuchen.

> ⚠️ **Eine sinkende Gesamtzahl der Erneuerbaren-Punkte ist NICHT automatisch
> Datenverlust.** `marketdata.json` ist ein **rollierendes Fenster fester Größe**
> (aktuell 767 Punkte): kommen vorne neue dazu, fallen hinten alte heraus. Am
> 2026-09-02 fiel die Zahl bei einem Lauf von 515 auf 503 — Start *und* Ende
> waren dabei um exakt 3 h gewandert, die Gesamtzahl blieb bei 767. Völlig
> normal. Vor jeder Verlust-Diagnose beide Fenstergrenzen vergleichen, nicht nur
> die Punktezahl:
> ```bash
> jq -r '"von: \([.data[].start_timestamp]|min|./1000|todate)  bis: \([.data[].start_timestamp]|max|./1000|todate)  ren: \([.data[]|select(.renewable_share!=null)]|length)  gesamt: \(.data|length)"' public/data/marketdata.json
> ```
> Echter Verlust liegt nur vor, wenn die Punkte **innerhalb** des unveränderten
> Fensters weniger werden.

> **Die maßgebliche Kennzahl ist „Erneuerbaren-Punkte **für heute** (Europe/Berlin)",
> nicht die Gesamtzahl.** Genau die prüft der `Data health check`, und genau die
> war beim Vorfall am 2026-09-02 `0`, während die Gesamtzahl bei über 500 lag.
> Eine gesunde Gesamtzahl sagt über den sichtbaren Ausfall in der App nichts aus.

### Deploy (Unified): transienter TLS-Fehler in `actions/deploy-pages@v4`

Vereinzelt schlägt `Creating Pages deployment` mit `HttpError: self-signed
certificate` fehl — auf **beiden** Versuchen, da beide denselben Infra-Hänger auf
GitHubs Seite treffen. Kein Code-/Config-Fehler im Repo.

**Abhilfe:** manuellen `workflow_dispatch`-Lauf anstoßen (`rerun_failed_jobs`
scheitert an den Token-Scopes). Das ist ein *neuer* Run — der rote Eintrag bleibt
in der Historie stehen, das ist kein weiteres Problem.
→ [`docs/INCIDENTS.md`](docs/INCIDENTS.md#wiederkehrend--transienter-tls-fehler-in-actionsdeploy-pagesv4)

---

## Development Guidelines

### Code Style
- Use **TypeScript** with strict typing
- Keep App.tsx as the main component (monolithic by design)
- Use utility modules in `/utils` for shared logic
- Follow existing patterns in components/

### Data Sources & APIs
1. **Energy Charts (Fraunhofer ISE)** - Primary source (15-min resolution)
   - Day-ahead market prices (EUR/MWh)
   - Renewable energy share forecast (%)

2. **aWATTar (EPEX Spot)** - Supplement & fallback (~48h coverage)
   - Interpolated to 15-minute intervals

3. **Energy Charts Signal API** - Regional data (postal code based)
   - Via Cloudflare Worker (CORS proxy)
   - Cached for 15 minutes

4. **Mock Data** - Fallback when APIs fail

### Environment Configuration
- `.env.production` - Production settings
- `.env.staging` - Staging settings
- `.env.testing` - Testing settings
- Use `cross-env EXPO_ENV=xxx` in npm scripts

### Pre-Commit Hooks
Validation rules enforced by Husky:
1. **No console.log/debug** (except in scripts/)
2. **Version consistency** between package.json and app.json
3. **Security – Signing fingerprints** (Issue #276): blocks commits adding SHA1/SHA256 colon-hex patterns
4. **Security – Hardcoded tokens** (Issue #276): blocks API keys/tokens in staged `+` lines
5. **Security – Internal docs warning**: warns (non-blocking) if `keystore/` or internal checklists are staged

> Note (PR #309): The hook runs under husky's `sh -e`; the sensitive-data greps
> use `|| true` so a no-match (exit 1) no longer aborts the hook on normal commits.

### Testing & Environments
- **Production:** https://s540d.github.io/Energy_Price_Germany/
- **Local Dev:** `expo start --web`
- **Local Build:** `npm run serve:local` (port 8080)

### Test-Suite läuft automatisiert in CI (Issue #468)
`ci-cd.yml` hat einen Job `🧪 Test Suite` (`npm run test:coverage`), Voraussetzung
für `build-web` und den Release-Report. Vorher liefen die 350 Tests (27
`*.test.ts(x)`-Dateien) nirgends automatisiert — weder hier noch in den
Husky-Hooks —, die in `jest.config.js` konfigurierten Coverage-Schwellen
(68/54/63/68) waren dadurch wirkungslos.

> ⚠️ **`npx tsc --noEmit` in `code-quality` läuft ohne `|| true`.** Vor #468
> maskierte `|| true` jeden Type-Fehler, der Schritt konnte nie fehlschlagen.
> Beim erneuten Hinzufügen (z. B. „der Robustheit halber") wird der Type-Check
> wieder wirkungslos — nicht zurückbauen.

## Critical Areas

1. **Data Fetching (App.tsx):**
   - Complex merge logic for multiple data sources
   - Fallback chain: Energy Charts → aWATTar → Mock Data
   - Regional data via Cloudflare Worker
   - See DATA-MERGE-STRATEGY.md for details

2. **Cloudflare Worker (cloudflare-worker.js):**
   - CORS proxy for Energy Charts Signal API
   - Caching: 15min browser, 1h Cloudflare
   - Deployed automatically via GitHub Actions

3. **Market Data Updates (update-marketdata.js):**
   - Automated data refresh via GitHub Actions
   - Updates `public/marketdata.json`
   - Runs every 2 hours

4. **Chart Components (components/charts/):**
   - Custom SVG charts with react-native-svg (PriceBarChart, RenewableBarChart, CorrelationScatterChart)
   - Shared components in `components/charts/shared/` (ChartGrid, ChartCard, ChartTooltip, NowMarker)
   - Performance-optimized with useMemo/useCallback/React.memo
   - Responsive design via `useChartDimensions()` hook
   - Touch/hover interactions (platform-aware)
   - **Pinch/scroll zoom (Issue #355, PR #380):** all three charts (+ `ChartDetailView`) get zoom
     via the shared `useChartZoom(viewportWidth)` hook (`components/charts/shared/useChartZoom.ts`).
     `contentWidth` replaces `chartWidth` for all internal x-position math and is wrapped in a
     horizontal `ScrollView`; Y-axis labels are deliberately rendered *outside* that ScrollView
     (pinned overlay) so they don't scroll away. Web zooms via `onWheel`, native via a 2-touch
     `PanResponder` (no `react-native-gesture-handler` dependency added). `ZoomResetBadge.tsx`
     shows a ⟲ reset control when `isZoomed`. Tooltip `x` must go through `toViewportX()` before
     `getTooltipLeft()` so it stays aligned with the current scroll offset.
   - **Title overflow (Issue #355, PR #380):** title wrapper needs `flex: 1` + the `<Text>` needs
     `numberOfLines={2}`/`ellipsizeMode="tail"` — otherwise long titles (e.g. regional renewable
     title) clip on small screens instead of wrapping.

5. **Historical Data (`services/historicalDataStore.ts`) – Issues #307/#1/#3 (PR #309):**
   - **Device cache is the primary source.** Every successful national fetch in
     `EnergyDataManager.performDataLoad` records a per-day snapshot
     (`recordSnapshot`, deferred/fire-and-forget) into `Storage` (localStorage/AsyncStorage).
   - **Storage layout** (versioned like `energy_regional_cache_v1`):
     `energy_history_v1:<YYYY-MM-DD>` per day + `energy_history_index_v1` index
     (date + byte size per day for fast range/size queries).
   - **Day keys are Europe/Berlin** (`dayStringFromTimestamp` via `Intl`/`formatToParts`),
     NOT device-local — must match the Berlin-dated `public/data/history/YYYY-MM-DD.json`.
   - **MB-based eviction:** user sets `historyCacheLimitMb` (5/10/25/50; default 10) in the
     Customize modal (`HistoryCacheSection`); `App.tsx` forwards it via
     `energyDataManager.setHistoryLimitBytes`; `enforceLimit` drops oldest days over budget.
   - **Server fallback:** `getRange(from, to, allowServerFallback=true, resolution='raw')` loads
     missing *past* days from `data/history/<date>.json` (validated via `apiValidation`) into the
     cache; 404/errors ignored; `serverFetchAttempted` avoids repeat misses per session.
   - **Hourly pre-aggregation (Issue #334, PR #380):** `resolution: 'hourly'` fetches the smaller
     pre-aggregated `data/history/<date>-hourly.json` instead (~75% smaller, ~24 pts/day vs. 96),
     generated per-day in `fetch.yml` (all countries) right after the raw history file. Falls back
     to the raw file automatically if the hourly variant 404s (e.g. older dates predating this
     feature). `HistoricalDataView` passes `'hourly'` only for the 30d range (already
     daily-bucketed client-side via `dataAggregation.ts`); 24h/48h/7d stay `'raw'`. A day already
     cached (e.g. from a live snapshot) is never re-fetched, so it keeps whatever resolution it
     has — don't assume every cached day is full 15-min resolution when reasoning about stats.
   - **UI:** `HistoricalDataView` (Settings → "Verlauf") = range selector 24h/48h/7d/30d (#1),
     charts aggregated via `dataAggregation.ts` (15min/hourly/daily), stats via
     `historicalStats.ts` (#3). The live main screen is intentionally unchanged.
   - **Period comparison (#311):** `HistoricalDataView` also loads the equally long
     *previous* period `[from - window, from)` (parallel `getRange`) and shows a
     "vs. Vorperiode" row per stat block via `computePeriodComparison` in
     `historicalStats.ts` (Δ avg absolute + %, direction). Each series (price/renewable)
     is `null` only when that series has no data in one of the periods; when
     `previousAvg == 0` the object is still returned and only `deltaPct` is `null`.
     i18n key `historyStatVsPrev` (must exist in BOTH `en`+`de`).

6. **Multi-Country / Europäische Datenexpansion (`utils/countries.ts`) – Issues #356/#368:**
   - **Country Registry is the single source of truth.** `COUNTRIES: Record<CountryCode, CountryConfig>`
     (currently `de` | `nl` | `at` | `ch` | `fr` | `be` | `dk`) derives data paths, timezone,
     `hasRegionalData`, default grid fees. Adding a country = one registry entry + one pipeline
     block in `fetch.yml`, no scattered `if country === 'de'` checks. `DEFAULT_COUNTRY = 'de'`.
   - **BETA countries** (NL, AT, CH, FR, BE, DK): `beta: true`, no regional/PLZ UI, no aWATTar,
     data under `data/<code>/marketdata.json` + `data/<code>/history/`.
   - **Active country** lives in `context/CountryContext.tsx` + `hooks/useCountry.ts`
     (persisted under storage key `country`, validated via `isCountryCode`). Independent from
     the UI language. Selector UI: `components/customize/CountrySection.tsx`.
   - **DE stays on legacy flat paths** (`data/marketdata.json`, `data/history/`) for backward
     compat with deployed clients; new countries live under `data/<code>/`.
   - **Data load is country-aware** (`energyDataManager`): fetch path from
     `COUNTRIES[country].marketDataPath`; cache keyed by `dataCountry` (switch invalidates);
     regional/PLZ fetch only when `hasRegionalData` (non-DE countries hide PLZ UI entirely).
   - **In-flight de-dup is scoped to the request** (`loadingCountry`/`loadingPostalCode`).
     A load only piggybacks on the running promise when **country AND postal code match**;
     a request for a different country awaits the in-flight load, then starts fresh. Do NOT
     revert to an unconditional `if (isLoading) return loadingPromise` — that caused the
     start-up race where the default DE load handed German data to the NL request. The `finally`
     only clears load state when `loadingPromise` is still the current one.
   - **Pipeline** (`fetch.yml`): each non-DE country has its own block (Fetch → Process →
     Validate → Compare → Archive + History → Cleanup), `continue-on-error` so failures don't
     block DE; `sleep 5` rate-limit guard; `ren_share_forecast` non-fatal (`|| true`).
   - **History store is country-namespaced** (#356 Step 3): keys
     `energy_history_v1_<country>:<date>` + `energy_history_index_v1_<country>`; server-fallback
     URL from `historyPathPrefix`; `dayStringFromTimestamp(ts, timezone?)` uses the registry tz.
     Use the factory `historicalDataStoreForCountry(country)`; the `historicalDataStore`
     singleton is just the DE alias (used by `HistoryCacheSection`).
   - **`HistoricalDataView` ("Verlauf") takes a `country` prop** and reads from
     `historicalDataStoreForCountry(country)` — must NOT use the bare DE singleton.
   - i18n keys (EN+DE): `country`, `countryGermany`, `countryNetherlands`, `countryAustria`,
     `countrySwitzerland`, `countryFrance`, `countryBelgium`, `countryDenmark`, `countryBeta`.

## Common Tasks

### Adding a New Feature
1. Check if it affects data fetching logic
2. Update translations for DE/EN
3. Test on both web and mobile (Expo Go)
4. Update CHANGELOG.md with changes

### Updating Market Data
```bash
npm run data:update    # Manual update
npm run cache:update   # Update cache version
```

### Building & Deploying

#### Web
```bash
npm run build:web      # Production build
npm run deploy         # Deploy to GitHub Pages
npm run validate       # Run release validation
```

#### Android (Local Build)
```bash
# 1. Generate Android project
EXPO_ENV=production npx expo prebuild --platform android --clean

# 2. Build signed AAB (for Play Store)
cd android && ./gradlew bundleRelease --no-daemon --console=plain \
  -PMYAPP_UPLOAD_STORE_FILE=../@devsven__Energy_Price_Germany.jks \
  -PMYAPP_UPLOAD_STORE_PASSWORD=<from credentials.json> \
  -PMYAPP_UPLOAD_KEY_ALIAS=<from credentials.json> \
  -PMYAPP_UPLOAD_KEY_PASSWORD=<from credentials.json>

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Before Committing
- Run `npm run validate` for release checks
- Ensure version consistency (package.json ↔ app.json ↔ App.tsx)
- Update CHANGELOG.md for significant changes

## Known Issues & Gotchas

### Babel Config
- **CRITICAL:** `babel.config.js` must use only `babel-preset-expo` (the Expo default). Custom presets like `@babel/preset-env` with `targets: { node: 'current' }` will skip transpilation of private class fields, causing Hermes build failures on Android.

### Version Management
- `app.config.js` reads `version` and `versionCode` from `app.json` (single source of truth for these values)
- Version must be consistent across: `package.json` ↔ `app.json` ↔ `App.tsx` (APP_VERSION)
- `app.config.js` must NOT hardcode version/versionCode

### Android Signing
- Keystore: `@devsven__Energy_Price_Germany.jks` (in project root, gitignored)
- Credentials: `credentials.json` (in project root, gitignored)
- `/android` directory is NOT tracked in git (generated by `expo prebuild`)
- **After each `expo prebuild --clean`**: manually add `signingConfigs.release` block to `android/app/build.gradle` and change the release buildType to use `signingConfigs.release` (not `debug`)
- `keystore/` directory is gitignored (Issue #276) – Signing-Docs lokal halten, nie committen
- **RESOLVED (Security-Audit, Aug 2026):** `keystore/keystores.md` ist in der Git-History erreichbar, enthielt aber nie echte Credentials — nur Platzhalter und den **öffentlichen** Signing-Cert-Fingerprint (kein Secret). Ein `filter-repo`-Rewrite wurde bewusst **nicht** durchgeführt. → [`docs/INCIDENTS.md`](docs/INCIDENTS.md#2026-08--security-audit-keystorekeystoresmd-in-der-git-history)
- **Large-Screen-Kompatibilität (Issue #381):** Da `AndroidManifest.xml` generiert/gitignored ist, werden Manifest-Attribute ohne eigenes Expo-Config-Schema-Feld (z.B. `android:resizeableActivity`) über Config-Plugins in `plugins/` gesetzt (siehe `withAndroidResizeableActivity.js`, registriert in `app.config.js` → `plugins`). Gleiches Muster für künftige Manifest-Anpassungen verwenden statt `/android` manuell zu patchen.

### Reanimated 4 Upgrade (Issue #247, resolved)
- Upgraded from `react-native-reanimated@3.x` to `4.2.1`+ (`react-native-worklets@0.8.1` as peer dep) for Expo SDK 55 / RN 0.83 compatibility.
- Only code change needed was `AppearanceSection.tsx` (`useAnimatedStyle` dependency array removed, not supported in v4).

### API Rate Limits
- Energy Charts: No official limit, be reasonable
- aWATTar: Limited requests, use caching
- Regional API: 15-min cache via Cloudflare

### Time Zone Handling
- All data in Europe/Berlin timezone
- Charts display local time
- Data timestamps are ISO 8601 format

### Mobile vs Web Differences
- Touch vs hover interactions
- Different chart sizing
- Storage: AsyncStorage (mobile) vs localStorage (web)

## Architecture Notes

### Module Structure
```
App.tsx                           # Main app (data fetching, state, UI)
components/
├── charts/
│   ├── PriceBarChart.tsx         # Electricity price bar chart
│   ├── RenewableBarChart.tsx     # Renewable energy share bar chart
│   ├── CorrelationScatterChart.tsx # Price vs renewable scatter plot
│   └── shared/                   # Reusable chart building blocks
│       ├── ChartGrid.tsx         # SVG grid lines
│       ├── ChartCard.tsx         # Card wrapper with shadow + fade-in animation
│       ├── ChartTooltip.tsx      # Tooltip with boundary clamping + scale/fade animation
│       ├── NowMarker.tsx         # "Jetzt" time marker (line + label)
│       ├── useChartZoom.ts       # Pinch/scroll zoom hook (#355)
│       ├── ZoomResetBadge.tsx    # ⟲ reset control shown while zoomed (#355)
│       ├── chartScale.ts         # Shared coordinate math (scaleToX/scaleToY/getBarWidth/getBarHeight)
│       └── index.ts              # Barrel exports
├── settings/
│   ├── AppearanceSection.tsx     # Theme pill selector with spring animation
│   └── SettingsMenu.tsx          # Settings panel (slide-up/down animation; "Verlauf" entry)
├── customize/
│   └── HistoryCacheSection.tsx   # History cache size (MB) selector + "Cache leeren" (#307)
├── ui/
│   ├── Button.tsx                # Scale-spring on press
│   ├── SkeletonLoader.tsx        # Shimmer skeleton (LinearGradient + Reanimated)
│   ├── ChartSkeleton.tsx         # Chart loading placeholder
│   ├── Chip.tsx                  # Animated chip/badge element
│   └── Badge.tsx                 # Animated badge element
├── ChartDetailView.tsx           # Expandable detail modal with share button
├── CostCalculator.tsx            # Cost calculator logic
├── CostCalculatorView.tsx        # Full-screen cost calculator view
├── HistoricalDataView.tsx        # Full-screen history view: range select + charts + stats (#1/#3/#307)
└── LoadingIndicator.tsx          # Loading states

utils/
├── chartUtils.ts         # useChartDimensions hook, label generators
├── chartHelpers.ts       # Y-axis label styling
├── apiValidation.ts      # API response validation & types
├── dataInterpolation.ts  # Data gap interpolation
├── metrics.ts            # EnergyData type, constants
├── platform.ts           # Cross-platform storage abstraction
├── theme.ts              # Color management
├── translations.ts       # i18n support (DE/EN)
├── postalCodeUtils.ts    # PLZ validation
├── historicalStats.ts    # Stats over EnergyData[] (avg/min/max/median/trend) + period comparison (#3/#311)
├── dataAggregation.ts    # Bucket EnergyData[] hourly/daily for long ranges (#1)
└── designSystem.ts       # Design tokens

services/
├── energyDataManager.ts  # Data orchestration (fetch, cache, process)
├── regionalDataCache.ts  # Dual-layer regional cache (memory + persistent)
├── historicalDataStore.ts # Persistent per-day history in device cache (#307)
└── dataMerger.ts         # Regional-to-national data merge

scripts/
├── post-build.js         # Build post-processing
└── validate-release.sh   # Release validation
```

### Data Flow
1. App mounts → Fetch Energy Charts data
2. Check coverage → Supplement with aWATTar if needed
3. User enters PLZ → Fetch regional data via Cloudflare
4. Merge all data → Display in charts
5. Cache in AsyncStorage for offline use
6. Record per-day snapshot into the historical store (#307); the "Verlauf" view
   reads it back (with server fallback) for 24h/48h/7d/30d ranges + statistics

## Do's and Don'ts

### ✅ Do:
- Use existing data fetching patterns
- Respect API caching strategies
- Update CHANGELOG.md for user-facing changes
- Test both DE and EN translations
- Use cross-env for environment variables

### ❌ Don't:
- Bypass caching for API calls
- Hardcode German/English text
- Modify marketdata.json manually (use script)
- Skip version consistency checks
- Deploy without running validate script
- Commit Signing-Fingerabdrücke (SHA1/SHA256) oder API-Keys direkt in Code/Config (Issue #276)
- `keystore/` Inhalte committen – Verzeichnis ist gitignored und lokal zu halten

## Deployment

### GitHub Pages (Production)
```bash
npm run deploy
```

### Cloudflare Worker
- Auto-deployed via GitHub Actions on push to main
- Worker code: `cloudflare-worker.js`
- Handles CORS for regional API

### Android (Local Build - Preferred)
```bash
EXPO_ENV=production npx expo prebuild --platform android --clean
cd android && ./gradlew bundleRelease --no-daemon
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### Android (EAS Cloud Build)
> **Removed** (PR #204): EAS cloud build is no longer used. Use local builds only.

## Security

### Aktive Schutzmaßnahmen (seit Issue #276)
- **Pre-Commit Hook** (`.husky/pre-commit`): blockiert SHA1/SHA256-Fingerabdrücke und hardcodierte API-Tokens in staged Changes
- **CI Security Scan** (`.github/workflows/security-scan.yml`): läuft auf allen PRs gegen main/staging/testing, verhindert Umgehung via `--no-verify`
- **`.gitignore`**: `keystore/` komplett ausgeschlossen

### Offene Punkte
- GitHub Secret Scanning in Repository-Settings aktivieren (Settings → Code security → Secret scanning)

### Geklärt (Security-Audit, Aug 2026)
- `keystore/keystores.md` in Git-History: **kein `filter-repo`-Rewrite** – enthielt nie echte Credentials, nur Platzhalter + öffentlichen Signing-Fingerprint (siehe Android Signing oben). Rewrite-Impact (alle SHAs/Tags/Referenzen brechen) steht in keinem Verhältnis zum Risiko.
- `keystore/KEYSTORE_BACKUP_GUIDE.md` (nur Platzhalter-Werte) aus dem Tracking entfernt.

### npm audit fix: Vorsicht bei `--force` (Issue #352, PR #409)
`npm audit fix --force` kann bei transitiven Findings unter Expo (z.B. `uuid` via `xcode`/`@expo/config-plugins`) einen **Downgrade von `expo` auf eine uralte Version** (z.B. `46.x`) vorschlagen – ein Resolver-Artefakt, kein echter Fix-Pfad. Stattdessen gezielt per `overrides` in `package.json` auf die gepatchte Version pinnen und danach `npm install` + Build + Tests verifizieren.
> **`image-size` (high, DoS via Endlosschleife), transitiv über `metro`:** Stand Aug 2026 listet `npm audit` **alle** veröffentlichten Versionen (inkl. `2.0.2`) als vulnerabel – es gibt noch keinen Fix stromaufwärts. Ein `overrides`-Pin bringt nichts, solange keine gepatchte Version existiert. Betrifft nur den lokalen Metro-Build-Prozess, nicht den ausgelieferten Code. Tracking in #265.

## Questions?
Refer to documentation in root directory or check GitHub issues:
- [GitHub Issues](https://github.com/S540d/Energy_Price_Germany/issues)

<!-- GLOBAL POLICY:START -->
## [GLOBAL POLICY]

> Automatisch synchronisiert aus project-templates (Issue #7). Nicht manuell editieren –
> Änderungen hier werden beim nächsten Sync überschrieben. Quelle anpassen statt lokal.

- PRs immer gegen `testing`, nie direkt gegen `staging` oder `main`
- Merge auf `main` nur mit expliziter schriftlicher Freigabe
- `--delete-branch` nur für Feature-Branches (nie staging/testing)
- **Lokales Branch-Cleanup:** `main` und `testing` NIE löschen — auch nicht beim Bulk-Delete verwaister `[gone]`-Branches. Ein fehlender `origin/main`/`origin/testing` ist ein **wiederherzustellender Defekt** (lokal behalten, nach origin zurückpushen), kein Aufräum-Signal.
- `--no-verify` nur auf explizite Bitte
- **Vor jedem Push: lokale Tests ausführen** (`npm test` bzw. projektspezifischer Test-Befehl) – kein Push ohne grüne lokale Tests
- **Kein Merge bei CI-Fail** – Branch Protection erzwingt das technisch; nie mit `--admin` umgehen außer auf explizite Bitte
- **Zugehöriges Issue beim Merge schließen** (Issue #111): `Closes #X` im PR-Body greift nur beim Merge in den Default-Branch (`main`) — bei PRs nach `testing` also **nie**. Das Issue nach dem Merge manuell schließen (`gh issue close <N> -c "Umgesetzt in #<PR>, gemergt nach \`testing\`."`), sonst bleiben erledigte Issues offen liegen. Ausnahme: Sammel-/Meta-Issues, die ein Teil-PR nur anteilig abarbeitet — die bleiben offen. `Closes #X` trotzdem im PR-Body lassen: es erzeugt die sichtbare Verknüpfung.

## [ANDROID BUILD – PFLICHTREGELN]

- **Git-Tag** nach jedem Play-Store-Upload setzen: `git tag vX.Y.Z && git push origin vX.Y.Z` – der Tag markiert den tatsächlich veröffentlichten Stand und dient als Changelog-Baseline für den nächsten Build
- **EAS Local Build (DrawFromMemory):** Workingdir vor jedem Build leeren: `rm -rf ~/tmp/eas-build && mkdir -p ~/tmp/eas-build` – ein nicht-leeres Verzeichnis bricht den Build sofort ab
- **Disk-Check vor EAS Build:** Skia-Libraries benötigen ~5–8 GB. Bei < 5 GB frei: `npm cache clean --force && rm -rf ~/.npm/_npx` (~13 GB, sicher löschbar)
- **JAVA_HOME** für EAS/Expo-Builds explizit auf Android Studio JBR setzen: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`
- **Gradle-Lock nach Absturz:** Bei "Cannot lock file hash cache"-Fehler Daemons stoppen: `pkill -f GradleDaemon`, dann Workingdir leeren und neu starten
- **AAB-Archiv:** Gebaute Release-AABs in einem **gitignored** `aab-archive/`-Verzeichnis im Repo-Root ablegen (in `.gitignore` aufnehmen – AABs sind 3–110 MB und gehören nie in die Git-History). Benennung: `<Projekt>-vX.Y.Z-vc<versionCode>-YYYY-MM-DD.aab`. **Retention: max. 2 Dateien** (aktuelles Release + ein Vorgänger für schnelles Rollback); ältere AABs löschen. Der Git-Tag `vX.Y.Z` ist die eigentliche Release-Baseline – ältere AABs lassen sich daraus jederzeit neu bauen.

## [CODE HEALTH AUDIT]

- **Wiederkehrendes Code-Health-Audit** (Ballast/Architektur: God Components, Boilerplate-Duplikation, toter Code, Dependency-Bloat, Test-Integrität, Design-Konsistenz, Bundle-Größe) alle ~3 Monate oder ~15 gemergte Feature-PRs (je nachdem was zuerst eintritt). Checkliste + Ablauf: https://github.com/S540d/project-templates/blob/main/dev-standards/code-health-audit.md — Ergebnis ist immer ein Issue im jeweiligen Projekt-Repo, nie in project-templates.

## [CI – CACHE-CLEANUP]

- **Cache-Cleanup-Workflow** (`.github/workflows/cache-cleanup.yml`) in jedem Repo mit GitHub-Actions-Caches: löscht wöchentlich (So 03:00 UTC) bzw. on-demand alle Action-Caches älter als der jeweils letzte Lauf. GitHub-Limit ist 10 GB pro Repo – ohne Cleanup laufen Build-Caches (node_modules, Gradle, Expo) voll und verdrängen frische Einträge. Vorlage: `cache-cleanup.yml` in project-templates.
<!-- GLOBAL POLICY:END -->
