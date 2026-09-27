# Architecture - Energy Price Germany

## Project Overview

Energy Price Germany is a cross-platform React Native/Expo application for visualizing energy market prices and renewable energy share in Germany. It combines multiple data sources to provide comprehensive forecasts and supports offline-first functionality.

---

## System Architecture

### 1. Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Energy Charts API (Primary)          aWATTar API (Backup)  │
│  • 15-min resolution                  • 48h+ coverage       │
│  • ~24h forecast                      • Day-ahead prices    │
│  • Renewable share data               • Interpolated data   │
│                                                              │
│  Energy Charts Signal API (Regional)                        │
│  • Renewable share by postal code (PLZ)                    │
│  • 15-min resolution                                        │
│  • Live regional grid data                                  │
│                                                              │
└──────────────────┬──────────────────┬──────────────────────┘
                   │                  │
                   └──────┬───────────┘
                          │
                   ┌──────▼────────┐
                   │ Merge Strategy│
                   │ (if gap ≥ 3h) │
                   └──────┬────────┘
                          │
                   ┌──────▼──────────┐
                   │ National Data   │
                   │ (43+ hours)     │
                   └──────┬──────────┘
                          │
            ┌─────────────┴──────────────┬──────────────────┐
            │                            │                  │
    ┌───────▼────────┐        ┌─────────▼────────┐        │
    │ Regional Data  │        │ GitHub Pages     │        │
    │ Fetch (if PLZ) │        │ (Deployment)     │        │
    └───────┬────────┘        └──────────────────┘        │
            │                                              │
    ┌───────▼────────────┐                   ┌────────────▼─────┐
    │ Merged National +  │                   │ Local Storage    │
    │ Regional Dataset   │                   │ (Offline Cache)  │
    └────────────────────┘                   └──────────────────┘
```

**Merge Algorithm:**
1. Fetch Energy Charts data (preferred source)
2. Fetch aWATTar data (supplement/fallback)
3. If Energy Charts available:
   - Compare timestamps
   - If gap ≥ 3 hours: merge aWATTar continuation
   - Otherwise: use Energy Charts only
4. If Energy Charts unavailable: use aWATTar as fallback
5. Store merged dataset with source attribution
6. **Regional Data (Optional):**
   - If user provides postal code (PLZ), fetch from Energy Charts Signal API
   - Merge regional renewable share data by matching timestamps
   - Cache regional data for 15 minutes
   - Display both national and regional charts side-by-side

See [DATA-MERGE-STRATEGY.md](DATA-MERGE-STRATEGY.md) for detailed algorithm.

---

### 2. GitHub Actions Workflows

#### Fetch Workflow (`.github/workflows/fetch.yml`)
**Trigger:** Scheduled (hourly 3-22 UTC) + Manual dispatch

```
┌─────────────────────────────────────────────────────────┐
│ UPDATE JOB (fetch.yml)                                  │
├─────────────────────────────────────────────────────────┤
│ 1. Fetch from Energy Charts API                         │
│ 2. Fetch from aWATTar API                              │
│ 3. Merge data (hybrid strategy)                         │
│ 4. Compare with previous data                          │
│ 5. Git commit & push (if new data)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─────────────────────────────────┐
                     │ new_data = true                 │
                     │                                 │
        ┌────────────▼────────────┐                   │
        │ Git Push to main        │       new_data = false
        │ (marketdata.json)       │       │ (no changes)
        └────────────┬────────────┘       │
                     │                    │
                     └────────┬───────────┘
                              │
                    ┌─────────▼──────────────────┐
                    │ Push event triggers        │
                    │ deploy.yml automatically   │
                    └─────────┬──────────────────┘
                              │
        ┌─────────────────────┴──────────────────┐
        │                                        │
┌───────▼────────┐                    ┌─────────▼────────┐
│ BUILD JOB       │                    │ BUILD JOB        │
│ (deploy.yml)    │                    │ (deploy.yml)     │
├────────┬────────┤                    ├────────┬─────────┤
│ npm ci  │ npm   │                    │ npm ci │ npm     │
│         │ build │                    │        │ build   │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
┌────────▼───────────────┐            ┌────────▼──────────┐
│ DEPLOY JOB            │            │ DEPLOY JOB        │
│ (deploy.yml)          │            │ (deploy.yml)      │
├────────┬──────────────┤            ├────────┬──────────┤
│ Upload │ Deploy to GH │            │ Upload │ Deploy   │
│ artifact│ Pages       │            │ artifact│ to GH    │
└────────┬──────────────┘            │ Pages   │         │
         │                           └────────┬──────────┘
         │                                    │
         └────────────────┬───────────────────┘
                          │
                    ✅ GitHub Pages Updated
