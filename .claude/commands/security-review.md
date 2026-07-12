# Security Review (Cross-Project)

Globaler Security-Scan über alle lokalen Projekte mit konsolidiertem Report (Issue #7).

> **Ablageort:** global unter `~/.claude/commands/security-review.md`, nicht pro Projekt.
> Begründung: scannt projektübergreifend, gehört nicht in ein einzelnes Repo.

## Ziel
Alle lokalen Projekt-Repositories auf Secrets, Fingerprints, getrackte sensible Dateien
und Gitignore-Lücken prüfen – ein zusammengefasster Bericht statt sieben Einzelläufe.

## Workflow

### 1. Projekte ermitteln
- Bestimme die zu prüfenden Repos (Standard: alle App-Projekte im Workspace).
- Pro Repo: ist es ein Git-Repo? Aktueller Branch? Uncommitted Changes?

### 2. Pro Projekt scannen
Für jedes Repo dieselben Checks (entsprechen `reusable-security-scan.yml`):

- **Signing-Fingerprints** (SHA1/SHA256 Colon-Hex):
  ```bash
  git -C "$repo" grep -nE '([0-9A-Fa-f]{2}:){15,}[0-9A-Fa-f]{2}' -- . ':!*.lock'
  ```
- **Hardcodierte API-Keys / Tokens:**
  ```bash
  git -C "$repo" grep -niE '(api[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token)["'\'' ]*[:=]["'\'' ]*[A-Za-z0-9_-]{16,}' -- . ':!*.lock'
  ```
- **Getrackte sensible Dateien:** (nur konventionell-geheime .env – nicht committete `.env.<environment>`-Config)
  ```bash
  git -C "$repo" ls-files | grep -E '(credentials\.json$|\.jks$|\.keystore$|\.p12$|\.p8$|(^|/)\.env(\.local)?$|(^|/)\.env\.[^/]*\.local$)'
  ```
- **Gitignore-Pflichteinträge** vorhanden? (`.env`, `.env.local`, `credentials.json`, `*.jks`, `*.keystore`, `*.p12`, `*.p8`, `docs/private/`) – deckungsgleich mit `reusable-gitignore-audit.yml`. `.env.<environment>` mit reiner Public-Config ist erlaubt.
- **`docs/private/` nicht getrackt?**
- **`npm audit`** (falls `package.json` vorhanden) – Vulnerabilities zählen.

### 3. Befunde einordnen
- Bekannte False Positives kennzeichnen (z.B. CrUX-Demo-Key in `@react-native/debugger-frontend`).
- Severity zuordnen: 🔴 Secret/Fingerprint getrackt · 🟡 Gitignore-Lücke · 🟢 nur Hinweis.

### 4. Konsolidierter Report
Tabelle über alle Projekte:

| Projekt | Fingerprints | Secrets | Sensible Dateien | Gitignore | npm audit |
|---|---|---|---|---|---|
| ... | ✅/❌ | ✅/❌ | ✅/❌ | ✅/⚠️ | 0 / N |

- Anschließend priorisierte Handlungsempfehlungen (kritischste zuerst).
- Nichts automatisch ändern – nur berichten und Fixes vorschlagen.

## Sicherheitschecks
- **Niemals** gefundene Secrets im Klartext in Commits/Issues/Logs ausgeben – nur Datei + Zeile.
- Bei echtem Leak: sofort als kritisch markieren, Rotation + History-Bereinigung empfehlen.

## Best Practices
✅ Regelmäßig laufen lassen (z.B. wöchentlich, ergänzend zu `weekly-audit.yml`).
✅ Public-Repos strenger behandeln (alle Workspace-Projekte sind öffentlich).
❌ Keine destruktiven Aktionen ohne Rückfrage (kein `git filter-repo` etc. automatisch).
