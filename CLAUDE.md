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
- [Architecture](docs/ARCHITECTURE.md) - System architecture and data flow
- [Git & Workflow Details](docs/GIT-WORKFLOW.md) - Ausführliche Begründungen zu den Kernregeln unten
- [Data Merge Strategy](docs/DATA-MERGE-STRATEGY.md) - How data from multiple sources is combined
- [Changelog](CHANGELOG.md) - Version history
- [Vorfallsarchiv](docs/private/INCIDENTS.md) - Chronik der Betriebsvorfälle (gitignored, lokal)
- [Build Guide](docs/BUILD.md) - Build and deployment instructions
- [Privacy Policy](PRIVACY_POLICY.md) - Data privacy information
- [Store Description](docs/STORE_DESCRIPTION.md) - Play Store listing text

## Workflow & Git Management

**Gilt für ALLE Änderungen, sofern nicht ausdrücklich anders gesagt.**
Vollständige Begründungen, Befehle und Konfliktlösung:
[`docs/GIT-WORKFLOW.md`](docs/GIT-WORKFLOW.md).

1. **Immer einen PR**, Ziel-Branch **immer `testing`** — nie direkt auf `main`/`staging`.
2. **In Remote-Sessions zuerst umbranchen:** `git fetch origin testing && git checkout -B <branch> origin/testing`.
3. **Sync-PR `main → testing` als „Create a merge commit" mergen, nie Squash.**
4. **Dependabot-Gruppen-PRs gegen `testing` laufen ohne Lint/Test/Build** — vor
   dem Mergen immer lokal `npm ci` (ohne `--legacy-peer-deps`), `tsc --noEmit`,
   `lint`, `test:coverage` gegen den PR-Branch prüfen.
5. **`review-gate`** (`mergeability.yml`) prüft nur Konfliktfreiheit/Ziel-Branch,
   **kein** Code-Review. KI-Review: `/review` oder Label `ai-review`.
   PRs gegen `testing` haben nur 2 Checks, gegen `main` ~15 — das ist kein Defekt.
6. **Versions-Bump gehört in denselben PR** wie ein `[Unreleased]`-Eintrag,
   nicht erst ins Release-PR (Prüfbefehle: siehe `docs/GIT-WORKFLOW.md`).
7. **Release-PR `testing → main`:** `gh pr merge <nr> --squash --admin` (KEIN
   `--delete-branch`), **nur mit ausdrücklicher schriftlicher Freigabe**.
8. **Feature-Branch-Pushes funktionieren aus Remote-Sessions**, `testing`/`main`
   lehnt das Ruleset ab (GH013 = „nimm den PR-Weg", kein Auth-Fehler). Branches
   löschen ist aus dieser Umgebung nicht möglich (Details: `docs/GIT-WORKFLOW.md`).

### CI-Laufzeit & `fetch.yml`-Resilienz

Daten-Commits sind bewusst vom App-Build entkoppelt. `fetch.yml` hat mehrere
Resilienz-Konventionen (Backoff/Retry-After, datenbasiertes Cron-Gate, Data
Health Check, Fallstricke der Datenquelle) — **nicht zurückbauen, sieht nach
Redundanz aus und ist es nicht**. Details, Diagnose-Reihenfolge:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#fetchyml-resilienz-konventionen-nicht-zurückbauen).

**Workflow-Semantik:** `push` liest die Workflow-Datei des gepushten Branches,
`schedule` immer den Default-Branch (`main`) — jede Zeile, nicht nur `on:`.
Ein Fix nur auf `testing` ist für `fetch.yml` wirkungslos, bis er nach `main`
released ist. Prüfen: `git show origin/main:.github/workflows/fetch.yml | grep -c "<neues-Element>"`.

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

### `eslint.config.mjs`: Jeder matchende Flat-Config-Block braucht sein eigenes Plugin

**Regel:** Ein Config-Block, der eine `<plugin>/<rule>` setzt, muss dieses
Plugin selbst in seinem eigenen `plugins`-Objekt registrieren — auch wenn ein
anderer Block im selben File es bereits registriert. Man kann sich nicht
darauf verlassen, dass ein anderer Block für **dieselben** Dateien matcht,
sonst crasht `npm run lint` für den gesamten Lauf, sobald eine Datei nur den
unvollständigen Block trifft. Nach jeder Änderung an `eslint.config.mjs`
deshalb **immer** `npm run lint` lokal gegen den vollen Scope laufen lassen,
nicht nur gegen einzelne geänderte Dateien — der `testing`-Lint-Job und der
Pre-Commit-Hook (`lint-staged`, pro Datei) decken diese Fehlerklasse nicht auf.
→ [`docs/private/INCIDENTS.md`](docs/private/INCIDENTS.md#2026-09-08--eslintconfigmjs-testblock-ohne-eigene-plugin-registrierung-crashte-npm-run-lint-474)

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

4. **Chart Components (components/charts/):** Custom SVG charts
   (react-native-svg), shared building blocks in `components/charts/shared/`,
   Zoom/Fallback-Logik für fehlende Erneuerbaren-Daten (Ortswert-Fallback,
   Ausfall-Kaschierung durch Fenster-Ø). Details:
   [`docs/ARCHITECTURE.md#11-chart-components--renewable-fallbacks`](docs/ARCHITECTURE.md#11-chart-components--renewable-fallbacks).

5. **Historical Data (`services/historicalDataStore.ts`):** Device-Cache
   als primäre Quelle, Server-Fallback, Hourly-Pre-Aggregation, Period
   Comparison. Details:
   [`docs/ARCHITECTURE.md#11b-historical-data-serviceshistoricaldatastorets`](docs/ARCHITECTURE.md#11b-historical-data-serviceshistoricaldatastorets).

6. **Multi-Country (`utils/countries.ts`):** Country Registry als Single
   Source of Truth, BETA-Länder ohne PLZ/aWATTar, country-aware Datenladen
   mit scoped In-flight-Dedup. Details:
   [`docs/ARCHITECTURE.md#12-multi-country-architektur-utilscountriests`](docs/ARCHITECTURE.md#12-multi-country-architektur-utilscountriests).

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
- **RESOLVED (Security-Audit, Aug 2026):** `keystore/keystores.md` ist in der Git-History erreichbar, enthielt aber nie echte Credentials — nur Platzhalter und den **öffentlichen** Signing-Cert-Fingerprint (kein Secret). Ein `filter-repo`-Rewrite wurde bewusst **nicht** durchgeführt. → [`docs/private/INCIDENTS.md`](docs/private/INCIDENTS.md#2026-08--security-audit-keystorekeystoresmd-in-der-git-history)
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

Modulstruktur (Komponenten/utils/services-Baum) und Data-Flow-Diagramm:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#module-structure-aktuell).

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
