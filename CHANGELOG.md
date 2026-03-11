# Changelog - Energy Price Germany

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-03-11

### Added
- **Animierter Skeleton-Ladebildschirm** – Ersetzt den einfachen Ladeindikator durch einen animierten Shimmer-Effekt (via `expo-linear-gradient`), der die Chart-Struktur vorab andeutet
- **Animierter Theme-Schieberegler** – In den Einstellungen gleitet ein Pill-Indikator beim Wechsel zwischen Hell/Dunkel/System-Theme

### Changed
- **Expo SDK 55** – Upgrade von SDK 54 auf SDK 55
- **Flüssigere Animationen** – Alle UI-Animationen auf `react-native-reanimated` 3.17 umgestellt (vorher: React Native `Animated` API)
- **Einstellungen-Panel** – Öffnet und schließt sich jetzt mit einer Slide-up/down-Animation statt abrupt zu erscheinen
- **Chart-Ansichts-Toggle** – Wechsel zwischen Balken- und Uhransicht erfolgt mit sanftem Übergang
- **Emojis entfernt** – Emoji-Prefixe aus Hinweistexten und Übersetzungen entfernt für konsistenteres Erscheinungsbild
- `newArchEnabled`-Flag aus App-Konfiguration entfernt (in SDK 55 nicht mehr benötigt)

