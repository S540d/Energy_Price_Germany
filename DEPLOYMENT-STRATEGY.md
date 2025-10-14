# 🚀 Deployment Strategy Documentation

## 📊 Overview

Since **October 14, 2025**, the application uses a **triple-redundant deployment strategy** to ensure reliable and timely updates to GitHub Pages.

## 🎯 Problem & Solution

### Problem
- Automatic deployment after data updates was unreliable
- GitHub Actions don't automatically trigger other actions from bot commits (security feature)
- Users saw outdated data on the live site even when fresh data was available

### Solution
Triple deployment strategy combining multiple triggers:
1. **Scheduled Deployment**: Guaranteed 3x daily builds
2. **Direct Trigger**: Immediate deployment after data updates
3. **Manual Deployment**: On-demand via workflow_dispatch

## 🔄 Deployment Workflows

### 1. Scheduled Deployment (`scheduled-deploy.yml`)
```yaml
Schedule: 06:00, 14:00, 22:00 UTC
Trigger:  Cron schedule + manual dispatch
Purpose:  Guaranteed backup deployment
```

**Benefits:**
- ✅ Completely independent and reliable
- ✅ Runs regardless of data update success
- ✅ Ensures maximum 8-hour staleness

### 2. Data-Triggered Deployment (`fetch.yml`)
```yaml
Trigger:  After successful data commit
Method:   gh workflow run deploy.yml
Purpose:  Fast deployment after fresh data
```

**Benefits:**
- ✅ Immediate updates when new data arrives
- ✅ Reduces latency between data fetch and live update
- ✅ Only runs when there's actually new data

### 3. Manual Deployment (`deploy.yml`)
```yaml
Trigger:  Push to main + workflow_dispatch
Purpose:  Code changes and manual intervention
```

**Benefits:**
- ✅ Standard deployment for code changes
- ✅ Manual override capability
- ✅ Can be triggered by other workflows

## 📋 Deployment Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│              When Does Deployment Happen?                │
└─────────────────────────────────────────────────────────┘

Every Day:
├─ 06:00 UTC → Scheduled Deployment ✓
├─ 14:00 UTC → Scheduled Deployment ✓
└─ 22:00 UTC → Scheduled Deployment ✓

When Data Updates (08:00-20:00 UTC hourly):
├─ New data found? 
│  ├─ YES → Commit + Trigger deploy.yml ✓
│  └─ NO  → Skip (no deployment needed)

When Code Changes:
└─ Push to main → deploy.yml runs ✓

Manual:
└─ workflow_dispatch → Any workflow on demand ✓
```

## ⏰ Typical Daily Schedule

### Morning (CET/CEST)
- **07:00/08:00**: Scheduled deployment
- **09:00-12:00**: Data fetches every hour → deployments if new data

### Afternoon
- **15:00/16:00**: Scheduled deployment  
- **13:00-21:00**: Data fetches every hour → deployments if new data

### Night
- **23:00/00:00**: Scheduled deployment
- **Night**: No data fetches (energy market closed)

## 🔧 Technical Implementation

### Modified Files

#### 1. `.github/workflows/fetch.yml`
**Added:**
```yaml
- name: Trigger deployment if data changed
  if: steps.compare.outputs.new_data == 'true'
  run: |
    echo "New data detected - triggering deployment workflow"
    gh workflow run deploy.yml
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### 2. `.github/workflows/scheduled-deploy.yml` (NEW)
**Created:** Complete new workflow for scheduled deployments
- Runs 3x daily
- Independent of data updates
- Same build process as regular deployment

### Unchanged Files
- `.github/workflows/deploy.yml` - Can now be triggered by other workflows
- `.github/workflows/deploy-on-data-update.yml` - Can be deprecated/removed
- All data processing logic - Completely unchanged

## 📊 Deployment Reliability

### Before (Old Strategy)
```
Data Update → Commit → ❌ No deployment (unreliable)
Result: Manual intervention often needed
```

### After (New Strategy)
```
Data Update → Commit → ✅ Triggered deployment
PLUS: ✅ Scheduled deployment (backup)
Result: Always up-to-date within 8 hours maximum
```

## 🎯 Redundancy Levels

### Level 1: Fast Path (Minutes)
- Data fetch finds new data
- Triggers immediate deployment
- Live in ~5-10 minutes

### Level 2: Scheduled (Hours)
- Even if trigger fails
- Scheduled deployment runs
- Live within 8 hours max

### Level 3: Manual (On-Demand)
- Emergency override available
- workflow_dispatch capability
- Immediate deployment when needed

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
# - deploy.yml (main deployment)
# - fetch.yml (data fetch + trigger)
# - scheduled-deploy.yml (scheduled backup)
# - deploy-on-data-update.yml (deprecated, can be removed)
```

## 📝 Maintenance Notes

### Cleanup Recommendation
The old `deploy-on-data-update.yml` can be **safely removed** as it's now redundant:
- Scheduled deployment provides the reliability
- Direct triggering provides the speed
- Path-based trigger was unreliable anyway

### Cost Considerations
- GitHub Actions minutes: ~3-4 builds/day
- Each build: ~3-5 minutes
- Total: ~12-20 minutes/day (well within free tier)

## 🚀 Future Improvements

### Potential Enhancements
1. **Smart Scheduling**: Only deploy if data changed since last deployment
2. **Conditional Scheduled**: Skip scheduled if recent data-triggered deployment
3. **Deployment Notifications**: Slack/Discord notifications on successful deployment

### Not Recommended
- ❌ More frequent scheduled deployments (unnecessary resource usage)
- ❌ Deployment on every push (too aggressive)
- ❌ Removing scheduled backup (reduces reliability)

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

**Implementation Date**: October 14, 2025  
**Strategy Version**: 1.0  
**Status**: ✅ Active in production  
**Compatibility**: Fully compatible with DATA-MERGE-STRATEGY.md v1.0