```

**Architecture Flow:**
1. **fetch.yml (data update)** → Fetches APIs, merges, commits to main
2. **GitHub detects push** → Automatically triggers deploy.yml
3. **deploy.yml (deployment)** → Builds and deploys to GitHub Pages

**Advantages:**
- ✅ Clean separation of concerns
- ✅ No race conditions from parallel jobs
- ✅ Standard GitHub workflow pattern
- ✅ Single source of truth for deployment logic (deploy.yml)
- ✅ Automatic retry handling by GitHub

> ⚠️ Das Diagramm oben ist der ursprüngliche Entwurf. Der tatsächliche Stand
> (8 Cron-Slots mit datenbasiertem Gate, `deploy-unified.yml`) steht im
> Abschnitt „`fetch.yml`: Resilienz-Konventionen" unten.

#### `fetch.yml`: Resilienz-Konventionen (nicht zurückbauen)

Alle Energy-Charts-Calls laufen über `scripts/fetch-energy-charts.sh
<country-code> <output-dir>`, das `<output-dir>/price_raw.json` und
`<output-dir>/renewable_raw.json` schreibt. Vertrag des Skripts:
- Exponentielles Backoff 5s/15s/45s, `Retry-After` wird respektiert (429/503,
  gedeckelt auf 60s).
- Retry-würdig: HTTP 429/5xx sowie curl-Exit 7, 28, 35, 52, 55, 56. Alles
  andere (DNS, URL-Fehler) bricht sofort ab.
- Payload-Validierung per `jq` nach jedem Download (`(.unix_seconds|length) >
  0 and (.ren_share|length) > 0`, analog `.price`); schlägt sie fehl, gilt
  der Versuch als Fehlschlag und wird wiederholt; nach dem letzten Versuch
  wird die Datei gelöscht, damit der `fs.existsSync(...)`-Guard im
  Process-Step greift statt stillschweigend `null`-Werte zu schreiben.
- `price` required (Exit ≠ 0), `ren_share_forecast` non-fatal in ALLEN
  Ländern (`|| true`) — ein Ausfall dieses einen Endpunkts darf die validen
  Day-Ahead-Preise nicht mit in den aWATTar-Fallback zwingen.
- `CURL_OPTS` existiert nur noch für den aWATTar-Call, nicht für
  Energy-Charts-Blöcke (vorher siebenfach dupliziert).

**Cron-Gate:** `- cron: '0 3,4,5,6,9,13,16,19 * * *'`. Nur 03 und 13 UTC
laufen unbedingt; die übrigen Slots gehen durch einen `gate`-Job, der den
~90s teuren `update`-Job nur startet, wenn `max(unix_seconds)` der API >
`max(start_timestamp)` der Datei ODER die Zahl der Punkte mit `ren_share !=
null` für heute (Europe/Berlin) zunimmt. Fehlt die Probe-Datei: fail open
(`run-fetch=true`). Das Gate-Kriterium ist zeitstempel-basiert, nicht
tagesbasiert — ein reines „heute"-Kriterium blockiert sonst legitime
Nachmittags-Updates für morgen (Details: `docs/private/INCIDENTS.md`).

**Commit-Erkennung** zählt zusätzlich die Erneuerbaren-Abdeckung (`$NEW_REN
-gt $OLD_REN`, nicht nur Zeitstempel-Differenz) — sonst verwirft ein
späterer erfolgreicher Energy-Charts-Lauf nach einem aWATTar-Fallback seine
eigenen frisch geholten Werte, weil der Zeitstempel gleich bleibt.

**Zwei Fallstricke der Datenquelle:**
- Der aWATTar-Fallback liefert per Design KEINE Erneuerbaren-Daten
  (`interpolateAwattarData()` setzt `renewable_share: null` hart). Symptom:
  Kachel „Erneuerbare jetzt" zeigt `--`, Preise wirken normal. Diagnose:
  `jq -r .source public/data/marketdata.json`.
- `ren_share_forecast` kann HTTP 200 mit leeren Arrays liefern (`[]` ist in
  JS truthy, der einfache Existenz-Guard greift nicht) — der stumme Ausfall.
  Guard sitzt in `fetch-energy-charts.sh` (s. o.). Offener Bug (#425): nur DE
  merged bestehende Daten (`scripts/merge-market-data.js`), die sechs
  anderen Länder überschreiben `marketdata.json` vollständig.

**`Data health check`** (`scripts/data-health-check.js`, letzter Step im
`update`-Job, `if: always()`) setzt bei 0 Punkten mit `renewable_share !=
null` für heute (DE) `::error::` + `exit 1` → GitHub verschickt die
Standard-„workflow run failed"-Mail. Nicht-fatal (`::warning::`, Run bleibt
grün): `source == "awattar"` für DE, sowie jedes Beta-Land mit 0
Erneuerbaren-Punkten. **Datenlücken färben den Run bewusst NICHT rot** —
der Befund geht stattdessen in ein automatisch verwaltetes Issue mit Label
`data-health`. Rot bedeutet ausschließlich „Workflow ist defekt".

⚠️ Kein Apostroph in `node -e '…'`-Inline-Blöcken (schließt den String
vorzeitig, Exit 9 vor jeder Prüfung, färbt jeden Run rot unabhängig von der
Datenlage). `actionlint`/`shellcheck` finden diese Fehlerklasse nicht.
Deshalb `npm run lint:workflows` als eigener Guard (CI-Job + Pre-Commit-Hook
sobald `.github/workflows/**` gestaged ist). Jede nennenswerte Logik gehört
in eine Datei unter `scripts/`, nicht in einen Inline-Block.

**Workflow-Semantik:** `push` wird aus der Workflow-Datei des gepushten
Branches gelesen, `schedule` immer aus dem Default-Branch (`main`) — jede
Zeile, nicht nur `on:`. Ein Fix, der nur auf `testing` liegt, ist für
`fetch.yml` vollständig wirkungslos, bis er nach `main` released ist.
Prüfbefehl: `git show origin/main:.github/workflows/fetch.yml | grep -c
"<neues-Element>"`.

**Diagnose-Reihenfolge bei „Website zeigt alte Daten":** Ein grüner Workflow
bedeutet nicht, dass Daten ankamen. (1) `jq -r .source
public/data/marketdata.json`, (2) Abdeckung statt Fehler prüfen (Punkte mit
`renewable_share != null`, nicht nur `max(start_timestamp)`), (3) Job-Log
„Renewable points: N" je Land, (4) erst dann `curl:`-Fehler in den Logs
suchen. `marketdata.json` ist ein rollierendes Fenster fester Größe — eine
sinkende Gesamtzahl ist NICHT automatisch Datenverlust, solange beide
Fenstergrenzen (min/max `start_timestamp`) mitgewandert sind. Maßgeblich ist
„Erneuerbaren-Punkte für heute (Europe/Berlin)", nicht die Gesamtzahl.

**CI-Laufzeit-Entkopplung** (Daten-Commits lösen keinen App-Build aus):
`ci-cd.yml` hat `paths-ignore: ['public/data/**']` nur am `push`-Trigger
(nicht am `pull_request`-Trigger, sonst fällt der Merge-Gate aus).
`deploy-unified.yml`s Job `refresh-data` überspringt Läufe, deren
Commit-Message mit `Update marketdata.json` beginnt (String-Vergleich, kein
Fehler bei Änderung — reaktiviert die Feedback-Schleife still). Cron 1×
täglich. CodeQL läuft über `.github/workflows/codeql.yml` (Advanced Setup),
sonst greift `paths-ignore` nicht. Kein `paths-ignore` in
`deploy-unified.yml` selbst — `public/data/**` gelangt ausschließlich über
den Deploy ins Pages-Artefakt.

#### Deploy Workflow (`.github/workflows/deploy-unified.yml`)

**Trigger:** Push to main, staging, or testing + Manual dispatch + Scheduled (6h for main)

**Unified Deployment for All Environments:**

- Single workflow für alle 3 Branches (main/staging/testing)
- Branch Detection Logic:
  - `main` → EXPO_ENV=production → Deploy zu `/`
  - `staging` → EXPO_ENV=staging → Deploy zu `/staging/`
  - `testing` → EXPO_ENV=testing → Deploy zu `/testing/`
- Smart Folder Management:
  - Production: Bewahrt staging/ und testing/ Folders
  - Staging/Testing: Updated nur eigene Folders
- No more sed injections! Environment aus .env Dateien geladen
- Performs: Build → Upload → Deploy to GitHub Pages

---

### 3. Application Architecture

#### Frontend Structure
```
dist/
├── index.html              (Entry point)
├── service-worker.js       (Offline support)
├── manifest.json           (PWA manifest)
├── data/
│   ├── marketdata.json     (Current forecast data)
│   └── archive/            (Historical data snapshots)
└── _expo/
    └── static/js/web/      (Built React components)
```

#### Module Structure (aktuell)
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
│       ├── useChartZoom.ts       # Pinch/scroll zoom hook
│       ├── ZoomResetBadge.tsx    # ⟲ reset control shown while zoomed
│       ├── chartScale.ts         # Shared coordinate math (scaleToX/scaleToY/getBarWidth/getBarHeight)
│       └── index.ts              # Barrel exports
├── settings/
│   ├── AppearanceSection.tsx     # Theme pill selector with spring animation
│   └── SettingsMenu.tsx          # Settings panel (slide-up/down animation; "Verlauf" entry)
├── customize/
│   └── HistoryCacheSection.tsx   # History cache size (MB) selector + "Cache leeren"
├── ui/
│   ├── Button.tsx                # Scale-spring on press
│   ├── SkeletonLoader.tsx        # Shimmer skeleton (LinearGradient + Reanimated)
│   ├── ChartSkeleton.tsx         # Chart loading placeholder
│   ├── Chip.tsx                  # Animated chip/badge element
│   └── Badge.tsx                 # Animated badge element
├── ChartDetailView.tsx           # Expandable detail modal with share button
├── CostCalculator.tsx            # Cost calculator logic
├── CostCalculatorView.tsx        # Full-screen cost calculator view
├── HistoricalDataView.tsx        # Full-screen history view: range select + charts + stats
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
├── historicalStats.ts    # Stats over EnergyData[] (avg/min/max/median/trend) + period comparison
├── dataAggregation.ts    # Bucket EnergyData[] hourly/daily for long ranges
└── designSystem.ts       # Design tokens

services/
├── energyDataManager.ts  # Data orchestration (fetch, cache, process)
├── regionalDataCache.ts  # Dual-layer regional cache (memory + persistent)
├── historicalDataStore.ts # Persistent per-day history in device cache
└── dataMerger.ts         # Regional-to-national data merge

scripts/
├── post-build.js         # Build post-processing
└── validate-release.sh   # Release validation
```

#### Legacy Module Structure (dist/, historisch)
```
js/modules/
├── storage.js              (Data persistence & offline queue)
├── ui.js                   (UI components & rendering)
├── offline-queue.js        (Offline operation queue)
├── drag-manager.js         (Touch/drag interaction)
└── notifications.js        (Toast notifications)
```

#### Data Flow (aktuell)
1. App mounts → Fetch Energy Charts data
2. Check coverage → Supplement with aWATTar if needed
3. User enters PLZ → Fetch regional data via Cloudflare
4. Merge all data → Display in charts
5. Cache in AsyncStorage for offline use
6. Record per-day snapshot into the historical store; the "Verlauf" view
   reads it back (with server fallback) for 24h/48h/7d/30d ranges + statistics

---

### 4. Data Model

#### Market Data Structure
```javascript
{
  "object": "list",
  "source": "energy-charts" | "awattar" | "mock",
  "data": [
    {
      "start_timestamp": 1698067800000,      // Unix ms
      "end_timestamp": 1698068700000,        // 15-min interval
      "marketprice": 89.5,                   // EUR/MWh
      "renewable_share": 42.3,               // % (null if from aWATTar)
      "unit": "Eur/MWh"
    },
    // ... more data points
  ]
}
```

#### Storage Model (IndexedDB)
```
Database: "energydb"
│
├── ObjectStore: "tasks" (if app extends to task management)
│   └── keyPath: "id"
│
└── ObjectStore: "offlineQueue" (Offline operation queue)
    ├── operation: "saveTask" | "updateTask" | "deleteTask"
    ├── functionBody: serialized async function
    ├── context: operation parameters
    └── maxRetries: number
```

---

### 5. Offline-First Architecture

#### Network State Detection
```javascript
// Browser API
window.navigator.onLine
window.addEventListener('online', callback)
window.addEventListener('offline', callback)
```

#### Sync Queue Pattern
```
User Action → Offline? → Queue Storage → Retry Loop
              ├─ Yes ──→ IndexedDB    → Exponential Backoff
              │         (persistent)    (1s, 2s, 4s)
              └─ No  ──→ Direct API Call
                        ↓
                    Success? ✅ / ❌
                        ├─ Yes → Remove from queue
                        └─ No  → Retry with backoff
```

#### UI Indicators
- **Offline Dot** (Red pulse): No network connection
- **Pending Dot** (Yellow pulse): Items waiting to sync
- **Syncing Spinner** (Rotating): Active synchronization
- **Pending Count**: Number of pending operations

---

### 6. Development Workflow

#### Local Development
```bash
# Start dev server with hot reload
npm start

# Web-specific dev server
npm run web

# Build for local testing
npm run build:local
npm run serve:local
# Open http://localhost:8080
```

#### Web Build Process
```
Source Code (TypeScript/JSX)
    ↓
Expo Export (--platform web)
    ↓
post-build.js Script
├─ Copy public/data → dist/data
├─ Copy service-worker.js
├─ Add .nojekyll for GitHub Pages
└─ Configure base href for subdirectory
    ↓
update-cache-version.js
├─ Generate cache buster token
└─ Update index.html version
    ↓
Distributable (dist/)
```

#### Web Deployment
```
Push to main/staging/testing
    ↓
GitHub Actions (deploy-unified.yml)
    ↓
GitHub Pages (gh-pages branch)
    ↓
Live: https://s540d.github.io/Energy_Price_Germany/
```

#### Android Build Process (lokal)
```
main Branch (aktuell)
    ↓
expo prebuild --platform android --clean
    ↓
/android (generiert, nicht in Git)
    ↓
Gradle bundleRelease (signiert mit lokalem Keystore)
├─ @devsven__Energy_Price_Germany.jks
└─ credentials.json (gitignored)
    ↓
android/app/build/outputs/bundle/release/app-release.aab
    ↓
Manueller Upload → Google Play Console
```

Siehe [BUILD.md](BUILD.md) für detaillierte Build-Anleitung.

---

### 7. Data Sources Integration

#### Energy Charts API
- **Endpoint**: https://api.energy-charts.info/
- **Data Points**:
  - `/price?country=de` - Market prices
  - `/ren_share_forecast?country=de` - Renewable forecasts
- **Resolution**: 15 minutes
- **Coverage**: ~24 hours ahead
- **Format**: Unix timestamps (seconds) + arrays

#### aWATTar API
- **Endpoint**: https://api.awattar.de/v1/marketdata
- **Data Points**: Day-ahead and future prices
- **Resolution**: Hourly (interpolated to 15-min)
- **Coverage**: 48+ hours
- **Format**: Unix timestamps (milliseconds) + array of objects

#### Energy Charts Signal API (Regional Data)
- **Endpoint**: https://api.energy-charts.info/signal?country=de&postal_code={PLZ}
- **Data Points**: Regional renewable energy share based on postal code
- **Resolution**: 15 minutes
- **Coverage**: Real-time and forecast data
- **Format**: Unix timestamps (seconds) + share percentage arrays
- **Cache**: 15-minute TTL per postal code
- **Usage**: Optional - user must provide 5-digit postal code in settings
- **Coverage**: 48+ hours

---

### Cloudflare Worker (CORS Proxy for Regional Data)

The application uses a **Cloudflare Worker** to enable regional data fetching from the Energy Charts Signal API.

#### Problem Solved
The Energy Charts Signal API (`/signal` endpoint) does **not include CORS headers**, which prevents direct browser access due to browser security policies. A proxy with CORS support is required.

#### Worker Architecture
```
Browser Request (with PLZ)
    ↓
Cloudflare Worker (/api/regional?plz=12345)
    ├─ 1. Check Cloudflare Cache (1 hour TTL)
    │   └─ Hit? Return cached response
    │
    ├─ 2. Fetch from Energy Charts API
    │   └─ GET https://api.energy-charts.info/signal?country=de&postal_code={plz}
    │
    ├─ 3. Add CORS Headers
    │   └─ Access-Control-Allow-Origin: *
    │
    ├─ 4. Set Cache Headers
    │   ├─ Browser: max-age=900s (15 minutes)
    │   └─ Cloudflare: s-maxage=3600s (1 hour)
    │
    └─ 5. Return Response to Browser
```

#### File Location
- **Worker Code**: `/cloudflare-worker.js`
- **Deployment**: Cloudflare Pages
- **Trigger**: HTTP GET requests to Cloudflare Pages function

#### Key Features
1. **Parameter Validation**: Requires `plz` query parameter (postal code)
2. **Dual-Layer Caching**:
   - Cloudflare Edge Cache: 1 hour (reduces upstream API calls)
   - Browser Cache: 15 minutes (reduces network requests)
3. **CORS Preflight Handling**: Responds to OPTIONS requests for CORS negotiation
4. **Error Handling**:
   - 400: Missing postal code parameter
   - 502: Upstream API error
   - 500: Worker error (network issues, JSON parsing, etc.)
5. **User-Agent Header**: Identifies requests as `EnergyPriceGermany-App/1.0`

#### Security & Privacy
- ✅ No authentication required (public data)
- ✅ No credentials stored in code
- ✅ CORS allows requests from any origin (safe for public data)
- ✅ User postal code only sent to Energy Charts API (via Worker proxy)
- ✅ No additional data collection or tracking

#### Deployment
The worker is deployed via GitHub Actions:
1. Cloudflare Pages project configured as `EnergyPriceGermany-Worker`
2. `cloudflare-worker.js` is the entry point
3. Accessible at Cloudflare Pages URL (configured in `energyDataManager.ts`)

---

#### Data Merge Strategy
See [DATA-MERGE-STRATEGY.md](DATA-MERGE-STRATEGY.md) for:
- Detailed merge algorithm
- Decision tree and scenarios
- Example data transformations
- Test cases

---

### 8. Cache & Version Management

#### Cache Busting Strategy
```javascript
// Version token updated on each build
const CACHE_VERSION = 1760823900018;  // Unix timestamp

// Applied to:
// - index.html <script> tags
// - Service worker cache names
// - Asset URLs when needed
```

#### Cache Layers
1. **HTTP Cache** - Browser standard HTTP caching
2. **Service Worker Cache** - Application shell caching
3. **Firestore Offline Persistence** - Local database cache
4. **IndexedDB** - Sync queue persistence

---

### 9. Error Handling

#### API Failure Scenarios
```
Primary API Fails
    ↓
Try Backup API
    ↓
Backup Success? ──Yes──→ Use with source attribution
    ↓ No
Use Mock Data
    ↓
Log Error & Notify User
```

#### Retry Strategy
```
Failed Operation
    ↓
Exponential Backoff: 1s → 2s → 4s
    ↓
Max Retries: 3
    ↓
Success? ──Yes──→ ✅ Complete
    ↓ No
❌ Store Error & Notify User
```

---

### 10. Dependencies

#### Production
- `react` / `react-native` - Core framework
- `expo` - Universal React applications
- `victory-native` - Charting library
- `react-native-svg` - SVG support
- `@react-native-async-storage/async-storage` - Local storage

#### Development
- `typescript` - Type safety
- `gh-pages` - GitHub Pages deployment
- Node.js scripts for build automation

---

### 11. Chart Components & Renewable Fallbacks

- **Pinch/scroll zoom:** alle drei Charts (+ `ChartDetailView`) über den
  shared `useChartZoom(viewportWidth)` Hook (`components/charts/shared/useChartZoom.ts`).
  `contentWidth` ersetzt `chartWidth` für internes x-Positions-Math, gewrappt
  in eine horizontale `ScrollView`; Y-Achsen-Labels bleiben bewusst
  *außerhalb* dieser ScrollView (pinned overlay). Web zoomt via `onWheel`,
  nativ via 2-touch `PanResponder` (kein `react-native-gesture-handler`).
  `ZoomResetBadge.tsx` zeigt ⟲ bei `isZoomed`. Tooltip-`x` muss durch
  `toViewportX()` vor `getTooltipLeft()`, sonst driftet er beim Scrollen.
- **Title overflow:** Title-Wrapper braucht `flex: 1` + `<Text>` braucht
  `numberOfLines={2}`/`ellipsizeMode="tail"`, sonst clippen lange Titel auf
  kleinen Screens statt zu umbrechen.
- **Ausfall-Kaschierung durch Fenster-Ø (PR #473):** `RenewableBarChart`s
  Ø-Linie mittelt über das gesamte Chart-Fenster, unabhängig vom Tag — bei
  geringer Tagesabdeckung kaschierte das einen Totalausfall mit einem
  plausiblen Ø. `avgValue` wird jetzt nur gezeichnet, wenn ≥
  `AVERAGE_MIN_COVERAGE_RATIO` (50%) der Punkte im Fenster einen Wert haben;
  darunter erscheint `labels.averageLowCoverage`. Bei jeder neuen
  Fenster-Statistik (Ø/Min/Max über mehrere Datenpunkte) diese
  Abdeckungs-Guard-Logik als Vorbild nehmen.
- **`0` statt `null` bei fehlenden Tageswerten ist eine Falschaussage:**
  `calculateMetrics` (`utils/metrics.ts`) gibt bei 0 heutigen
  Renewable-Datenpunkten `null` zurück, nicht `0` — „keine Daten" ≠ „keine
  Erneuerbaren im Netz". `today.renewable.{avg,min,max}` sind `number |
  null`; UI-Code muss `null` explizit auf `--`/`—` abbilden.
- **`renewableShareRegional` wird nur gezeichnet, in keiner Kennzahl
  ausgewertet.** National (`ren_share_forecast`) und regional (Signal API,
  live im Client) sind zwei unabhängige Quellen. `utils/renewableFallback.ts`
  (`resolveRenewableKpi`) nutzt den Regionalwert als Fallback für die Kachel
  „Erneuerbare jetzt" — **immer als Ortswert markiert**, nie als Bundeswert
  (Streuung zwischen Netzregionen oft > Faktor 2). Reihenfolge: eigene PLZ →
  `CountryConfig.fallbackPostalCode` (DE: Berlin, `10115`) → `--`. Nationale
  und Fallback-Werte werden nie gemischt.
- **Ortswert-Fallback auch im Chart** (nicht nur KPI-Kachel):
  `RenewableFallback.series` (Zeitstempel + Wert je heutigem Ortswert-Punkt)
  über die Prop `fallbackSeries`; für jeden Balken ohne nationalen Wert
  sucht `findFallbackValue()` (±20 Min Toleranz) einen Ersatzwert — visuell
  klar abgesetzt (gestrichelter Rahmen `FALLBACK_BAR_STROKE`, reduzierte
  Deckkraft, eigene Legende/Tooltip). Nationale Werte haben immer Vorrang.
  ⚠️ **Der Fallback-Pfad löst praktisch nie aus** — er hängt an
  `hasLimitedRenewableData` = `priceCount > 0 && renewableCount === 0` für
  **heute**; in der häufigsten Lage (heute fast vollständig, morgen 0)
  bleibt er `null`. `summarize()` filtert zudem auf `todaySamples`, die
  `series` enthält nie Punkte für morgen. Wer das nutzbar machen will, muss
  beide Stellen auf das tatsächliche Chart-Fenster umstellen, nicht auf den
  Kalendertag.

### 11b. Historical Data (`services/historicalDataStore.ts`)

- **Device cache ist die primäre Quelle.** Jeder erfolgreiche nationale
  Fetch in `EnergyDataManager.performDataLoad` schreibt einen Per-Tag-
  Snapshot (`recordSnapshot`, deferred) in `Storage`
  (localStorage/AsyncStorage). Storage-Layout: `energy_history_v1:<YYYY-MM-DD>`
  pro Tag + `energy_history_index_v1` Index.
- **Tages-Keys sind Europe/Berlin** (`dayStringFromTimestamp`), NICHT
  geräte-lokal — müssen zu `public/data/history/YYYY-MM-DD.json` passen.
- **MB-basierte Eviction:** `historyCacheLimitMb` (5/10/25/50, Default 10)
  im Customize-Modal; `enforceLimit` verwirft älteste Tage über Budget.
- **Server-Fallback:** `getRange(from, to, allowServerFallback=true,
  resolution='raw')` lädt fehlende vergangene Tage aus
  `data/history/<date>.json` nach; 404/Fehler werden ignoriert.
- **Hourly Pre-Aggregation:** `resolution: 'hourly'` holt die kleinere
  `data/history/<date>-hourly.json` (~75% kleiner), generiert pro Tag in
  `fetch.yml`. Fällt automatisch auf die Raw-Datei zurück, wenn die
  Hourly-Variante 404t. `HistoricalDataView` nutzt `'hourly'` nur für 30d.
- **Period Comparison:** lädt parallel die gleich lange Vorperiode und zeigt
  „vs. Vorperiode" via `computePeriodComparison` (`historicalStats.ts`).

### 12. Multi-Country-Architektur (`utils/countries.ts`)

- **Country Registry als Single Source of Truth:** `COUNTRIES:
  Record<CountryCode, CountryConfig>` (`de`|`nl`|`at`|`ch`|`fr`|`be`|`dk`)
  leitet Datenpfade, Timezone, `hasRegionalData`, Netzentgelte sowie
  `fallbackPostalCode`/`fallbackPostalCodeLabel` ab. Neues Land = ein
  Registry-Eintrag + ein Pipeline-Block in `fetch.yml`, keine verstreuten
  `if country === 'de'`-Checks. `DEFAULT_COUNTRY = 'de'`.
- **BETA-Länder** (NL, AT, CH, FR, BE, DK): `beta: true`, kein
  regional/PLZ-UI, kein aWATTar, Daten unter `data/<code>/marketdata.json` +
  `data/<code>/history/`. DE bleibt auf Legacy-Flat-Pfaden
  (`data/marketdata.json`) für Bestandskompatibilität.
- **Aktives Land** in `context/CountryContext.tsx` + `hooks/useCountry.ts`
  (Storage-Key `country`), unabhängig von der UI-Sprache.
- **Datenladen ist country-aware** (`energyDataManager`): Fetch-Pfad aus
  `COUNTRIES[country].marketDataPath`, Cache keyed by `dataCountry`.
  **In-flight-Dedup ist auf den Request skoped** (`loadingCountry`/
  `loadingPostalCode`) — ein Load piggybackt nur, wenn Land UND PLZ
  übereinstimmen. Nicht auf ein unconditional `if (isLoading) return
  loadingPromise` zurückfallen: das verursachte die Start-up-Race, bei der
  der Default-DE-Load deutsche Daten an den NL-Request auslieferte.
- **History-Store ist country-namespaced:** Keys
  `energy_history_v1_<country>:<date>`, Factory
  `historicalDataStoreForCountry(country)`; die `historicalDataStore`
  Singleton ist nur der DE-Alias. `HistoricalDataView` nimmt eine `country`
  Prop und liest daraus — nie die bare DE-Singleton.

---

## Security Considerations

### Data Sources
- ✅ All APIs use HTTPS
- ✅ Public data only (no authentication required)
- ✅ No sensitive user data stored
- ✅ Service Worker uses secure context

### Storage
- ✅ IndexedDB: Client-side only, no server transmission
- ✅ LocalStorage: XSS protection via Content Security Policy
- ✅ No credentials or API keys in frontend

### Deployment
- ✅ GitHub Pages: Static hosting, no server vulnerabilities
- ✅ Automated workflows: Protected by GitHub branch rules
- ✅ HTTPS enforcement: GitHub Pages default

---

## Performance Optimization

### Data Management
- **Incremental Updates**: Only new data points processed
- **Archive Snapshots**: Historical data snapshots for analysis
- **Compression**: JSON minification in production

### Rendering
- **Victory Native**: Optimized charting library
- **React Reconciliation**: Efficient DOM updates
- **Lazy Loading**: Components load on demand

### Network
- **Service Worker**: Offline-first, minimal network requests
- **Cache Strategy**: Network-first with fallback
- **Data Compression**: Gzipped responses

---

## Monitoring & Debugging

### Build Artifacts
- `dist/` - Distributable (1.5MB typical)
- `package-lock.json` - Dependency lock file
- `version.json` - Current app version info

### Workflow Logs
- GitHub Actions UI: View detailed workflow execution
- Step summaries: Deploy status, data update statistics
- Error logs: Automatic capture and reporting

---

## Future Roadmap

### Phase 5: Testing & Polish
- [ ] Unit tests for data merging logic
- [ ] E2E tests for complete workflows
- [ ] Performance profiling and optimization
- [ ] UI/UX refinements

### Phase 6: Feature Enhancements
- [ ] User preferences/settings UI
- [ ] Data export improvements
- [ ] Additional data sources
- [ ] Real-time notifications

---

## References

- [DATA-MERGE-STRATEGY.md](DATA-MERGE-STRATEGY.md) - Detailed merge algorithm
- [README.md](../README.md) - Project overview
- [GitHub Repository](https://github.com/S540d/Energy_Price_Germany)

---

**Last Updated**: 2026-03-02
**Current Version**: 1.4.1
**Maintainer**: S540d
