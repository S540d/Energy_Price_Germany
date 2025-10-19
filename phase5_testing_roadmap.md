# Phase 5 Testing Implementation Roadmap

## Overview Timeline

```
Week 1 (Tier 1 - Critical)    Week 2 (Tier 2 - Important)    Week 3 (Tier 3 - Polish)
├─────────────────────────────┼──────────────────────────────┼──────────────────────
│ Infra Setup (5-8h)          │ Export Tests (2-3h)          │ Performance (3-4h)
│ Data Manager Tests (4-6h)   │ Component Tests (6-8h)       │ A11y Tests (2-3h)
│ Metrics Tests (2-3h)        │ E2E Tests (4-6h)             │ Coverage Polish (2-3h)
│ Merge Tests (4-5h)          │ CI/CD Integration (1-2h)     │ Documentation (1-2h)
│ Bug Fixes (2-3h)            │                              │ Final Review
│ Total: 17-25h               │ Total: 13-19h                │ Total: 8-12h
└─────────────────────────────┴──────────────────────────────┴──────────────────────
```

---

## Module Testing Priority Matrix

```
Impact vs Complexity (Higher = Test First)

HIGH IMPACT
    │
    │  ★ Data Manager      ★ Merge Logic
    │  (High Impact,       (High Impact,
    │   Low-Med Complexity) Med-High Complexity)
    │
    │  ★ Metrics          ★ Chart Components
    │  (Med Impact,       (Med-High Impact,
    │   Low Complexity)    High Complexity)
    │
    │  ★ Export Service   ★ App Lifecycle
    │  (Low-Med Impact,   (Med Impact,
    │   Low Complexity)    High Complexity)
    │
LOW IMPACT  └────────────────────────────────→
             LOW            COMPLEXITY        HIGH
```

---

## Critical Path Test Coverage Map

```
Entry Point (App.tsx)
    │
    ├─→ useEffect: loadData()
    │       │
    │       └─→ fetchEnergyData() ◄───── [DATA MANAGER TESTS]
    │               │                     • Cache hit/miss
    │               ├─→ EnergyDataManager.loadEnergyData()
    │               │   ├─→ fetchRawData() [from marketdata.json]
    │               │   ├─→ processRawData() [Transform]
    │               │   │   └─→ Source attribution ◄─ [MERGE TESTS]
    │               │   └─→ fallback: generateMockData()
    │               │
    │               └─→ Cache (15 min TTL)
    │
    ├─→ setEnergyData(data)
    │   │
    │   ├─→ calculateMetrics(data) ◄─────[METRICS TESTS]
    │   │   ├─→ Filter null values
    │   │   ├─→ Calculate avg/min/max
    │   │   └─→ Time range
    │   │
    │   └─→ Render Charts:
    │       ├─→ RenewableBarChart() [COMPONENT TESTS]
    │       │   └─→ Color coding logic
    │       ├─→ PriceBarChart()
    │       │   ├─→ interpolateColor()
    │       │   └─→ Responsive sizing
    │       └─→ CorrelationScatterChart()
    │
    ├─→ exportAsCSV() / exportAsJSON() ◄─[EXPORT TESTS]
    │   └─→ Blob creation & download
    │
    └─→ Theme & UI State Management ◄─[E2E TESTS]
        ├─→ setTheme()
        ├─→ setMenuVisible()
        └─→ setCurrentView()
```

---

## Test File Structure

```
project-root/
├── services/
│   └── __tests__/
│       ├── energyDataManager.test.ts        [CRITICAL - 20-30 tests]
│       ├── exportService.test.ts            [IMPORTANT - 10-15 tests]
│       └── energyApi.test.ts               [OPTIONAL - 5-10 tests]
│
├── utils/
│   └── __tests__/
│       ├── metrics.test.ts                 [CRITICAL - 12-18 tests]
│       ├── chartHelpers.test.ts            [OPTIONAL - 5-8 tests]
│       └── theme.test.ts                   [OPTIONAL - 5-8 tests]
│
├── components/
│   └── charts/
│       └── __tests__/
│           ├── PriceBarChart.test.tsx      [IMPORTANT - 15-20 tests]
│           ├── RenewableBarChart.test.tsx  [IMPORTANT - 12-15 tests]
│           └── CorrelationScatterChart.test.tsx [OPTIONAL - 8-12 tests]
│
├── scripts/
│   └── __tests__/
│       └── merge-market-data.test.js      [CRITICAL - 15-25 tests]
│
├── __tests__/
│   ├── App.integration.test.tsx            [IMPORTANT - 10-15 tests]
│   └── e2e.test.tsx                       [OPTIONAL - 8-12 tests]
│
├── test/
│   ├── setup.ts                           [Test environment setup]
│   ├── mocks.ts                           [Global mocks & fixtures]
│   └── utils.ts                           [Test utilities & helpers]
│
├── jest.config.js                         [Jest configuration]
└── package.json                           [Scripts: test, test:watch, test:coverage]
```

