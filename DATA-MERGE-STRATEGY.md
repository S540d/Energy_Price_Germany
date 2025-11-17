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
          Data: AW only (hourly, no interpolation)
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

### Energy Charts Data Points (15-minute intervals)
```json
{
  "start_timestamp": 1728748800000,
  "end_timestamp": 1728749700000,  // 15 minutes later
  "marketprice": 85.52,
  "renewable_share": 26.0,
  "unit": "Eur/MWh",
  "interpolated": false
}
```

### Supplemental aWATTar Data Points (interpolated to 15-minute intervals)
```json
{
  "start_timestamp": 1728835200000,
  "end_timestamp": 1728835900000,  // 15 minutes later
  "marketprice": 93.45,
  "renewable_share": null,  // ← aWATTar has no renewable data
  "unit": "Eur/MWh",
  "interpolated": false  // ← First 15-min of hour = real data
}
{
  "start_timestamp": 1728835900000,
  "end_timestamp": 1728836800000,  // 15 minutes later
  "marketprice": 93.45,
  "renewable_share": null,  // ← aWATTar has no renewable data
  "unit": "Eur/MWh",
  "interpolated": true  // ← 2nd, 3rd, 4th 15-min = interpolated
}
```

**Note**: aWATTar hourly data is interpolated to 15-minute intervals:
- First 15-min interval (j=0): `interpolated: false` (real hourly value)
- Subsequent intervals (j>0): `interpolated: true` (interpolated from hourly)
- aWATTar has **no renewable_share data** (always `null`)
- Charts display interpolated values with dimmed opacity (0.4 vs 0.9)
- **Missing renewable data** shown as grey fading bars (random height based on last valid value)
- New Energy Charts data automatically overwrites aWATTar+interpolated data

## 📈 Typical Results

### Before Supplementation
- **Source**: Energy Charts only
- **Coverage**: ~24 hours
- **Data points**: 96 (15-min intervals)
- **Renewable data**: Complete

### After Supplementation
- **Source**: Energy Charts (supplemented)
- **Coverage**: ~46 hours
- **Data points**: 184 (96 EC @ 15min + 88 AW interpolated @ 15min)
- **Renewable data**: First 24h complete, then null
- **Resolution**: Uniform 15-min (EC real, AW interpolated with markers)

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
aWATTar:       00:00 → 23:00 (24 points, 24h)

Result:
├─ Use: AW[00:00-23:00] only
├─ Total: 24 points (hourly, no interpolation)
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

- **Frequency**: 2x daily at 12:00 and 15:00 UTC (`0 12,15 * * *`)
- **Why these times**: Day-Ahead prices are published ~12:00-13:00 CET
- **Trigger**: Cron schedule + manual dispatch available
- **Auto-deploy**: Changes trigger automatic rebuild and deployment
- **Compare Logic**: Commits when max timestamp changes (simple, reliable)

## 🎯 Benefits

1. ✅ **Extended Coverage**: Up to 43+ hours instead of 24 hours
2. ✅ **Quality Preserved**: Energy Charts data with renewable share for first 24h
3. ✅ **Resilience**: Automatic fallback if primary source fails
4. ✅ **Efficiency**: Only supplements when gap is significant (≥3h)
5. ✅ **Transparency**: Source field clearly indicates data origin

## 💾 Data Storage Strategy

### Current Storage Usage
- **marketdata.json**: ~70-150KB (7 days of 15-min data = ~672 points)
- **Archive per update**: ~70-150KB (full 7-day snapshot)
- **Updates**: 2x daily (12:00 + 15:00 UTC)

### Retention Policy
- **Live data** (`marketdata.json`): 7 days rolling window
- **Archives**: 90 days retention, then auto-cleanup
- **Cleanup**: Automatic during each data update

### Storage Calculations (100MB budget)
```
Per update: ~150KB
Per day: 2 × 150KB = 300KB
Per month: 30 × 300KB = ~9MB
90 days: 90 × 300KB = ~27MB

Total with buffer: ~30MB / 100MB = 30% utilization
Runway: 100MB / 300KB = ~333 days (~11 months)
```

### Archive Structure
```
public/data/
├── marketdata.json          # Current live data (7 days)
└── archive/
    ├── marketdata_2025-11-17T12.json
    ├── marketdata_2025-11-17T15.json
    └── ... (90 days of snapshots)
```

### Cleanup Process
The GitHub Actions workflow automatically:
1. Creates new archive with timestamp
2. Removes archives older than 90 days
3. Commits both additions and deletions

## 📝 Maintenance Notes

- No path changes required (data paths remain consistent)
- Config.js unchanged (only API logic modified)
- Frontend components work transparently with supplemented data
- Archive system automatically cleans up old files
- Storage growth is bounded by 90-day retention limit

---

**Last Updated**: November 17, 2025
**Strategy Version**: 3.0 (simplified, robust, no enrichment)
**Status**: ✅ Active in production

## 📝 Version History

### v3.0 (November 17, 2025)
- **Simplified strategy**: Removed complex renewable enrichment
- **2x daily updates**: 12:00 + 15:00 UTC (when Day-Ahead prices available)
- **No renewable_map.json**: aWATTar data stays as-is (renewable_share = null)
- **Simple compare logic**: Only checks if max timestamp changed
- **Grey fading bars**: Frontend shows missing renewable data clearly
- **Rationale**: Previous enrichment was unreliable (EC API inconsistent)
- **Result**: Stable, predictable, transparent data pipeline

### v2.2 (November 16, 2025)
- **Renewable enrichment**: aWATTar data is enriched with EC renewable forecasts
- **24/7 updates**: Changed from 11:00-20:00 UTC to hourly around the clock
- **Improved compare logic**: Detects renewable data changes, not just timestamp changes
- **Key insight**: EC renewable forecast extends 48h (vs 24h for prices)
- **Result**: Tomorrow's aWATTar prices now include renewable share data!
- **Technical**: Saves `renewable_map.json` temporarily for cross-source enrichment
- **DEPRECATED**: Removed in v3.0 due to unreliable EC renewable forecast availability

### v2.1 (November 15, 2025)
- **Re-enabled aWATTar interpolation** with proper marking
- **Interpolation markers**: First 15-min = real data, rest = interpolated
- **Visual distinction**: Interpolated values displayed with dimmed opacity (0.4)
- **Auto-replacement**: New Energy Charts data overwrites aWATTar+interpolated data
- **Extended retention**: Data kept for 7 days instead of 48 hours
- **Benefit**: Smooth charts with clear indication of interpolated vs real data

### v2.0 (November 15, 2025)
- **Removed aWATTar interpolation**: No longer interpolates hourly data to 15-minute intervals
- **Data integrity**: aWATTar data keeps original 1-hour resolution
- **Mixed resolution**: Charts now display EC (15-min) + AW (60-min) at native intervals
- **Benefit**: No artificial data, only real measurements

### v1.0 (October 12, 2025)
- Initial hybrid data strategy
- aWATTar data was interpolated to 15-minute intervals
