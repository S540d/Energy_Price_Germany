# Release Checklist v1.2.0

## ✅ Issue #35 - Release 1.2 as TWA in Google App Store

### Status Overview
- [x] Developer Zugang freigeschaltet
- [x] Testgerät
- [x] Code vorbereitet
- [x] Manifest
- [x] Datenschutzerklärung
- [x] Beschreibung
- [x] Icon
- [ ] Testbericht (Manual testing required)
- [x] Auf richtiges Icon achten

---

## 📋 Completed Tasks

### 1. Version Bump ✅
- [x] App.tsx: APP_VERSION = '1.2.0'
- [x] app.json: version = '1.2.0'
- [x] app.json: android.versionCode = 5
- [x] package.json: version = '1.2.0'

### 2. Code Preparation ✅
- [x] SafeAreaView migrated to react-native-safe-area-context (Issue #59 fix)
- [x] SafeAreaProvider wrapper added for Android 15+ edge-to-edge support
- [x] Missing data visualization improved (dashed placeholders + info badge)
- [x] UX Guidelines implemented (Design Guidelines compliance)
- [x] Settings menu restructured (3 sections: App Settings, About, Support)
- [x] Support link text changed to "Support the Project"
- [x] GitHub repository link added
- [x] Bug report link added (GitHub Issues)

### 3. Manifest (app.json) ✅
- [x] Version and versionCode updated
- [x] Description added for store
- [x] Keywords added: energy, electricity, prices, renewable, germany, market, visualization, charts
- [x] Category set: utilities
- [x] playStoreUrl added for Android
- [x] Edge-to-edge enabled: true
- [x] Permissions verified: INTERNET, ACCESS_NETWORK_STATE only

### 4. Privacy Policy ✅
- [x] PRIVACY_POLICY.md created (bilingual: EN & DE)
- [x] No data collection statement
- [x] Internet permissions explained
- [x] Third-party services documented (Energy Charts API)
- [x] Children's privacy compliance
- [x] Open source reference included
- [x] Contact information provided

### 5. Store Description ✅
- [x] STORE_DESCRIPTION.md created (bilingual: EN & DE)
- [x] Short description (under 80 chars)
- [x] Full description with features, benefits, and use cases
- [x] Keywords optimized for SEO
- [x] Links included (GitHub, Privacy Policy, Website)
- [x] Version 1.2.0 features highlighted

### 6. Icons ✅
- [x] Icon files present in assets/
  - icon.png (1.2M)
  - adaptive-icon.png (1.2M)
  - splash-icon.png (1.2M)
  - favicon.png (3.1K)

---

## 🚀 Ready for Release

### Build Commands
```bash
# Preview build
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

### Next Steps (Manual)
1. [ ] Test app on physical Android device
2. [ ] Create test report (Testbericht)
3. [ ] Build production AAB with EAS
4. [ ] Submit to Google Play Store (Internal Testing track)
5. [ ] Fill out store listing with data from STORE_DESCRIPTION.md
6. [ ] Upload screenshots
7. [ ] Submit for review

---

## 📄 Store Compliance

### Google Play Store Requirements
- ✅ No ads declaration: Correct (no ads in app)
- ✅ Data safety: No data collected
- ✅ Privacy policy: Available at GitHub
- ✅ Target SDK: 35 (Android 15+) via Expo SDK 54
- ✅ Edge-to-edge support: Implemented with SafeAreaProvider
- ✅ Deprecated APIs removed: SafeAreaView replaced

### Apple App Store (Future)
- Bundle identifier ready: com.sven4321.energypricegermany
- iOS configuration in app.json present
- Can be submitted when ready

---

## 🔗 Important Links

- GitHub Repository: https://github.com/S540d/Energy_Price_Germany
- Privacy Policy: PRIVACY_POLICY.md
- Store Description: STORE_DESCRIPTION.md
- Design Guidelines: DESIGN_GUIDELINES.md
- Issue #35: https://github.com/S540d/Energy_Price_Germany/issues/35
- Issue #59: https://github.com/S540d/Energy_Price_Germany/issues/59

---

**Version 1.2.0 is ready for Google Play Store submission! 🎉**