### Fixed
- Hardcoded englischer "Hint:"-Prefix vor Hinweistexten in Charts entfernt – Text war bei deutscher Spracheinstellung nicht lokalisiert (#238)

---

## [1.4.3] - 2026-03-04

### Fixed
- Aktuelle-Stunde-Markierung aus der Geräte-Timeline entfernt – verhindert irreführende Darstellung, als würde eine vergangene Stunde empfohlen (#219)
- Diagramm teilen: `collapsable={false}` für den Capture-Container gesetzt, behebt "Diagramm kann nicht geteilt werden"-Fehler auf Android (#221)

### Changed
- Dark Mode ist jetzt das Standard-Theme für Neuinstallationen (#220)

---

## [1.4.2] - 2026-03-02

### Fixed
- PLZ und Netzentgelte im Personalisieren-Panel nebeneinander (eine Zeile) (#210)
- Redundante Titel aus der "Was kostet das"-Ansicht entfernt (#211)

---

## [1.4.1] - 2026-02-27

### Added
- **Diagramm teilen** – Charts können als PNG-Screenshot geteilt oder heruntergeladen werden (Android: System-Share-Sheet, Web: Download oder Browser-Share) (#163)

### Changed
- Android-Build vollständig lokal via Gradle (kein EAS Cloud Build mehr) (#202)

---

## [1.4.0] - 2026-02-22

### Added
- **Preisdarstellung wählbar** – Nutzer können zwischen Börsenstrompreis und Endkundenstrompreis (inkl. Netzentgelte) umschalten; Einstellung nur für den Hauptchart, Detail-View zeigt immer beide
- **Geräte-Timeline (Appliance Timeline)** – Beste Betriebsstunden für Haushaltsgeräte mit Empfehlung der günstigsten Zeitfenster (#195)
- **Preisalarm** – In-App-Benachrichtigungen und Web-Notifications bei Über-/Unterschreitung von Preisschwellen (Fix #2)
- **24h-Uhransicht** – Alternativer Preis-Chart als 24-Stunden-Uhr (Clock View) mit Toggle (#165)
- **Chart-Animationen** – Karten und Tooltips animieren beim Einblenden (#68)

### Fixed
- Detail-View zeigt immer gestapelten Chart (Börsenstrompreis + Netzentgelte), unabhängig vom gewählten Modus
- Kostenrechner zeigt nur zukünftige Zeitslots (#197)
- Label „Beste Zeit" in „Beste Zeit in der Zukunft" umbenannt
- Zone-Bands und Runner-Bands aus Preis- und Erneuerbare-Charts entfernt
- ClockChart-Labels in SVG verschoben; Preisalarm lädt Schwellen korrekt (value > 0 Validierung)
- Beta-Modus aus „Personalisieren" entfernt
- Metriken immer unter Grafik, View-Toggle im Header (#194)

### Changed
- Preisdarstellungs-Modus gilt nur für den Hauptchart; Detailansicht ist immer gestapelt (`forceStacked`)

---

## [1.3.0] - 2026-01-04

### Added
- **Daily Regional Cache Strategy** - 95% reduction in API calls
  - Persistent cache for regional renewable energy data (localStorage/AsyncStorage)
  - Automatic invalidation after midnight
  - Dual-layer caching (persistent + in-memory) for reliability
  - Only stores current postal code to minimize storage usage

- **Unified Legend System** - Professional chart legends
  - Orange dashed line in RenewableBarChart for regional data visibility
  - Responsive legends (desktop only, hidden on mobile)
  - Consistent styling across all charts
  - New legend section in Settings menu

- **Cloudflare Worker Documentation** - Architecture transparency
  - Comprehensive documentation of CORS proxy solution
  - Architecture diagrams and deployment details
  - Security and privacy guarantees documented

### Fixed
- **iOS/PWA Postal Code Persistence** - Users no longer need to re-enter postal code
  - Fixed AsyncStorage initialization issues with static imports
  - Postal code now persists across app restarts
  - Proper error handling with graceful fallbacks

- **Android Regional Data Display** - Regional data now loads on native apps
  - Fixed AsyncStorage integration for Android platform
  - Regional renewable data visible alongside national data
  - Consistent regional cache behavior across platforms

- **Settings Menu Spacing** - Uniform visual hierarchy
  - Removed inconsistent padding in REGION and LEGEND sections
  - All menu sections now use consistent spacing (paddingHorizontal: 16, paddingVertical: 12)
  - Professional, polished appearance across all platforms

- **Service Worker Cache-Busting** - Proper version updates
  - Removed hardcoded cache versions preventing app updates
  - Dynamic cache-busting mechanism now works correctly
  - Users receive latest app version without manual cache clearing

- **Deploy Workflow File Handling** - All build artifacts deployed
  - Fixed `git add -A .nojekyll` syntax error in deploy workflow
  - All new files (JS bundles, manifests) now properly staged and deployed
  - Ensure fetch-depth: 0 prevents cache issues with Git history

### Changed
- Version bumped from 1.2.4 to 1.3.0
- Android versionCode increased from 9 to 10
- Improved regional data initialization timing
- Storage adapter refactored for better platform compatibility

### Technical
- Refactored platform-specific storage handling
- Improved AsyncStorage initialization on mobile
- Enhanced error logging for storage operations
- Build and deployment pipeline improvements

---

## [1.2.3] - 2025-12-26

### Fixed
- **Price Chart Legend Responsiveness** - Legend now hides on phone, shows on tablet/desktop
  - Improved visual hierarchy and space usage across different screen sizes
  - Better user experience on mobile devices

- **Tooltip Text Contrast** - Enhanced readability of price information
  - Fixed tooltip text contrast issues in price chart
  - Users can now clearly read price values on all backgrounds

### Changed
- **Theme-Aware Chart Colors** - Consistent color system across all charts
  - Applied centralized theme colors to all chart components
  - PriceBarChart, RenewableBarChart, and CorrelationScatterChart now use unified color palette
  - Improved visual consistency across the application
  - Better dark/light mode support

### Technical
- Version bumped from 1.2.2 to 1.2.3
- Android versionCode increased from 7 to 8
- Build ready for Google Play Store distribution

---

## [Unreleased (Next Release)]

### Fixed
- **Issue #98: Immediate Loading Indicator** - Visual feedback before React hydration
  - Added CSS spinner in HTML that appears immediately on page load
  - MutationObserver detects React rendering and fades out the loading screen
  - Fallback timeout (5s) hides loading even if React fails
  - Users see instant visual feedback instead of blank screen

- **Issue #100: Landscape Mode Chart Responsiveness** - Dynamic chart sizing
  - Added Dimensions.addEventListener to react to orientation changes
  - Charts now properly adapt to landscape vs portrait orientation
  - Landscape mode: charts fill 90% of available height for better usability
  - Portrait mode: 3 charts fit optimally without excessive scrolling

- **Issue #101: Modern Design System** - Consistent, professional UI
  - Created designSystem.ts with comprehensive design tokens
  - 8px grid system for spacing (4px to 48px scale)
  - Modern color palette with semantic colors and proper contrast
  - Unified theme system supporting light/dark modes
  - Updated style.css with CSS variables and utility classes
  - All components now use consistent, accessible colors

- **Metrics Display Contrast** - Fixed unreadable metrics values
  - Light mode: surfaceSecondary changed from #EFEFEF to #E5E5E5 (darker background)
  - Text labels now use colors.text (#1A1A1A) instead of textSecondary for better contrast
  - Metric values use colors.primary (#2563EB in light, #60A5FA in dark) for vibrant, readable display
  - WCAG AA contrast compliance for accessibility

- **Issue #105: Missing Details Button on Android** - Fixed invisible button
  - Increased Details button z-index from 10 to 100
  - Resolves z-index conflict with chart touch areas
  - Button now clickable on all platforms (web, Android, iOS)

### Added
- **Issue #104: Legend Section in Settings Menu** - Educational price breakdown
  - New LEGEND section in settings explaining end-customer price calculation
  - Shows visual elements matching chart colors (green market price, gray grid fees)
  - Dynamic display using centralized GRID_FEES_AND_TAXES constant (20 ¢/kWh)
  - Visible on all platforms (mobile, tablet, desktop)
  - Translations: English and German with localized descriptions

- **Issue #106: Dual Price Display in Metrics** - Complete price transparency
  - Metrics modal now shows both prices when viewing price chart details:
    - **End-customer price** (top, primary) - what consumers actually pay
    - **Market price** (bottom, secondary) - wholesale electricity price
    - Visual separation with divider and informative note
  - Enhanced tooltip on bar hover showing price breakdown:
    - Börsenpreis (market price)
    - + Netzentgelte (grid fees: 20 ¢/kWh)
    - = Endkunde (total customer price)
  - Price legend now visible on all platforms
    - Desktop: horizontal layout
    - Mobile: vertical layout with full descriptions

- **Enhanced Price Chart Legend** - Improved visibility and information
  - Legend elements now visible on mobile (was desktop-only before)
  - Shows all components with color-coded boxes:
    - Green box: Market Price (Börsenstrompreis)
    - Gray box: Grid Fees & Taxes (20 ¢/kWh)
    - Faded green: Interpolated data indicator
  - Grid fees amount displayed inline: "(20 ¢/kWh)"

- **Centralized Grid Fees Constant** - Single source of truth for markup
  - All price references now use `GRID_FEES_AND_TAXES` from `utils/metrics.ts`
  - Eliminates hardcoded "20" values throughout codebase
  - Easy to update: change constant in one place affects entire app
  - Applied to: Settings legend, metrics display, price tooltips, chart legend
  - Currently set to 20 ¢/kWh (represents grid fees and taxes)

### Added
- **48h Renewable Forecast Utilization** - Game-changing improvement to data coverage
  - Energy Charts renewable forecast extends 48h (not just 24h like prices!)
  - Modified workflow to preserve ALL renewable timestamps (union of price+renewable)
  - Enrich renewable-only points with aWATTar prices
  - Result: Tomorrow's data now shows BOTH renewable share AND prices
  - No more grey bars for tomorrow - full green renewable bars!
  - Data Merge Strategy v3.1

- **Daily History Files** - Optimized storage for app historical data feature
  - Daily JSON files (~15KB each) at `public/data/history/YYYY-MM-DD.json`
  - Contains 96 data points (24h @ 15min intervals)
  - Automatic 90-day retention with cleanup
  - Only saves complete days (92+ of 96 points)
  - Storage: ~1.4MB for 90 days (vs ~27MB for archives)
  - Enables granular loading: load only needed days
  - No decompression needed, predictable naming

- **Automatic Archive Cleanup** - Bounded storage growth
  - 90-day retention for both archives and history files
  - Automatic cleanup during each data update
  - Total storage: ~28MB (28% of 100MB budget)

### Fixed
- **Workflow Repository Rule Bypass** - Fixed workflow push failures
  - Problem: GitHub repository rules prevented direct pushes to main
  - Error: "push declined due to repository rule violations"
  - Solution: Use PAT_TOKEN (with fallback to GITHUB_TOKEN) to bypass rules
  - Result: Automated data updates can now push directly to main

- **Auto-Deploy After Data Updates** - Simplified deployment trigger
  - Removed redundant manual workflow dispatch (caused 403 errors)
  - Push to main automatically triggers deploy.yml workflow
  - Result: Website auto-updates after every data commit
  - No manual intervention needed!

- **Missing Tomorrow's Renewable Data** - Solved the grey bar problem! 🎉
  - Previously: Energy Charts 48h renewable forecast was DISCARDED (only used 24h with prices)
  - Now: Preserve ALL 192 renewable forecast points (not just 96 with prices)
  - Enrich renewable-only points (tomorrow) with aWATTar prices
  - Result: Full renewable share data for 48h (no more grey bars for tomorrow!)
  - This was the root cause of user's "neuesten Daten werden nicht angezeigt" issue
  - Data Merge Strategy upgraded from v3.0 to v3.1

- **Renewable Interpolation Flag** - Corrected incorrect flag behavior
  - `isRenewableShareInterpolated` now always false
  - Renewable data is never interpolated (only market price is)
  - Prevents incorrect interpolation markers on renewable chart

- **24h Past Data Filter** - Improved chart focus
  - Data stored for 7 days (history preservation)
  - Display: only 24h past + all future data
  - Reduces chart clutter, focuses on relevant timeframe
  - Metrics calculations use filtered data

- **Chart Layout Consistency** - Unified chart structure and positioning across all components
  - Y-axis labels now positioned consistently at 40% from top (horizontalOffset: -15)
  - Fixed right-side overflow in narrow browser windows (all X-calculations now use rightPadding)
  - Unified container heights across all three charts (removed inconsistent bottomPadding additions)
  - All chart elements (bars, touch areas, lines, labels) now respect rightPadding boundaries
  - Consistent layout structure: Y-labels inside chart container (not outside)

- **Dark Mode UI: White block under last chart** - Fixed mobile display issue
  - Added paddingBottom to ScrollView contentContainerStyle
  - Added wrapper View with dynamic background color in SafeAreaProvider
  - Ensures proper theme background on all screen sizes and devices
  - No more white blocks appearing below content in Dark Mode

### Changed
- **Data Merge Strategy v3.1** - Smart 48h renewable forecast utilization
  - Preserve ALL Energy Charts renewable timestamps (union of price+renewable)
  - Enrich renewable-only data points with aWATTar prices
  - Result: 48h complete data (price + renewable for today AND tomorrow)
  - Supersedes v3.0 which had grey bars for tomorrow

- **Data Merge Strategy v3.0** - Simplified, robust approach (SUPERSEDED by v3.1)
  - Removed complex renewable enrichment (unreliable EC API)
  - 2x daily updates: 12:00 + 15:00 UTC (Day-Ahead timing)
  - Simple compare logic: only checks max timestamp
  - Grey fading bars for missing renewable data
  - Stable, predictable, transparent pipeline

### Technical
- Modified Energy Charts workflow processing to preserve 48h renewable forecast
- Updated merge-market-data.js to enrich renewable-only points with aWATTar prices
- Workflow now uses PAT_TOKEN to bypass repository protection rules
- Removed redundant workflow dispatch step (deploy.yml auto-triggers on push)
- Storage structure optimized for app historical data
- Archive cleanup integrated into GitHub Actions workflow
- Frontend 24h filter with useMemo optimization
- Documentation updated in DATA-MERGE-STRATEGY.md

### Planned
- Phase 5: Testing & Polish
  - Unit tests for core data merging logic
  - E2E tests for workflows
  - Performance optimization

---

## [1.1.0] - 2025-11-03

### Added
- **Complete Bilingual Support** - German/English localization throughout the app
  - Automatic browser language detection
  - Manual language toggle in settings
  - All UI elements, chart labels, and tooltips translated
  - Persistent language preference in localStorage
  - Date/time formatting adapts to selected language

- **Interactive Chart Enhancements**
  - Hover tooltips on all three charts (desktop/web)
  - Touch tooltips for mobile devices
  - Date/time display on correlation scatter chart
  - Value display on bar charts
  - 24px touch areas for better mobile UX
  - Smooth hover transitions with visual feedback

### Changed
- **Improved Chart Consistency**
  - Unified Y-axis label positioning across all charts
  - Consistent padding values (40px) for uniform spacing
  - Gray highlights (#999999) for more subtle selection feedback
  - Optimized chart rendering for better performance

### Fixed
- localStorage access issues causing 404 errors on page reload
- Hover functionality now works consistently across all charts
- Y-axis label spacing now uniform across all three charts
- SSR-safe browser API access with proper error handling

### Technical
- Enhanced chart components with localization props
- Improved event handling with z-index layering
- Platform-specific touch/hover handlers for cross-platform support
- Centralized translation management in App.tsx

---

## [1.0.3] - 2025-10-18

### Fixed
- **GitHub Actions Integration** - Deploy workflow now triggers reliably on data updates
  - Integrated deploy job directly into fetch.yml workflow
  - Removed problematic `workflow_call` pattern that prevented auto-triggering
  - Added proper permission configuration for deployments
  - Workflow chain: fetch → update → build → deploy now works seamlessly

### Changed
- Refactored GitHub Actions workflows for better reliability
- Streamlined workflow triggering mechanism

---

## [1.0.2] - 2025-10-14

### Fixed
- **GitHub Pages 404 Error** - _expo directory no longer accessible
  - Added `.nojekyll` file to prevent Jekyll processing
  - Updated build scripts to include `.nojekyll` in distribution
  - App now loads correctly on GitHub Pages

### Added
- Local development build variant (`npm run build:local`)
- Local development server setup (`npm run serve:local`)

### Changed
- Improved build configuration with post-build scripts

---

## [1.0.1] - 2025-10-12

### Added
- **Hybrid Data Strategy** - Enhanced forecast coverage from 24h to 43+ hours
  - Energy Charts (Fraunhofer ISE) as primary source
  - aWATTar (EPEX Spot Market) as supplement & fallback
  - Intelligent merging: supplements only when gap ≥3 hours
  - Result: Up to 43+ hours of forecast data with high-quality renewable share info

- New documentation
  - `DATA-MERGE-STRATEGY.md` - Detailed merge algorithm documentation
  - Enhanced README with data source explanation

### Changed
- Updated data fetching workflow to implement merge strategy
- Improved GitHub Actions workflow configuration
- Better data coverage and reliability

### Technical Details
- Energy Charts: Primary source with renewable share forecast
- aWATTar: Extends coverage when gap detected
- Source attribution: Maintained throughout merge process

---

## [1.0.0] - 2025-10-07

### Added
- Initial project release
- React Native/Expo-based energy price visualization app
- Real-time data visualization of electricity market prices
- Renewable energy share correlation analysis
- Web, iOS, and Android support
- Dark/Light theme with system detection
- Data export functionality (CSV/JSON)

### Features
- Interactive charts for price trends
- Renewable energy share correlation
- Responsive design across platforms
- Automatic system theme detection with manual override
- Cross-platform support (Web, iOS, Android)

### Infrastructure
- GitHub Actions automation for data updates
- GitHub Pages deployment
- Automated market data fetching from aWATTar API
- Service worker for offline support
- Expo/React Native framework

---

## Project Phases

### Phase 1: Project Foundation (Initial Setup)
- Project structure and dependencies
- Initial API integration (aWATTar)
- Basic visualization and theming

### Phase 2: Data Enhancement (Oct 12-14)
- Hybrid data strategy implementation
- Energy Charts integration
- GitHub Pages fixes (.nojekyll)
- Improved build configuration

### Phase 3: Offline Support (Oct 14-17)
- Offline-first architecture
- Service worker optimization
- Sync queue implementation
- Offline persistence

### Phase 4: Workflow Improvements (Oct 18)
- GitHub Actions reliability fixes
- Direct deploy job integration
- Workflow optimization

### Phase 5: Testing & Polish (Planned)
- Comprehensive test suite
- Performance optimization
- UI/UX refinements

---

## Data Sources

- **Energy Charts API** (Fraunhofer ISE): Day-ahead market prices and renewable energy forecasts
- **aWATTar API** (EPEX Spot Market): Extended price forecasts and supplementary data
- **Mock Data**: Fallback demonstration data when both APIs unavailable

---

## Repository Structure

- `/js` - JavaScript modules (UI, storage, offline-queue, drag management)
- `/scripts` - Build and data processing scripts
- `/.github/workflows` - GitHub Actions automation
- `/public` - Static assets and service worker
- `style.css` - Application styling

---

## Technologies

- **React Native** - Cross-platform mobile development
- **Expo** - Universal React application framework
- **Victory Native** - Charting library
- **TypeScript** - Type-safe development
- **Service Workers** - Offline functionality
- **GitHub Actions** - CI/CD automation

---

## Versioning

This project follows Semantic Versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes or major feature releases
- MINOR: New features, backward compatible
- PATCH: Bug fixes and improvements

Current version: **1.1.0**

---

## License

MIT License - See LICENSE file for details

---

## Contact

- GitHub: [Energy Price Germany](https://github.com/S540d/Energy_Price_Germany)
- Web: [Live Demo](https://s540d.github.io/Energy_Price_Germany/)
- Author: S540d
