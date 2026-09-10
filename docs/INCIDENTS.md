# Vorfallsarchiv

Chronik der Betriebsvorfälle, aus denen die Regeln in [`CLAUDE.md`](../CLAUDE.md)
entstanden sind. **Dieses Dokument ist kein Regelwerk** — es begründet die Regeln
und bewahrt die Details, die man beim nächsten ähnlichen Fall braucht.

`CLAUDE.md` verweist an den passenden Stellen hierher.

---

## 2026-09-02/03 — Datenpipeline steht 13 Stunden (#445, #446)

Zwei unabhängige Ursachen, beide außerhalb der Anwendungslogik. Letzter
Daten-Commit `b379912` um 16:03 UTC, nächster erst `3762f45` um 05:29 UTC.
Die Website zeigte eingefrorene Preise, während Preise korrekt geholt und
anschließend verworfen wurden.

### Ursache 1: Der Bypass-Zirkel (#446)

Ein Zirkel, der sich über vier Vorfälle aufgebaut hatte:

```
delete_branch_on_merge=true   (zentral aus project-templates erzwungen)
  → löscht beim Release-PR testing→main den Head-Branch testing mit
  → 4 Vorfälle: PR #404, #421, #424, #427
    → Gegenmaßnahme: deletion-Regel im Ruleset
      → wirkungslos, solange ein Admin-Bypass existiert
        → Gegenmaßnahme: bypass_actors: [] (#428)
          → entzieht damit auch dem Daten-Push von fetch.yml die Berechtigung
            → #446: Pipeline steht
```

