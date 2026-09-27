# Git & Workflow Details

Ausführliche Begründungen und Befehle zu den Kernregeln in
[`CLAUDE.md`](../CLAUDE.md). Vorfalls-Historie mit Zeitstempeln/PR-Nummern:
[`private/INCIDENTS.md`](private/INCIDENTS.md) (gitignored, lokal).

## Branch Strategy & PR Workflow

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

> ⚠️ **`fatal: refusing to merge unrelated histories` = shallow clone**, nicht
> umgeschriebene History. **Niemals `--allow-unrelated-histories`** verwenden:
> ```bash
> git rev-parse --is-shallow-repository   # true = genau dieser Fall
> git fetch --unshallow origin
> ```

## Dependabot-PRs: gruppierte Sammel-Bumps gegen `testing` — dort läuft KEIN Lint/Test

`.github/dependabot.yml` bündelt **alle** Updates pro Ökosystem monatlich in
je einem Gruppen-PR gegen `testing` (`npm-all`, `actions-all`) — **ohne**
`update-types`-Filter, Majors also inklusive. Da Ziel-Branch `testing` ist,
greift „Checks je Ziel-Branch" unten ungebremst: nur `review-gate` +
`mergeability`, **kein** Lint, kein `tsc --noEmit`, keine Tests, kein Build.
Ein grüner Dependabot-Gruppen-PR sagt über Kompatibilität nichts aus.

**Regel:** Vor dem Mergen eines Dependabot-Gruppen-PRs (Branch-Muster
`dependabot/.../testing/<gruppe>-...`) **immer lokal** gegen den PR-Branch
prüfen: `npm ci` (**ohne** `--legacy-peer-deps`, sonst wird ein
ERESOLVE-Konflikt stillschweigend übertüncht), `npx tsc --noEmit`,
`npm run lint`, `npm run test:coverage`. Bei einem Major-Sprung in
`typescript`, `eslint` oder einer Testing-Library immer zuerst prüfen, ob
die jeweiligen Plugin-/Peer-Pakete (`@typescript-eslint/*`,
`eslint-plugin-*`) bereits eine kompatible Version unterstützen, bevor
gemergt wird.

> ⚠️ **Ausnahme:** GitHub-eigene Security-Alert-PRs (einzelne CVE-Fixes,
> nicht die gruppierten Sammel-Bumps) **ignorieren `target-branch`** laut
> Kommentar in `dependabot.yml` und landen weiterhin direkt gegen `main` —
> dort greifen alle ~15 `ci-cd.yml`-Checks und die reguläre
> `main`-Freigabepflicht. Beobachtet wurde, dass solche PRs über die
> GitHub-API auch ohne `--admin`/Approval durchmergen — nicht als Freibrief
> für menschliche PRs missverstehen, nicht verifiziert.

## Merge-Gate: `review-gate` kommt von `mergeability.yml`

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

## Versions-Bump ist kein Automatismus

Ein Versions-Bump nach einem Feature-PR ist keine Selbstverständlichkeit —
mehrere Releases liefen bereits ohne, mit `[Unreleased]`-Rest, der wochenlang
liegen blieb. Die Prüfbefehle unten gehören deshalb als letzter Schritt in
**jeden** PR, der einen `[Unreleased]`-Eintrag setzt, nicht erst ins
Release-PR-Ritual.

**Vor jedem Release-PR `testing → main` (und nach jedem `[Unreleased]`-Eintrag) prüfen:**
```bash
git show origin/main:app.json | grep -E '"version"|versionCode'
git show origin/testing:CHANGELOG.md | grep -n '^## \['
```
Steht unter `## [Unreleased]` etwas User-Relevantes, gehört ein Versions-Bump
(`package.json`, `app.json` `version`+`versionCode`, `App.tsx` `APP_VERSION`,
`package-lock.json`) **in denselben PR**, der nach `testing` geht — nicht erst
im Release-PR nach `main` nachgezogen.

## Release-PRs testing → main

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

> ⚠️ **`github-actions[bot]` ist in Rulesets NICHT als Bypass-Actor wählbar.**
> GitHub lässt das prinzipiell nicht zu. Wählbar sind Rollen, Teams, installierte
> GitHub Apps und **Deploy Keys**. Wer danach im UI sucht, sucht vergeblich.

## Git-Operationen aus der Remote-Execution-Umgebung

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

## Sicherheitshinweis: MCP-Token und KI-gesteuerte Pushes

- MCP-GitHub-Token mit **minimalen Scopes** (empfohlen: `repo` ohne `admin`)
- KI-gesteuerte Direktpushes auf `main`/`testing` bergen dieselben Risiken wie
  manuelle Force-Pushes — im Zweifel den PR-Weg nehmen
- Nach MCP-Push-Sitzungen das **Audit-Log** prüfen (Settings → Audit log)

## Deploy (Unified): transienter TLS-Fehler in `actions/deploy-pages@v4`

Vereinzelt schlägt `Creating Pages deployment` mit `HttpError: self-signed
certificate` fehl — kein Code-/Config-Fehler im Repo. Abhilfe: manuellen
`workflow_dispatch`-Lauf anstoßen (`rerun_failed_jobs` scheitert an den
Token-Scopes).
