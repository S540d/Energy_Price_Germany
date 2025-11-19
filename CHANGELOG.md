# Changelog - Energy Price Germany

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Auto-Deploy After Data Updates** - Fixed deployment trigger issue
  - Problem: GITHUB_TOKEN pushes don't trigger other workflows (GitHub security)
  - Solution: Added automatic deployment trigger using github-script action
  - Result: Website now auto-updates after every data commit
  - No more manual intervention needed!

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
- Added automatic deployment trigger after data commits (github-script action)
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
