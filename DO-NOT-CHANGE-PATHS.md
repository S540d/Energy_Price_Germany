# 🚫 DO NOT CHANGE DATA PATHS!

## ⚠️ CRITICAL: Path Configuration

The data path has been changed **4 times** in the project history, causing confusion and deployment issues.

**Current FINAL path:** `public/data/marketdata.json`

## 📍 If you MUST change the path:

1. Read `DATA-PATH-DOCUMENTATION.md` completely
2. Update `config.js` FIRST
3. Follow the migration plan step-by-step
4. Test locally before deploying
5. Update this warning

## 🔗 Affected Files:
- `config.js` (UPDATE FIRST)
- `update-marketdata.js`
- `scripts/post-build.js`
- `services/energyDataManager.ts`
- `update-cache-version.js`
- `.github/workflows/fetch.yml`

---

**Last path change:** 2025-10-12  
**Reason:** Consolidate all data in `/data/` subdirectory  
**Changed by:** System refactoring to prevent future path changes
