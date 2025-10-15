# 🚀 Deployment Strategy Documentation

## 📊 Overview

Since **October 15, 2025**, the application uses a **modular workflow_call deployment strategy** to ensure reliable and timely updates to GitHub Pages.

## 🎯 Problem & Solution

### Problem
- Data updates via `fetch.yml` didn't trigger deployments (GitHub Actions security feature)
- Website showed outdated data without `renewable_share` values
- Manual deployment was required after each data update

### Solution
Modular workflow_call strategy:
1. **deploy.yml** as reusable workflow (supports `workflow_call` trigger)
2. **fetch.yml** automatically calls `deploy.yml` when new data arrives
3. **Manual Deployment**: Still available via workflow_dispatch or push to main

## 🔄 Deployment Workflows

### 1. Reusable Deployment Workflow (`deploy.yml`)
```yaml
Triggers: - workflow_call (from other workflows)
          - push to main (code changes)
          - workflow_dispatch (manual)
Purpose:  Single source of truth for deployment logic
```

**Benefits:**
- ✅ Can be called by other workflows (modular)
- ✅ No duplication of deployment logic
- ✅ Standard deployment for all triggers

### 2. Data Fetch with Auto-Deploy (`fetch.yml`)
```yaml
Trigger:  Hourly (08:00-20:00 UTC) + manual dispatch
Flow:     Fetch data → Commit if changed → Call deploy.yml
Purpose:  Automatic deployment when new data arrives
```

**Benefits:**
- ✅ Immediate updates when new data arrives
- ✅ No deployment if data hasn't changed (saves resources)
- ✅ Clean separation of concerns (fetch vs. deploy)

## 📋 Deployment Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│              When Does Deployment Happen?                │
└─────────────────────────────────────────────────────────┘

Hourly Data Fetch (08:00-20:00 UTC):
├─ Fetch data from APIs
├─ New data found? 
│  ├─ YES → Commit + workflow_call(deploy.yml) ✓
│  │        └─ Website updated within ~3-5 minutes
│  └─ NO  → Skip (no deployment, saves resources)

When Code Changes:
└─ Push to main → deploy.yml triggered directly ✓
                  └─ Website updated within ~3-5 minutes

Manual:
└─ workflow_dispatch → deploy.yml or fetch.yml on demand ✓
```

## ⏰ Typical Daily Schedule

### Active Hours (08:00-20:00 UTC / 09:00-21:00 CET)
- **Every hour**: Data fetch runs
- **If new data**: Automatic deployment triggered
- **Result**: Website updates within 5 minutes of new data

### Night (20:00-08:00 UTC)
- **No automatic fetches**: Energy market data not yet available
- **Manual trigger**: Still available via workflow_dispatch if needed

## 🔧 Technical Implementation

### Modified Files

#### 1. `.github/workflows/deploy.yml`
**Added:**
```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:
  workflow_call:  # NEW: Allow other workflows to call this
```

#### 2. `.github/workflows/fetch.yml`
**Added job:**
```yaml
jobs:
  update:
    outputs:
      new_data: ${{ steps.compare.outputs.new_data }}
    # ... fetch and commit steps ...
  
  deploy:
    needs: update
    if: needs.update.outputs.new_data == 'true'
    uses: ./.github/workflows/deploy.yml  # Calls deploy.yml
    permissions:
      contents: read
      pages: write
      id-token: write
```

### Unchanged Files
- All data processing logic - Completely unchanged
- Build process - Identical to before

## 📊 Deployment Reliability

### Before (Broken)
```
Data Update → Commit → ❌ No deployment
Reason: GitHub Actions doesn't trigger workflows on commits made by workflows
Result: Manual intervention required after every data update
```

### After (workflow_call Strategy)
```
Data Update → Commit → workflow_call(deploy.yml) → ✅ Deployment
Result: Automatic deployment within 5 minutes
```

## 🎯 Advantages of workflow_call

### Why workflow_call instead of gh workflow run?

#### workflow_call (CHOSEN)
- ✅ Direct job dependency (cleaner workflow visualization)
- ✅ Runs in same workflow run (better logs)
- ✅ Native GitHub Actions feature
- ✅ Proper error propagation
- ✅ No additional permissions needed

#### gh workflow run (ALTERNATIVE)
- ❌ Indirect trigger (separate workflow run)
- ❌ Harder to track in UI
- ❌ Potential timing issues
- ❌ Requires GH_TOKEN or PAT

### Manual Override
- workflow_dispatch available on both workflows
- Can trigger deployment independently if needed
- Can re-run failed deployments

## 🔍 Monitoring & Verification

### Check Last Deployment
```bash
# Via GitHub UI
https://github.com/S540d/Energy_Price_Germany/actions

# Check live site update time
curl https://s540d.github.io/Energy_Price_Germany/
```

### Verify Deployment Strategy
```bash
# List all workflows
ls -la .github/workflows/

# Expected workflows:
# - deploy.yml (reusable deployment workflow)
# - fetch.yml (data fetch + auto-deploy)
```

## 📝 Maintenance Notes

### Workflow Structure
- **deploy.yml**: Single source of truth for deployment
- **fetch.yml**: Data fetching with conditional deployment call
- No redundant or deprecated workflows

### Cost Considerations
- GitHub Actions minutes: ~13 builds/day (1 per hour during active hours)
- Each build: ~3-5 minutes
- Total: ~40-65 minutes/day (well within free tier for public repos)

## 🚀 Future Improvements

### Potential Enhancements
1. **Deployment Notifications**: Slack/Discord notifications on deployment
2. **Deployment Analytics**: Track deployment frequency and success rate
3. **Conditional Builds**: Skip build if only data changed (faster deployments)

### Not Recommended
- ❌ Using `gh workflow run` instead of `workflow_call` (less reliable)
- ❌ Using PAT for push triggers (security risk)
- ❌ Separate scheduled deployment (unnecessary with current strategy)

## 📅 Integration with Data Strategy

This deployment strategy works seamlessly with the existing data merge strategy (see DATA-MERGE-STRATEGY.md):

```
Data Fetch (fetch.yml)
  ↓
Data Merge (Energy Charts + aWATTar)
  ↓
Commit if changed
  ↓
Trigger Deployment ← NEW
  ↓
GitHub Pages Update
```

Plus independent scheduled deployments as backup.

## ✅ Success Criteria

Deployment is considered successful when:
1. ✅ Site updates within 1 hour of new data
2. ✅ Site updates at least 3x daily
3. ✅ No manual intervention needed for regular updates
4. ✅ All workflows complete without errors

---

**Implementation Date**: October 15, 2025  
**Strategy Version**: 2.0 (workflow_call)  
**Status**: ✅ Active in production  
**Compatibility**: Fully compatible with DATA-MERGE-STRATEGY.md v1.0

**Previous Versions:**
- v1.0 (Oct 14, 2025): Documented but never implemented `gh workflow run` approach
