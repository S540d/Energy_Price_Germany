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

#### Module Structure
```
js/modules/
├── storage.js              (Data persistence & offline queue)
├── ui.js                   (UI components & rendering)
├── offline-queue.js        (Offline operation queue)
├── drag-manager.js         (Touch/drag interaction)
└── notifications.js        (Toast notifications)
```

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

#### Build Process
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

#### Deployment
```
Local Build → npm run deploy
    ↓
gh-pages Deploy
    ↓
GitHub Pages (gh-pages branch)
    ↓
Live: https://s540d.github.io/Energy_Price_Germany/
```

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

**Last Updated**: 2026-01-04
**Current Version**: 1.3.0
**Maintainer**: S540d
