#!/bin/bash

# Script to clean up gh-pages branch by removing unnecessary files
# that should not be publicly accessible on GitHub Pages

set -e

echo "🧹 Starting gh-pages branch cleanup..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Checkout gh-pages branch
echo "📂 Switching to gh-pages branch..."
git checkout gh-pages

# List of files/directories to remove (should NOT be on public GitHub Pages)
FILES_TO_REMOVE=(
    "credentials.json"
    "Keystore/"
    ".vscode/"
    ".husky/"
    "node_modules/"
    ".templates/"
    ".venv/"
    "Android_old/"
    "Playstore_apps/"
    "coverage/"
    "test-results/"
    ".env"
    ".env.local"
    "*.log"
    "npm-debug.log"
    "yarn-debug.log"
    "yarn-error.log"
)

# Files to keep in root (production deployment)
KEEP_IN_ROOT=(
    "index.html"
    "manifest.json"
    "service-worker.js"
    "pwa-update.js"
    "robots.txt"
    "sitemap.xml"
    "_expo/"
    "icon-*.png"
    "icon.png"
    "screenshot*.png"
    "metadata.json"
    ".nojekyll"
    ".well-known/"
    "staging/"
    "testing/"
)

echo ""
echo "🗑️  Removing sensitive and unnecessary files..."

REMOVED_COUNT=0

for item in "${FILES_TO_REMOVE[@]}"; do
    if [ -e "$item" ] || [ -d "$item" ]; then
        echo "   Removing: $item"
        git rm -rf "$item" 2>/dev/null || rm -rf "$item"
        REMOVED_COUNT=$((REMOVED_COUNT + 1))
    fi
done

# Check for any .gitignore patterns that shouldn't be public
if [ -f .gitignore ]; then
    echo "   ℹ️  Note: .gitignore exists on gh-pages (this is unusual)"
fi

echo ""
echo "📊 Cleanup Summary:"
echo "   Files/directories removed: $REMOVED_COUNT"

# Check git status
if git diff --cached --quiet; then
    echo ""
    echo "✅ No changes needed - gh-pages is already clean!"
else
    echo ""
    echo "📝 Changes staged for commit:"
    git status --short

    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git commit -m "chore: Clean up sensitive and unnecessary files from gh-pages

- Removed development files (node_modules, .vscode, etc.)
- Removed sensitive credentials and keystores
- Removed build artifacts and test coverage
- Keep only production PWA files

This cleanup improves security and may help with Google Safe Browsing."

        echo ""
        echo "✅ Changes committed!"
        echo ""
        read -p "Push to origin/gh-pages? (y/n) " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin gh-pages
            echo "✅ Pushed to remote!"
        else
            echo "⏸️  Changes committed locally but not pushed."
            echo "   Run 'git push origin gh-pages' when ready."
        fi
    else
        echo "⏸️  Changes not committed. Run 'git diff --cached' to review."
        echo "   To commit: git commit -m 'chore: Clean up gh-pages'"
    fi
fi

echo ""
echo "🔙 Switching back to original branch: $CURRENT_BRANCH"
git checkout "$CURRENT_BRANCH"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Check Google Safe Browsing status at:"
echo "      https://transparencyreport.google.com/safe-browsing/search"
echo "   2. If still flagged, request a review via Google Search Console"
echo "   3. Monitor your site for a few days"
echo ""