---

## Testing Strategy by Module

### 1. EnergyDataManager (Critical)

**Test Categories:** 20-30 tests

```
describe('EnergyDataManager', () => {
  describe('Cache Management', () => {
    ✓ Cache hit returns cached data without API call
    ✓ Cache miss triggers API fetch
    ✓ Cache expires after 15 minutes
    ✓ Manual invalidateCache() clears data
    ✓ getCacheInfo() returns correct state
  })
  
  describe('Data Loading', () => {
    ✓ loadEnergyData() resolves with array
    ✓ Concurrent requests return same promise
    ✓ Empty data array handled
    ✓ Null values mixed in data
  })
  
  describe('Error Recovery', () => {
    ✓ API failure triggers mock data fallback
    ✓ Mock data generation produces valid EnergyData
    ✓ Source set to 'none' on mock data
    ✓ Error logged to console
  })
  
  describe('Source Attribution', () => {
    ✓ Energy Charts data → source: 'energy-charts'
    ✓ aWATTar data → source: 'awattar'
    ✓ Mock data → source: 'none'
    ✓ getCurrentDataSource() returns correct value
  })
  
  describe('Performance', () => {
    ✓ Cache hit < 5ms
    ✓ Large dataset (1000 points) loads within 100ms
  })
})
```

### 2. Metrics Calculation (Critical)

**Test Categories:** 12-18 tests

```
describe('calculateMetrics', () => {
  describe('Valid Data', () => {
    ✓ Average calculation accuracy
    ✓ Min/Max calculation
    ✓ Time range calculation
    ✓ Price conversion (EUR/MWh → ¢/kWh)
  })
  
  describe('Null Handling', () => {
    ✓ Mixed null values filtered correctly
    ✓ All null values return 0
    ✓ Empty array returns null
    ✓ Single null value filtered
  })
  
  describe('Edge Cases', () => {
    ✓ Single data point
    ✓ Duplicate timestamps
    ✓ Unsorted timestamps
    ✓ Extreme price values (very high/low)
    ✓ Extreme renewable % (>100%, <0%)
  })
})
```

### 3. Merge Strategy (Critical)

**Test Categories:** 15-25 tests

```
describe('merge-market-data', () => {
  describe('Energy Charts Primary', () => {
    ✓ EC only → source: 'energy-charts'
    ✓ EC + AW (≥3h gap) → merged, source: EC
    ✓ EC + AW (<3h gap) → EC only, source: EC
    ✓ No duplicate data points
  })
  
  describe('Fallback Logic', () => {
    ✓ EC missing → AW only, source: 'awattar'
    ✓ Both missing → error thrown
  })
  
  describe('Data Integrity', () => {
    ✓ Chronological order maintained
    ✓ Renewable share null for AW only
    ✓ Renewable share preserved for EC
    ✓ Prices accurate
    ✓ Timestamps correct
  })
  
  describe('Edge Cases', () => {
    ✓ Empty datasets
    ✓ Time difference exactly 3h
    ✓ Large datasets (500+ points)
    ✓ Duplicate timestamps filtered
  })
})
```

### 4. Export Service (Important)

**Test Categories:** 10-15 tests

```
describe('exportService', () => {
  describe('CSV Export', () => {
    ✓ Headers correct
    ✓ Data rows formatted
    ✓ Special characters escaped
    ✓ Null values displayed as 'N/A'
    ✓ ISO timestamps
  })
  
  describe('JSON Export', () => {
    ✓ Valid JSON output
    ✓ Pretty-print format
    ✓ Data integrity preserved
  })
  
  describe('File Download', () => {
    ✓ Blob created correctly
    ✓ Download triggered (web)
    ✓ Correct filenames
    ✓ Platform detection (web vs mobile)
  })
})
```

### 5. Chart Components (Important)

**Test Categories:** 15-20 tests per component