`fetch.yml` checkt mit `token: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}`
aus, pusht also bevorzugt als **User-PAT** — gedeckt war der durch den
Repository-admin-Bypass, und genau den entfernte #428.

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.
```

Zuerst in Run `33690118651` (22:25 UTC); der Lauf um 16:00 UTC (`33652243129`)
kam noch durch.

**Behoben** durch Wiederaufnahme der Rolle `Repository admin` in die Bypass-Liste
des `main`-Rulesets, während `protect-testing` bypass-frei blieb.

**Wichtig für die Suche im UI:** `github-actions[bot]` ist in Rulesets
grundsätzlich **nicht** als Bypass-Actor wählbar — GitHub lässt das aus
Sicherheitsgründen nicht zu. Wählbar sind Rollen, Teams, installierte GitHub
Apps und Deploy Keys. Eine frühere Fassung dieses Dokuments empfahl fälschlich
den Bot; das kostete eine Runde vergebliches Suchen.

**Nachfolge:** #450 (zentrale Vorlagen), #451 (Deploy Key + Auto-Sync).

**Update 2026-09-04 (#459):** #451 ist gemergt (2026-09-03, 18:02 UTC) und löst den
interimistischen `Repository admin`-Bypass wieder ab — `fetch.yml` checkt seither mit
`ssh-key: ${{ secrets.FETCH_DEPLOY_KEY }}` statt `token:` aus, der Deploy Key steht als
eigener Bypass-Actor im `main`-Ruleset. In Produktion verifiziert: Die Fetch-Commits
`9fe2c47` (2026-09-03T18:05 UTC) und `4f5171f` (2026-09-04T03:06 UTC) landeten auf `main`,
obwohl der `Repository admin`-Bypass zu diesem Zeitpunkt bereits wieder entfernt war. Der
Bypass-Zirkel aus #446 ist damit ohne Rollen-Bypass geschlossen.

### Ursache 2: Ein Apostroph legte den Health-Check lahm (#445)

Der `Data health check` aus #435 war als `node -e '…'`-Inline-Block geschrieben
und enthielt im deutschen Fehlertext `die App zeigt 'Erneuerbare: --'`. Die
einfachen Quotes schlossen den Shell-String vorzeitig, `node` bekam `--` als
Option und beendete sich mit **Exit 9 — bevor eine einzige Prüfung lief**.

```
node: bad option: --."
##[error]Process completed with exit code 9
```

Betroffen: Runs `33652243129`, `33690118651`, `33714788318`, `33717074064`.

**Warum es niemandem auffiel:** Der Check färbte den Run bei Datenlücken bewusst
rot (Alarmweg für #417). Damit war „rot" mehrdeutig — ein Step, der in *jedem*
Run abbrach, sah aus wie ein funktionierender Alarm.

**Behoben** mit PR #444 (Auslagerung nach `scripts/data-health-check.js`).

**Nachfolge aus der Retrospektive:**
- PR #453 — Workflow-Linting. **Wichtig:** `actionlint`/`shellcheck` finden diese
  Fehlerklasse *nicht*. Nachgemessen gegen `9abdda2`: 48 Findings, kein einziges
  auf dem Bug. Der Apostroph ist für die Shell syntaktisch korrekt — aus einem
  String werden nur mehrere Wörter. Der Fehler ist semantisch. Deshalb der eigene
  Guard `scripts/lint-workflows.js` **zusätzlich** zu actionlint.
- PR #454 — Datenlücken melden per Issue statt per Exit-Code, damit „rot" wieder
  eindeutig „Defekt" heißt.
- PR #455 — `status.json` als Frische-Signal.

---

## 2026-08-12 bis 2026-08-31 — `testing` wurde viermal beim Release gelöscht

Bei aktivem „Automatically delete head branches" (Settings → General) löscht
GitHub nach dem Merge den **Head**-Branch. Bei einem Release-PR `testing → main`
ist `testing` selbst der Head — der Merge löscht ihn also mit.

Vorfälle: 2026-08-12 (PR #404), zweimal am 2026-08-30 (PR #421, #424),
2026-08-31 (PR #427).

**Symptom, an dem man es zuerst merkt:** `git fetch origin testing` scheitert mit
`fatal: couldn't find remote ref testing`, während `git checkout -B <branch>
origin/testing` danach trotzdem „funktioniert" — es greift auf die veraltete
lokale Tracking-Ref zurück. Wer den Fetch-Fehler übergeht, baut seinen Branch auf
einem Stand auf, den es remote nicht mehr gibt.

**Gelöst seit 2026-08-31 (#428)**, beim Release am 2026-09-02 erstmals im
Ernstfall bestätigt: `testing` überlebte den Merge von PR #437.

**Die eigentliche Ursache war nicht ein fehlendes Ruleset.** `protect-testing`
existierte samt `deletion`-Regel seit dem 2026-08-04 — wirkungslos, weil ein
`bypass_actor` für die Repository-Admin-Rolle mit `bypass_mode: "always"` gesetzt
war. Admin-Merges umgingen die Regel **still**.

> **Lehre:** Eine aktive Regel beweist nichts. Immer zusätzlich die Bypass-Actors
> prüfen — eine Regel mit `bypass_mode: always` für die eigene Rolle ist
> Dekoration. Der belastbare Test ist ein echter Versuch, kein Blick ins UI.

---

## 2026-09-02 — Squash-only blockierte den Release (#438, #439)

Das Repo erlaubte lange nur „Squash and merge". Ein Squash verwirft den zweiten
Parent, deshalb wird `main` **nie** Vorfahre von `testing` — auch nach einem
erfolgreichen Sync-PR. Folge: Git sieht beidseitig angefasste Dateien
(`fetch.yml`, `CHANGELOG.md`, `CLAUDE.md`) als unabhängig geändert und meldet
**Phantom-Konflikte**, obwohl eine Seite die reine Obermenge ist.

**Symptome:** Der Release-PR steht auf `mergeable_state: "dirty"` und bekommt
**gar keine Checks** (`total_count: 0`) — kein CI-Defekt, sondern die Folge davon,
dass GitHub für einen konfliktbehafteten PR keinen mergebaren Ref hat. Zweites
Symptom: Der Diff zeigte **339 Dateien** statt der tatsächlichen **9**.

PR #438 wurde gesquasht → Ancestry weg, Release weiter blockiert. Erst PR #439 als
echter Merge-Commit löste es. Ist „Allow merge commits" deaktiviert, schlägt der
Merge mit **405 „Merge commits are not allowed on this repository"** fehl.

Am 2026-09-03 wiederholte sich der Fall (PR #448, als Merge-Commit gemergt).
Zentrale Abhilfe in #450.

---

## 2026-08-30 — Ein Fix auf `testing` blieb wirkungslos (#418)

`fetch.yml` läuft per `schedule`. GitHub liest bei `schedule`-Events **immer** die
Fassung vom Default-Branch (`main`), zusätzlich macht der Workflow
`checkout ref: main`. Ein nur auf `testing` gemergter Fix ändert daher **nichts**.

Am 2026-08-30 genau so passiert: Fix gemergt, alle Checks grün, Verhalten
unverändert — bis der Release-PR #421 durch war. Wiederholte sich bei #435 und
#445.

Die Regel und ihr Prüfbefehl stehen in `CLAUDE.md`.

---

## 2026-08-31 — `ren_share_forecast` liefert HTTP 200 mit leeren Arrays

```json
{"unix_seconds":[],"ren_share":[],...,"substitute":false,"deprecated":false}
```

Der **stumme** Ausfall und der gefährlichere: `curl -f` meldet Erfolg,
`JSON.parse` läuft durch, und der Guard `if (renewable.unix_seconds &&
renewable.ren_share)` passiert **sogar** — `[]` ist in JS truthy. Iteriert wird
über ein leeres Array, alle Werte werden `null`, der Workflow endet grün.

Beobachtet für DE, während `?country=at` gleichzeitig normale Daten lieferte —
der Ausfall ist länderspezifisch.

**Behoben** mit #435: `scripts/fetch-energy-charts.sh` validiert die Payload per
`jq` direkt nach dem Download und löscht die Datei nach dem letzten Fehlversuch,
damit der `fs.existsSync`-Guard greift.

Am selben Tag sichtbar geworden: Nur DE merged über
`scripts/merge-market-data.js` mit der bestehenden Datei; die sechs anderen
Länder überschreiben vollständig. NL/CH/FR/BE/DK standen auf 0
Erneuerbaren-Werten, DE dank Merge noch auf 651. Offen als **#425**.

---

## 2026-09-02 — HTTP 429 auf `ren_share_forecast`, Run bleibt grün (#435)

Der Endpunkt antwortete mit Rate-Limit; der Workflow lief **grün** durch, die App
zeigte trotzdem 10 Stunden lang „Erneuerbare: --". Drei Ursachen, drei
Gegenmaßnahmen — alle in #435 umgesetzt und in `CLAUDE.md` als Konvention
festgehalten (Backoff mit `Retry-After`, 6 Cron-Slots mit datenbasiertem Gate,
Health-Check).

Die Commit-Message-Heuristik aus #406 (`grep -Eq "@ ${TODAY}T(1[3-9]) UTC"`) hätte
in diesem Fall den Fallback fälschlich übersprungen: Sie prüfte nur, *ob*
committet wurde, nicht *ob Daten fehlen*. Ersetzt durch das datenbasierte Gate.

---

## 2026-08 — CI-Laufzeit: Daten-Commits lösten volle App-Builds aus (#394, #400)

Jeder Fetch-Commit löste App-Build, Quality-Check und Security-Scan aus.

Vier Maßnahmen (Details als Konventionen in `CLAUDE.md`):

1. `paths-ignore: ['public/data/**']` in `ci-cd.yml` — **nur** am `push`-Trigger
2. `refresh-data` in `deploy-unified.yml` überspringt Daten-Commits (verhindert die
   Rückkopplung Deploy → Fetch → Deploy; gemessen ~10 statt ~3 Runs/Tag)
3. Deploy-Cron 1× statt 5× täglich
4. CodeQL von *Default Setup* auf *Advanced Setup* mit eigener `codeql.yml`

**Gemessene Wirkung** (3 Tage, 09.–11.08.): **~59,5 → ~18,6 min/Tag (≈ −69 %)**.
`fetch.yml` fiel auf ~3,9 Runs/Tag, `ci-cd.yml` hatte keinen einzigen
`Update marketdata.json`-Run mehr.

> **Fallstrick bei der CodeQL-Umstellung:** Der Wechsel Default→Advanced erzeugt in
> der GitHub-UI automatisch einen **eigenen Boilerplate-PR** (unveränderte
> Starter-Datei, direkt gegen `main`, ignoriert die `testing`-Konvention). Er
> kollidiert mit einem selbst erstellten `codeql.yml`-PR — den Boilerplate-PR als
> Duplikat schließen, nicht beide mergen. Außerdem Default Setup vor dem Merge
> deaktivieren, sonst laufen beide parallel.

---

## 2026-09-02 — Shallow Clone sieht aus wie umgeschriebene History

`fatal: refusing to merge unrelated histories` in einer Remote-Session bedeutet
**nicht**, dass die History umgeschrieben wurde. Remote-Sessions klonen flach;
`main` sieht dann aus, als hätte es ~60 Commits und einen „Root-Commit", der in
Wahrheit nur die shallow-Grenze ist. Darüber hinaus findet Git keinen gemeinsamen
Vorfahren.

**Niemals mit `--allow-unrelated-histories` darüber hinweggehen** — das erzeugte
am 2026-09-02 `add/add`-Konflikte über das halbe Repo (18 Dateien inkl.
`App.tsx`, `utils/translations.ts`, alle `marketdata.json`) und hätte bei naiver
Auflösung fremden Code überschrieben. Nach `git fetch --unshallow origin` blieben
**3 echte Konflikte statt 18**.

Ein *echter* fehlender gemeinsamer Vorfahre ist bislang nie aufgetreten.

---

## Wiederkehrend — transienter TLS-Fehler in `actions/deploy-pages@v4`

Vereinzelt schlägt `Creating Pages deployment` mit `HttpError: self-signed
certificate` fehl — auf **beiden** Versuchen (Erstversuch + eingebauter Retry aus
PR #378), da beide denselben Infra-Hänger auf GitHubs Seite treffen.

Kein Code-/Config-Fehler: Build-Schritte laufen sauber durch, nur der
`deploy-pages`-API-Call scheitert. Beobachtet am 2026-08-12 bei einem Push auf
`testing`, während zeitgleich derselbe Commit auf `main` erfolgreich deployte —
das bestätigt den Infra-Charakter.

**Abhilfe:** manuellen `workflow_dispatch`-Lauf anstoßen. `rerun_failed_jobs` über
die API schlägt mit **403 „Resource not accessible by integration"** fehl. Ein
manueller Dispatch ist ein *neuer* Run — der rote Eintrag bleibt in der Historie
stehen, das ist kein weiteres Problem.

---

## 2026-08 — Security-Audit: `keystore/keystores.md` in der Git-History

Die Datei bleibt über `git show 98b1d6e15:keystore/keystores.md` erreichbar,
enthielt aber **nie echte Credentials** — nur Platzhalter (`[in
credentials.json]`), den öffentlichen Signing-Cert-Fingerprint (MD5/SHA1/SHA256)
und den Key-Alias.

Ein Zertifikats-Fingerprint ist ein Hash des öffentlichen Schlüssels, **kein
Secret**: aus jedem veröffentlichten APK extrahierbar und für Digital Asset Links
ohnehin öffentlich zu publizieren.

Ein `git filter-repo`-Rewrite wurde bewusst **nicht** durchgeführt — er würde alle
nachfolgenden Commit-SHAs, Tags und PR/Issue-Referenzen brechen; der Impact steht
in keinem Verhältnis zum Risiko. `keystore/KEYSTORE_BACKUP_GUIDE.md` (ebenfalls
nur Platzhalter) wurde aus dem Tracking entfernt, weil sie der
`.gitignore`-Policy widersprach.

---

## 2026-09-08 — Erneuerbaren-Ausfall in der UI kaschiert statt angezeigt (#473)

Am 08.09.2026 fehlten die nationalen `ren_share_forecast`-Werte für den
gesamten laufenden Tag (letzter Punkt: 07.09., 23:45 Berlin; erst der Lauf
um 15:34 UTC brachte sie zurück). Kein neuer Ausfallmechanismus — derselbe
stumme Fall aus [„`ren_share_forecast` liefert HTTP 200 mit leeren
Arrays"](#2026-08-31--ren_share_forecast-liefert-http-200-mit-leeren-arrays)
oben —, aber diesmal fiel er nicht am Data-Health-Check auf (der lief
korrekt), sondern an drei gleichzeitigen Fehlanzeigen in der App:

1. **`Tages-Ø 0.0 %` war eine erfundene Zahl.** `calculateMetrics` gab bei
   null Datenpunkten `0` statt `null` zurück — „keine Daten" las sich als
   „keine Erneuerbaren im Netz".
2. **Die Ø-Linie im Chart kaschierte den Ausfall.** Sie mittelt über das
   gesamte Chart-Fenster, unabhängig vom Tag — hier über 28 verbliebene
   Punkte vom Vorabend (Ø 46,1 %), gezogen über zwei Tage und angezeigt als
   plausible „Ø 45.0 %". Ein Nutzer, der Preis- und Renewable-Chart
   nebeneinander sieht, hat keinen Grund, an der Zahl zu zweifeln.
3. **Ein gültiger Wert lag vor und wurde weggeworfen.** Die regionale
   Signal-API (live via Cloudflare Worker) war unabhängig von der
   nationalen Quelle gesund und lieferte weiterhin Werte für die zuletzt
   gesetzte PLZ — sichtbar als gestrichelte Linie im Chart —, floss aber in
   keine Kennzahl ein.

**Fix (PR #473):** `today.renewable.{avg,min,max}` sind jetzt
`number | null` statt `0`-bei-Fehlen; die Ø-Linie im Chart erscheint nur
noch bei ≥ 50 % Abdeckung im Fenster, sonst ein expliziter
Abdeckungshinweis; und `renewableShareRegional` dient jetzt als
Kachel-Fallback, wenn der nationale Wert für heute komplett fehlt — immer
sichtbar als Ortswert markiert (eigene PLZ, sonst ein Ersatzort aus der
Country-Registry, DE: Berlin), nie als Bundeswert, da die Streuung
zwischen Netzregionen regelmäßig über Faktor 2 liegt. Details und Code-Ort
in `CLAUDE.md` unter „Chart Components".

**Verallgemeinerbare Lehre:** Ein grüner Data-Health-Check bedeutet nicht,
dass die UI den Ausfall auch ehrlich zeigt — die beiden Prüfungen sind
unabhängig. Bei jeder neuen aggregierten Kennzahl (Ø/Min/Max über mehrere
Punkte) gilt: fehlende Daten sind `null`, nie `0`; ein Mittelwert über ein
Fenster mit Lücken braucht eine Abdeckungs-Schwelle, sonst suggeriert er
Vollständigkeit, die nicht da ist.

---

## 2026-09-08 — `eslint.config.mjs`: Testblock ohne eigene Plugin-Registrierung crashte `npm run lint` (#474)

`npm run lint` schlug mit `could not find plugin "@typescript-eslint"` fehl
— nicht als einzelnes Finding, sondern als Crash des **gesamten** Laufs.

**Ursache:** Der Flat-Config-Block für Testdateien
(`**/__tests__/**`, `**/*.test.ts(x)`) setzt
`@typescript-eslint/no-explicit-any` und `@typescript-eslint/no-non-null-assertion`,
registriert das Plugin selbst aber nicht. Für `.ts`/`.tsx`-Testdateien fiel
das nie auf, weil ESLints Flat-Config für eine Datei alle passenden
Config-Objekte mergt — der TS/TSX-Basis-Block (der `@typescript-eslint`
registriert) matcht über seine eigenen `files`-Globs zusätzlich. Die drei
Dateien `scripts/__tests__/{data-health-check,lint-workflows,write-status}.test.js`
sind aber `.js`, erreichen den Basis-Block nicht, landen nur im Testblock —
und crashten damit den kompletten Lauf über `"**/*.{ts,tsx}" "scripts/**/*.js"`.

**Warum es monatelang unbemerkt blieb:** `ci-cd.yml` triggert den Lint-Job
nur auf PRs gegen `main` (siehe „Checks je Ziel-Branch" in `CLAUDE.md`); ein
`testing`-PR hat nur `review-gate` + `mergeability`. Der Pre-Commit-Hook
läuft über `lint-staged`, das ESLint **pro Datei** mit `--fix` aufruft — nie
die volle `scripts/**/*.js`-Menge auf einmal, also nie in der Konstellation,
die den Crash auslöst. Erst ein manuelles `npm run lint` deckte es auf.

**Fix (PR #474):** Plugin zusätzlich im Testblock registriert, +6 Zeilen.

**Verallgemeinerbare Lehre:** In ESLint Flat-Config braucht **jeder**
Config-Block, der eine `<plugin>/<rule>` setzt, dieses Plugin in seinem
eigenen `plugins`-Objekt — man kann sich nicht darauf verlassen, dass ein
anderer Block für dieselben Dateien matcht und es „mitbringt". Nach jeder
Änderung an `eslint.config.mjs`: `npm run lint` gegen den vollen Scope
laufen lassen, nicht nur gegen einzelne geänderte Dateien.

---

## 2026-09-09 — Tägliche Renewable-Lücke direkt nach Mitternacht ist kein Einzelfall (#481)

Nutzer-Meldung: „Ab heute Nacht 0:00 sind keine Daten für den Share
verfügbar." Vermutung war zunächst, der Berlin-Ortswert-Fallback aus PR
#473 hänge noch auf `testing` fest.

**Befund:** Der Fallback war längst auf `main` scharf — die eigentliche
Ursache lag woanders. Der erste Fetch-Lauf nach Mitternacht (03:00 UTC)
liefert für DE **fast täglich** 0 Erneuerbaren-Punkte für den neuen Tag:
Preise sind normal da (`source: energy-charts`, kein 429/5xx), aber Energy
Charts hat den `ren_share_forecast`-Wert für den neuen Tag zu dem
Zeitpunkt schlicht noch nicht veröffentlicht. Der
`data-health-check`-Alarm (#445) hat das an zwei aufeinanderfolgenden
Tagen korrekt erkannt und automatisch dokumentiert — beide Male mit
mehrstündiger Selbstheilung, nicht mit einem echten Fehler:

- #472 (08.09.): offen 03:07–15:34 UTC (~12,5h)
- #480 (09.09.): offen 03:08–09:06 UTC (~6h)

Der Fetch-Workflow blieb dabei korrekt grün (rot bedeutet seit #445
„Workflow defekt", nicht „Datenlücke") — das System funktionierte wie
vorgesehen, nur fehlte eine Einordnung, dass dieses Muster **normal und
wiederkehrend** ist, nicht ein einmaliger Vorfall.

**Fix (PR #483):**
1. Zwei zusätzliche gated Cron-Slots (04:00 + 05:00 UTC) zwischen dem
   Pflicht-Nachtlauf und dem bisher ersten bedingten Slot (06:00 UTC) —
   verkürzt die Erkennungslücke von bis zu 6–12,5h auf ~1h, fast
   kostenneutral über das bestehende Gate.
2. `RenewableBarChart` überbrückt fehlende nationale Balken jetzt mit
   einem visuell klar abgesetzten Ortswert-Ersatzbalken (gestrichelter
   Rahmen, eigene Legende/Tooltip), zusätzlich zur bereits bestehenden
   KPI-Kachel-Überbrückung aus PR #473. Details in `CLAUDE.md` unter
   „Chart Components".

**Verallgemeinerbare Lehre:** Ein automatisierter Alarm, der zuverlässig
öffnet und sich zuverlässig wieder schließt, wird leicht für „erledigt"
gehalten — dabei kann dasselbe Muster jeden Tag zur selben Zeit erneut
auftreten. Bei einer Nutzermeldung zu einem bereits bekannten
Alarm-Pattern zuerst `list_issues`/`search_issues` nach dem zugehörigen
Label (hier `data-health`) prüfen, bevor man eine neue Ursache vermutet.

> ⚠️ **Nachtrag vom 2026-09-10:** Die hier notierte Ursache („Energy Charts
> veröffentlicht den Wert für den neuen Tag verzögert") war **unvollständig**
> und für die eigentliche Beschwerde die falsche Fährte. Sie erklärt nur die
> Morgenlücke; die dauerhafte Lücke für *morgen* hatte eine ganz andere
> Ursache — siehe den nächsten Eintrag (#487).

---

## 2026-09-10 — Das Gate verwarf die Morgen-Prognose täglich (#487)

Nutzer-Meldung: Das Chart zeigt für morgen Preise und eine regionale
Erneuerbaren-Kurve, aber **keine nationalen** Erneuerbaren-Werte — und der
Ortswert-Fallback aus #473/#483 greift auch nicht.

**Messung statt Vermutung.** Der Vortag hatte die Ursache in der Upstream-API
vermutet. Live abgefragt am 2026-09-10 gegen 19:15 UTC:

| Quelle | Fenster | Punkte |
|---|---|---|
| `ren_share_forecast?country=de` | 10.09. 00:00 – **11.09. 23:45** Berlin | **192** |
| `signal?postal_code=14612` | 10.09. 00:00 – 11.09. 23:45 Berlin | 192 |
| `public/data/marketdata.json` (main) | Renewable nur bis **10.09. 23:45** | 707 |

Die API lieferte volle 48 h. Die zweite Hälfte kam nie an — der Verlust lag
also im eigenen Repo, nicht upstream.

**Ursache.** Job-Log des Pflicht-Laufs um 13:04 UTC:

```
- Price points: 96
- Renewable points: 96
- Points with renewable only (for tomorrow): 0
```

Um 13 UTC hat `ren_share_forecast` tatsächlich erst 96 Punkte (nur heute); die
Preise für morgen stammen an dieser Stelle aus aWATTar und tragen per Design
`renewable_share: null`. Später erweitert Energy Charts die Prognose auf 192
Punkte — und genau die Läufe, die das holen würden (16/19 UTC), blockte das
Gate:

```
- keine Verbesserung gegenueber der committeten Datei
Gate-Entscheidung fuer 19:00 UTC: run-fetch=false
```

Beide Gate-Kriterien konnten die Lücke prinzipiell nicht sehen:

```js
if (apiMaxMs > fileMaxMs)         // Datei reichte via aWATTar bereits weiter -> false
if (apiRenToday > fileRenToday)   // zählte nur HEUTE, 96 vs. 96          -> false
```

**Es war eine selbstverschuldete Regression.** Vor dem Gate (#435) liefen die
Abend-Slots unbedingt durch; die Git-History von `marketdata.json` belegt es:
Lauf am 31.08. um 22:26 UTC, Preise bis 01.09. 21:45, Renewable bis 01.09.
21:45 — Delta 0 h. Das Gate wurde gebaut, um Lücken zu schließen, und hat dabei
genau die Läufe abgeschaltet, die die Zukunftsdaten holten.

**Fix (#487/PR #488):** Kriterium (b) vergleicht Zeitstempel über das gesamte
API-Fenster statt Punkte pro Kalendertag. Die Logik liegt jetzt in
`scripts/gate-decision.js` mit Unit-Tests. Gegen den realen Datenstand
verifiziert: alte Logik `false`, neue `true` mit 96 fehlenden Punkten.

**Verallgemeinerbare Lehren:**

1. **Ein Gate, das entscheidet, *ob* Daten geholt werden, muss dieselbe Frage
   stellen wie die Prüfung, die die Lücke erkennt.** Fragen sie
   Unterschiedliches, blockiert das Gate genau die Läufe, die die Lücke
   schließen würden — und zwar lautlos, mit grünem Workflow.
2. **„Für heute (Europe/Berlin)" ist der falsche Maßstab, sobald die UI ein
   48-h-Fenster zeigt.** Derselbe Bias steckte gleichzeitig in vier Schichten:
   Gate, `data-health-check.js`, `metrics.today` und dem daran hängenden
   Fallback. Jede war einzeln gegen ein „heute"-Symptom gebaut worden, keine
   kannte das Fenster, das der Nutzer tatsächlich sieht.
3. **Job-Logs vor Hypothesen.** Zwei Tage lang wurde die Ursache upstream
   vermutet und diese Vermutung aus den committeten Daten „bestätigt". Die eine
   Zeile `- Renewable points: 96` im Job-Log hätte sie sofort widerlegt. Bei
   „Daten fehlen" gilt die Reihenfolge: erst messen, was die API **jetzt**
   liefert, dann was der Job-Log sagt, erst dann eine Ursache formulieren.
4. **Ein Fix, der nur auf `testing` liegt, ist kein Fix.** `fetch.yml` wird
   ausschließlich vom Default-Branch gelesen (bereits viermal passiert: #418,
   #435, #445, #483).
