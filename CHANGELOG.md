# Changelog - Energy Price Germany

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Phase 5: Testing & Polish
  - Unit tests for core data merging logic
  - E2E tests for workflows
  - Performance optimization
  - UI/UX refinements

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

Current version: **1.0.3**

---

## License

MIT License - See LICENSE file for details

---

## Contact & Support

- GitHub: [Energy Price Germany](https://github.com/S540d/Energy_Price_Germany)
- Web: [Live Demo](https://s540d.github.io/Energy_Price_Germany/)
- Author: S540d
- Support: [Buy Me a Coffee](https://buymeacoffee.com/sven4321)