```
describe('PriceBarChart', () => {
  describe('Color Calculation', () => {
    ✓ <25 ¢/kWh → green
    ✓ 25-35 ¢/kWh → yellow gradient
    ✓ >35 ¢/kWh → red
    ✓ Interpolation correct (0-1 factor bounds)
  })
  
  describe('Responsive Design', () => {
    ✓ Phone (<480px) sizing
    ✓ Tablet (480-768px) sizing
    ✓ Desktop (>768px) sizing
    ✓ Chart width constraints
  })
  
  describe('Data Rendering', () => {
    ✓ Bars for each data point
    ✓ Empty data → no bars
    ✓ Single point renders
    ✓ Grid fees overlay (20 ¢/kWh)
  })
})
```

### 6. App Integration (Important)

**Test Categories:** 10-15 tests

```
describe('App Integration', () => {
  describe('Lifecycle', () => {
    ✓ Initial load state shown
    ✓ Data loads on mount
    ✓ Charts render when data loaded
    ✓ Error message on load failure
  })
  
  describe('Theme Management', () => {
    ✓ System theme detected
    ✓ Theme toggle works
    ✓ Theme persisted
  })
  
  describe('Navigation', () => {
    ✓ Menu toggle open/close
    ✓ View switch charts ↔ metrics
    ✓ Export triggers download
  })
})
```

---

## Test Execution Commands

```bash
# Setup
npm install --save-dev jest @testing-library/react-native @types/jest ts-jest

# Run all tests
npm test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test energyDataManager.test.ts

# Run critical path tests only
npm test -- --testPathPattern="(energyDataManager|metrics|merge-market-data)"

# Update snapshots
npm test -- -u
```

---

## Success Criteria

### Coverage Targets
```
Critical Modules:
- energyDataManager.ts:        90%+ coverage
- metrics.ts:                  85%+ coverage
- merge-market-data.js:        90%+ coverage

Important Modules:
- exportService.ts:            80%+ coverage
- Chart components:            75%+ coverage
- App.tsx:                      70%+ coverage

Overall:
- Statements:                  60%+
- Branches:                    50%+
- Functions:                   65%+
- Lines:                        60%+
```

### Test Quality Metrics
```
- No skipped tests (no .skip())
- No commented-out tests
- No hardcoded timeouts (>100ms)
- All async operations handled
- Mocks isolated per test
- No test interdependencies
```

### Regression Prevention
```
- All known bugs covered by tests
- All previously fixed issues have regression tests
- Edge cases documented with test comments
- Performance regressions detected via snapshots
```

---

## Dependencies to Install

```bash
# Testing Framework
npm install --save-dev jest
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev ts-jest
npm install --save-dev @types/jest

# Mocking & Utilities
npm install --save-dev jest-mock-extended
npm install --save-dev node-fetch                    # For Node tests
npm install --save-dev jest-fetch-mock

# React Testing Utilities
npm install --save-dev react-native-test-utils

# Coverage
npm install --save-dev @covercx/test-utils

Total: 11 dev dependencies (all small, focused packages)
```

---

## CI/CD Integration

### GitHub Actions Update

Add to `.github/workflows/fetch.yml`:

```yaml
name: Fetch & Deploy

on:
  schedule:
    - cron: '0 3-22 * * *'
  workflow_dispatch:
  workflow_call:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      
      - run: npm run test:coverage
        name: Run Tests
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          fail_ci_if_error: true
          
  update:
    runs-on: ubuntu-latest
    needs: test
    steps:
      # ... existing update job ...
```

---

## Documentation to Create

### 1. TESTING.md
- How to run tests
- Writing new tests
- Test conventions
- Mocking patterns

### 2. TEST-COVERAGE.md
- Current coverage stats
- Coverage by module
- Untested code explanation
- Coverage targets

### 3. BUG-FIXES.md
- 5 bugs identified
- Fix implementation
- Regression tests

---

## Next Steps

1. Week 1, Day 1: Install testing dependencies
2. Week 1, Day 2-3: Write EnergyDataManager tests
3. Week 1, Day 4-5: Write Metrics tests
4. Week 1, Day 6-7: Write Merge Strategy tests
5. Week 2, Day 1-2: Write Export tests
6. Week 2, Day 3-5: Write Component tests
7. Week 2, Day 6-7: Write E2E tests + CI/CD
8. Week 3, Day 1-2: Performance & A11y tests
9. Week 3, Day 3-5: Documentation
10. Week 3, Day 6-7: Review & polish

Total effort: 40-50 hours over 3 weeks
