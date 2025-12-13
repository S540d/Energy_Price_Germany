#!/bin/bash

# ==============================================================================
# 🚀 Release Validation Script
# ==============================================================================
# Automatisierte Prüfung aller Release-Anforderungen
# Usage: ./scripts/validate-release.sh
# ==============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=================================================="
echo "🚀 Release Validation für 1x1 Trainer"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# ==============================================================================
# 1. VERSION CONSISTENCY
# ==============================================================================
echo "📦 Checking version consistency..."

PACKAGE_VERSION=$(node -p "require('./package.json').version")
APP_JSON_VERSION=$(node -p "require('./app.json').expo.version")
APP_VERSION=$(grep "APP_VERSION = " App.tsx | sed -E "s/.*'(.*)'.*/\1/")
GRADLE_VERSION=$(grep "versionName = " Android/app/build.gradle.kts | sed -E 's/.*"(.*)".*/\1/')
GRADLE_CODE=$(grep "versionCode = " Android/app/build.gradle.kts | sed -E 's/.*= ([0-9]+).*/\1/')
APP_JSON_CODE=$(node -p "require('./app.json').expo.android.versionCode")

echo "  package.json:     v$PACKAGE_VERSION"
echo "  app.json:         v$APP_JSON_VERSION (versionCode: $APP_JSON_CODE)"
echo "  App.tsx:          v$APP_VERSION"
echo "  build.gradle.kts: v$GRADLE_VERSION (versionCode: $GRADLE_CODE)"

if [ "$PACKAGE_VERSION" != "$APP_JSON_VERSION" ] || \
   [ "$PACKAGE_VERSION" != "$APP_VERSION" ] || \
   [ "$PACKAGE_VERSION" != "$GRADLE_VERSION" ]; then
  echo -e "${RED}❌ ERROR: Version mismatch!${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ All versions consistent${NC}"
fi

if [ "$GRADLE_CODE" != "$APP_JSON_CODE" ]; then
  echo -e "${RED}❌ ERROR: Android versionCode mismatch!${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Android versionCode consistent${NC}"
fi

echo ""

# ==============================================================================
# 2. CODE QUALITY CHECKS
# ==============================================================================
echo "🔍 Code Quality Checks..."

# Check for console.log
if grep -r "console\.log\|console\.debug" App.tsx 2>/dev/null; then
  echo -e "${RED}❌ ERROR: Found console.log/debug in production code!${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No console.log found${NC}"
fi

# Check for unsafe Web APIs
if grep -n "window\." App.tsx | grep -v "Platform.OS === 'web'" | grep -v "// platform-safe"; then
  echo -e "${RED}❌ ERROR: Found window.* without Platform.OS check!${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ All window.* calls are platform-safe${NC}"
fi

if grep -n "localStorage\." App.tsx | grep -v "Platform.OS === 'web'" | grep -v "// platform-safe"; then
  echo -e "${RED}❌ ERROR: Found localStorage without Platform.OS check!${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ All localStorage calls are platform-safe${NC}"
fi

echo ""

# ==============================================================================
# 3. UX GUIDELINES COMPLIANCE
# ==============================================================================
echo "🎨 UX Guidelines Compliance..."

# Check for gear emoji (should use three dots)
if grep -q "⚙" App.tsx; then
  echo -e "${RED}❌ ERROR: Found gear emoji! Use three vertical dots (⋮) instead${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Settings icon correct (three dots)${NC}"
fi

# Check for Light theme (should only have System/Dark)
if grep -q "themeMode === 'light'" App.tsx; then
  echo -e "${YELLOW}⚠️  WARNING: Light theme found. Consider System/Dark toggle only${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ==============================================================================
# 4. BUILD TESTS
# ==============================================================================
echo "🔨 Build Tests..."

# Web Build
echo "  Testing Web build..."
if npm run build:web >/dev/null 2>&1; then
  echo -e "${GREEN}  ✅ Web build successful${NC}"
else
  echo -e "${RED}  ❌ Web build failed!${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Android Build
echo "  Testing Android build..."
if cd Android && ./gradlew assembleRelease --quiet >/dev/null 2>&1; then
  echo -e "${GREEN}  ✅ Android build successful${NC}"
  cd ..
else
  echo -e "${RED}  ❌ Android build failed!${NC}"
  ERRORS=$((ERRORS + 1))
  cd ..
fi

echo ""

# ==============================================================================
# 5. FILE EXISTENCE CHECKS
# ==============================================================================
echo "📄 Required Files..."

REQUIRED_FILES=(
  "RELEASE_CHECKLIST.md"
  "POSTMORTEM_ANDROID_CRASH.md"
  ".github/PULL_REQUEST_TEMPLATE.md"
  "utils/platform.ts"
  "Android/release/1x1-trainer-v$PACKAGE_VERSION-signed.aab"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}  ✅ $file${NC}"
  else
    echo -e "${YELLOW}  ⚠️  Missing: $file${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
done

echo ""

# ==============================================================================
# 6. GIT STATUS
# ==============================================================================
echo "🔀 Git Status..."

if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  WARNING: You have uncommitted changes${NC}"
  git status --short
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ Working directory clean${NC}"
fi

echo ""

# ==============================================================================
# 7. DEPENDENCY AUDIT
# ==============================================================================
echo "🔒 Security Audit..."

if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
  echo -e "${GREEN}✅ No high-severity vulnerabilities${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Vulnerabilities found${NC}"
  npm audit --audit-level=high
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
echo "=================================================="
echo "📊 VALIDATION SUMMARY"
echo "=================================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
  echo ""
  echo "✅ Ready for release v$PACKAGE_VERSION"
  echo ""
  echo "Next steps:"
  echo "  1. Test on physical Android device"
  echo "  2. Test on web browser"
  echo "  3. Create git tag: git tag v$PACKAGE_VERSION"
  echo "  4. Push: git push origin v$PACKAGE_VERSION"
  echo "  5. Upload AAB to Play Store"
  echo "  6. Deploy web: npm run deploy"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  CHECKS PASSED WITH WARNINGS${NC}"
  echo ""
  echo "Errors: $ERRORS"
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Review warnings before releasing."
  exit 0
else
  echo -e "${RED}❌ VALIDATION FAILED${NC}"
  echo ""
  echo "Errors: $ERRORS"
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Fix errors before releasing."
  exit 1
fi
