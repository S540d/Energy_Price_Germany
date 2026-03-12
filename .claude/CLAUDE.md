# Claude Code Instructions - Energy Price Germany

## Project Overview
Energy Price Germany - A visualization app for German electricity market prices and renewable energy share with real-time data from multiple APIs.

**Tech Stack:**
- React Native with Expo 55
- TypeScript
- react-native-svg (custom chart rendering)
- react-native-reanimated 3.x (upgrade to 4.x pending – Issue #247; needed for Android build)
- expo-linear-gradient (shimmer effects in SkeletonLoader)
- AsyncStorage (data persistence)
- Cloudflare Worker (CORS proxy for regional data)
- GitHub Pages (web deployment)

## Key Project Documents
- [Architecture](../docs/ARCHITECTURE.md) - System architecture and data flow
- [Data Merge Strategy](../docs/DATA-MERGE-STRATEGY.md) - How data from multiple sources is combined
- [Changelog](../CHANGELOG.md) - Version history
- [Build Guide](../docs/BUILD.md) - Build and deployment instructions
- [Privacy Policy](../PRIVACY_POLICY.md) - Data privacy information
- [Store Description](../docs/STORE_DESCRIPTION.md) - Play Store listing text

## Workflow & Git Management

### Branch Strategy & PR Workflow
**IMPORTANT: Apply these rules to ALL changes unless explicitly overridden:**

1. **Always create a PR** - Even for small changes, unless told otherwise
2. **Work on `testing` branch** - Never commit directly to main/staging
3. **Branch sync requirement** - Before starting work on testing, verify:
   - `testing` ≥ `staging` (same commit or newer)
   - `testing` ≥ `main` (same commit or newer)
   - If outdated, merge staging and main into testing first

**Workflow:**
```
git checkout testing
git pull origin testing
# Ensure testing is synced with staging & main
git merge origin/staging  (if needed)
git merge origin/main     (if needed)

# Create feature branch
git checkout -b feature/issue-XXX

# ... make changes ...

# Create PR: testing ← feature/issue-XXX
gh pr create --base testing --title "..." --body "..."
```

### Pull Request Requirements
- Title: Reference issue number (e.g., "Fix #145: Jest configuration")
- Body: Explain what changed and why
- Target branch: **Always `testing`** (unless told otherwise)
- Wait for CI/CD to pass before merge
- At least one code review (if available)

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

### Testing & Environments
- **Production:** https://s540d.github.io/Energy_Price_Germany/
- **Local Dev:** `expo start --web`
- **Local Build:** `npm run serve:local` (port 8080)

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

### Reanimated Android Build Blocker (Issue #247)
- Expo SDK 55 requires `react-native-reanimated@4.2.1` (currently on 3.x)
- Reanimated 4 also requires `react-native-worklets >= 0.7.0` as peer dep
- RN 0.83 (bundled with Expo 55) removed `UIManagerModuleListener` and `Systrace.TRACE_TAG_REACT_JAVA_BRIDGE` → breaks Reanimated 3.x Android build
- `newArchEnabled=false` does NOT fix the issue
- **Android builds are currently broken** until Issue #247 is resolved
- Reanimated 4 has breaking changes: `useAnimatedStyle` no longer accepts dependency array → `AppearanceSection.tsx` will need updates

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
│       └── index.ts              # Barrel exports
├── settings/
│   ├── AppearanceSection.tsx     # Theme pill selector with spring animation
│   └── SettingsMenu.tsx          # Settings panel (slide-up/down animation)
├── ui/
│   ├── Button.tsx                # Scale-spring on press
│   ├── SkeletonLoader.tsx        # Shimmer skeleton (LinearGradient + Reanimated)
│   ├── ChartSkeleton.tsx         # Chart loading placeholder
│   ├── Chip.tsx                  # Animated chip/badge element
│   └── Badge.tsx                 # Animated badge element
├── ChartDetailView.tsx           # Expandable detail modal with share button
├── CostCalculator.tsx            # Cost calculator logic
├── CostCalculatorView.tsx        # Full-screen cost calculator view
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
└── designSystem.ts       # Design tokens

services/
├── energyDataManager.ts  # Data orchestration (fetch, cache, process)
├── regionalDataCache.ts  # Dual-layer regional cache (memory + persistent)
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

## Questions?
Refer to documentation in root directory or check GitHub issues:
- [GitHub Issues](https://github.com/S540d/Energy_Price_Germany/issues)
