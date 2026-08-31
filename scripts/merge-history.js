#!/usr/bin/env node
// Merge a freshly fetched marketdata_new.json with the existing marketdata.json
// so that a failed/empty ren_share_forecast (or price) fetch doesn't wipe out
// history that isn't covered by the fresh fetch's timestamps (Issue #425).
// Mirrors the merge logic scripts/merge-market-data.js already applies for DE.
//
// Usage: node scripts/merge-history.js <dataDir>
// Reads <dataDir>/marketdata_new.json + <dataDir>/marketdata.json,
// writes the merged result back to <dataDir>/marketdata_new.json.

const fs = require("fs");
const path = require("path");

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function mergeHistory(dataDir) {
  const newFile = path.join(dataDir, "marketdata_new.json");
  const existingFile = path.join(dataDir, "marketdata.json");

  if (!fs.existsSync(newFile)) {
    console.error(`ERROR: ${newFile} not found`);
    process.exit(1);
  }

  const newDataset = JSON.parse(fs.readFileSync(newFile, "utf8"));
  const finalData = Array.isArray(newDataset.data) ? newDataset.data : [];

  if (!fs.existsSync(existingFile)) {
    console.log(`No existing ${existingFile}, nothing to merge`);
    return;
  }

  try {
    const existingData = JSON.parse(fs.readFileSync(existingFile, "utf8"));
    if (!existingData.data || !Array.isArray(existingData.data)) {
      return;
    }

    console.log("Merging with existing " + existingData.data.length + " data points...");

    const newDataMap = new Map();
    finalData.forEach(item => newDataMap.set(item.start_timestamp, item));

    // Keep old data that's not in the new fetch (preserve history)
    const oldDataToKeep = existingData.data.filter(item => !newDataMap.has(item.start_timestamp));

    let mergedData = [...oldDataToKeep, ...finalData];
    mergedData.sort((a, b) => a.start_timestamp - b.start_timestamp);

    const cutoffTime = Date.now() - MAX_AGE_MS;
    const beforeCount = mergedData.length;
    mergedData = mergedData.filter(item => item.start_timestamp >= cutoffTime);
    if (beforeCount > mergedData.length) {
      console.log("Removed " + (beforeCount - mergedData.length) + " old data points (> 7 days)");
    }

    console.log(
      "Merged: " + oldDataToKeep.length + " old + " + finalData.length + " new = " + mergedData.length + " total"
    );

    newDataset.data = mergedData;
    fs.writeFileSync(newFile, JSON.stringify(newDataset, null, 2));
  } catch (error) {
    console.log("Could not merge with existing data: " + error.message);
  }
}

if (require.main === module) {
  const dataDir = process.argv[2];
  if (!dataDir) {
    console.error("Usage: node scripts/merge-history.js <dataDir>");
    process.exit(1);
  }
  mergeHistory(dataDir);
}

module.exports = { mergeHistory };
