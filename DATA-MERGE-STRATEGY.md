# 🔗 Data Merge Strategy Documentation

## 📊 Overview

Since **October 12, 2025**, the application uses a **hybrid data strategy** that combines Energy Charts and aWATTar data to maximize forecast coverage.

## 🎯 Problem & Solution

### Problem
- **Energy Charts**: High-quality data with renewable share, but limited time horizon (~24h)
- **aWATTar**: Extended forecast horizon (~48h+), but no renewable share data

### Solution
Smart data merging that uses the best of both sources:
1. **Energy Charts** as primary source (high quality + renewable data)
2. **aWATTar** as supplement when Energy Charts coverage is insufficient
3. **aWATTar** as fallback when Energy Charts is unavailable

## 🔄 Merge Logic

```
┌─────────────────────────────────────────────────────────┐
│                  Decision Tree                           │
└─────────────────────────────────────────────────────────┘

Energy Charts available?
├─ YES → Load Energy Charts data
│         ├─ aWATTar available?
│         │  ├─ YES → Check time difference
│         │  │        ├─ Difference >= 3h? 
│         │  │        │  ├─ YES → Supplement with aWATTar
│         │  │        │  │        Source: "energy-charts"
│         │  │        │  │        Data: EC + AW (future only)
│         │  │        │  └─ NO  → Use Energy Charts only
│         │  │        │           Source: "energy-charts"
│         │  │        │           Data: EC only
│         │  └─ NO  → Use Energy Charts only
│         │           Source: "energy-charts"
│         │           Data: EC only
│         
└─ NO  → Load aWATTar as fallback
          Source: "awattar"
          Data: AW only (interpolated)
```

## 📋 Merge Rules

### Rule 1: Energy Charts Priority
- Energy Charts data is **always preferred** for its time range
- aWATTar **never overwrites** Energy Charts data

### Rule 2: 3-Hour Minimum Gap
- Supplement only if aWATTar extends coverage by **≥ 3 hours**
- Prevents unnecessary API calls and data bloat for marginal gains

### Rule 3: Future-Only Supplementation
- Only aWATTar data with `start_timestamp >= lastEnergyChartsTimestamp` is added
- Ensures no duplicates or conflicts

### Rule 4: Source Attribution
- `source` remains `"energy-charts"` when supplemented
- Only becomes `"awattar"` in complete fallback scenario

## 🔢 Data Format Consistency

### Energy Charts Data Points
```json
{
  "start_timestamp": 1728748800000,
  "end_timestamp": 1728749700000,
  "marketprice": 85.52,
  "renewable_share": 26.0,
  "unit": "Eur/MWh"
}
```

### Supplemental aWATTar Data Points
```json
{
  "start_timestamp": 1728835200000,
  "end_timestamp": 1728836100000,
  "marketprice": 93.45,
  "renewable_share": null,  // ← Always null for aWATTar
  "unit": "Eur/MWh"
}
```

## 📈 Typical Results

### Before Supplementation
- **Source**: Energy Charts only
- **Coverage**: ~24 hours
- **Data points**: 96 (15-min intervals)
- **Renewable data**: Complete

### After Supplementation
- **Source**: Energy Charts (supplemented)
- **Coverage**: ~43 hours
- **Data points**: 172 (96 EC + 76 AW)
- **Renewable data**: First 24h complete, then null

## 🛠️ Implementation Files

### Modified Files
1. **`.github/workflows/fetch.yml`**
   - Automated hourly updates via GitHub Actions
   - Fetches both APIs
   - Applies merge logic
   
2. **`update-marketdata.js`**
   - Manual local updates
   - Same merge logic as workflow
   - Better console output for debugging

### Unchanged Files
- `services/energyDataManager.ts` - Frontend loader works with any source
- `config.js` - Paths unchanged
- `services/energyApi.ts` - API endpoints unchanged

## 🔍 Example Scenarios

### Scenario 1: Normal Operation (Supplementation)
```
Energy Charts: 00:00 → 23:45 (96 points, 24h)
aWATTar:       00:00 → 18:45 (76 points, 43h)
Difference:    19 hours ✓ (>= 3h)

Result: 
├─ Use: EC[00:00-23:45] + AW[00:00-18:45]
├─ Total: 172 points
└─ Source: "energy-charts"
```

### Scenario 2: Minimal Extension (No Supplement)
```
Energy Charts: 00:00 → 23:45 (96 points, 24h)
aWATTar:       00:00 → 01:30 (106 points, 25.5h)
Difference:    1.5 hours ✗ (< 3h)

Result:
├─ Use: EC[00:00-23:45] only
├─ Total: 96 points
└─ Source: "energy-charts"
```

### Scenario 3: Energy Charts Failure (Fallback)
```
Energy Charts: ✗ Failed
aWATTar:       00:00 → 18:45 (76 points, 43h)

Result:
├─ Use: AW[00:00-18:45] only
├─ Total: 76 points (interpolated to 15-min)
└─ Source: "awattar"
```

### Scenario 4: Both APIs Failed
```
Energy Charts: ✗ Failed
aWATTar:       ✗ Failed

Result: Process exits with error (no data available)
```

## 🧪 Testing

### Local Test
```bash
# Run manual update
node update-marketdata.js

# Expected output should show:
# - Both API fetch results
# - Time difference calculation
# - Supplementation decision
# - Final coverage statistics
```

### Validation Queries
```bash
# Check data source
jq '.source' public/data/marketdata.json

# Count data points
jq '.data | length' public/data/marketdata.json

# Check for renewable_share transition
jq '.data[95:97] | .[] | {ts: .start_timestamp, renewable: .renewable_share}' public/data/marketdata.json
```

## 📅 Update Schedule

- **Frequency**: Hourly (08:00-20:00 UTC via GitHub Actions)
- **Trigger**: Cron schedule + manual dispatch available
- **Auto-deploy**: Changes trigger automatic rebuild and deployment

## 🎯 Benefits

1. ✅ **Extended Coverage**: Up to 43+ hours instead of 24 hours
2. ✅ **Quality Preserved**: Energy Charts data with renewable share for first 24h
3. ✅ **Resilience**: Automatic fallback if primary source fails
4. ✅ **Efficiency**: Only supplements when gap is significant (≥3h)
5. ✅ **Transparency**: Source field clearly indicates data origin

## 📝 Maintenance Notes

- No path changes required (DATA-PATH-DOCUMENTATION.md still valid)
- Config.js unchanged (only API logic modified)
- Frontend components work transparently with supplemented data
- Archive system continues to work as before

---

**Last Updated**: October 12, 2025  
**Strategy Version**: 1.0  
**Status**: ✅ Active in production
