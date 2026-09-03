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
