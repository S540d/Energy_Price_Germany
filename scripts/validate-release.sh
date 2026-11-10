#!/bin/bash
# ==============================================================================
# Release-Prüfung vor Release-PR testing → main bzw. vor dem Android-Build
# Usage: npm run validate
#
# Prüft nur, was CI und Pre-Commit-Hook nicht abdecken oder was vor einem
# Release zusätzlich gelten muss. Lint, Tests und Typecheck laufen hier
# trotzdem, weil PRs gegen testing in CI nur 2 Checks haben.
# Fehler → Exit 1. Warnungen → Exit 0.
# ==============================================================================

set -u

cd "$(dirname "${BASH_SOURCE[0]}")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; WARNINGS=$((WARNINGS + 1)); }
fail() { echo -e "${RED}❌ $1${NC}"; ERRORS=$((ERRORS + 1)); }

# --- 1. Versionen --------------------------------------------------------------
echo "📦 Versionen"
PKG=$(node -p "require('./package.json').version")
APP_JSON=$(node -p "require('./app.json').expo.version")
APP_TSX=$(sed -nE "s/^const APP_VERSION = '([^']+)';.*/\1/p" App.tsx)
LOCK=$(node -p "require('./package-lock.json').version")
CODE=$(node -p "require('./app.json').expo.android.versionCode")
echo "   package.json $PKG · package-lock.json $LOCK · app.json $APP_JSON (vc$CODE) · App.tsx $APP_TSX"

if [ "$PKG" = "$APP_JSON" ] && [ "$PKG" = "$APP_TSX" ] && [ "$PKG" = "$LOCK" ]; then
  ok "Versionen konsistent"
else
  fail "Versionen weichen voneinander ab"
fi

if grep -qE "^## \[$PKG\]" CHANGELOG.md; then
  ok "CHANGELOG enthält Abschnitt [$PKG]"
else
  fail "CHANGELOG.md hat keinen Abschnitt [$PKG]"
fi

# Vergleich mit dem zuletzt veröffentlichten Stand (Git-Tag = Play-Store-Upload)
git fetch -q --tags origin 2>/dev/null || true
LAST_TAG=$(git tag -l 'v*' --sort=-v:refname | head -1)
if [ -z "$LAST_TAG" ]; then
  warn "kein Git-Tag v* gefunden – versionCode nicht gegen letztes Release geprüft"
else
  LAST_CODE=$(git show "$LAST_TAG:app.json" 2>/dev/null | node -e \
    "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).expo.android.versionCode)}catch{console.log('')}})")
  if [ -z "$LAST_CODE" ]; then
    warn "versionCode aus $LAST_TAG nicht lesbar"
  elif [ "$CODE" -gt "$LAST_CODE" ]; then
    ok "versionCode $CODE > $LAST_CODE ($LAST_TAG)"
  else
    fail "versionCode $CODE ist nicht größer als $LAST_CODE ($LAST_TAG) – Play Store lehnt den Upload ab"
  fi
  if git rev-parse -q --verify "refs/tags/v$PKG" >/dev/null; then
    warn "Tag v$PKG existiert bereits – Version vor dem Release erhöhen?"
  fi
fi

# --- 2. R8 (#540) ----------------------------------------------------------------
echo ""
echo "🤖 Android R8"
if node -e "const c=require('./app.config.js');const cfg=(typeof c==='function'?c({config:require('./app.json').expo}):c);const p=(cfg.expo||cfg).plugins||[];const b=p.find(x=>Array.isArray(x)&&x[0]==='expo-build-properties');process.exit(b&&b[1].android&&b[1].android.enableMinifyInReleaseBuilds===true&&b[1].android.enableShrinkResourcesInReleaseBuilds===true?0:1)" 2>/dev/null; then
  ok "app.config.js aktiviert Minify und Resource-Shrinking"
else
  fail "app.config.js: expo-build-properties ohne enableMinifyInReleaseBuilds/enableShrinkResourcesInReleaseBuilds"
fi
AAB=android/app/build/outputs/bundle/release/app-release.aab
if [ -f "$AAB" ]; then
  if node scripts/verify-aab.js "$AAB"; then ok "AAB geprüft"; else fail "AAB-Prüfung fehlgeschlagen"; fi
else
  echo "   (kein AAB gebaut – nach dem Build: npm run verify:aab)"
fi

# --- 3. Code-Qualität ----------------------------------------------------------
echo ""
echo "🔍 Typecheck, Lint, Tests"
if npx tsc --noEmit >/dev/null 2>&1; then ok "tsc --noEmit"; else fail "tsc --noEmit (Details: npx tsc --noEmit)"; fi
if npm run -s lint >/dev/null 2>&1; then ok "lint"; else fail "lint (Details: npm run lint)"; fi
if npm run -s test:coverage >/dev/null 2>&1; then ok "test:coverage inkl. Schwellen"; else fail "test:coverage (Details: npm run test:coverage)"; fi
if node scripts/audit-gate.mjs --level=high >/dev/null 2>&1; then
  ok "Audit-Gate (high)"
else
  fail "Audit-Gate (Details: node scripts/audit-gate.mjs --level=high)"
fi

# --- 4. Git ----------------------------------------------------------------------
echo ""
echo "🔀 Git"
if [ -n "$(git status --porcelain)" ]; then
  warn "uncommittete Änderungen"
  git status --short
else
  ok "Arbeitsverzeichnis sauber"
fi

# --- Ergebnis --------------------------------------------------------------------
echo ""
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ Release-Prüfung fehlgeschlagen: $ERRORS Fehler, $WARNINGS Warnung(en)${NC}"
  exit 1
fi
echo -e "${GREEN}🎉 Release-Prüfung für v$PKG bestanden${NC} ($WARNINGS Warnung(en))"
echo "Danach: Release-PR testing → main (nur mit Freigabe), Android-Build mit"
echo "npm run android:prebuild → bundleRelease → npm run verify:aab, Upload, git tag v$PKG"
