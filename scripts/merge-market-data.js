#!/usr/bin/env node

const fs = require("fs");

// Interpolate aWATTar hourly data to 15-minute intervals
function interpolateAwattarData(raw) {
  raw.data.sort((a, b) => a.start_timestamp - b.start_timestamp);
  const interpolated = [];

  for (let i = 0; i < raw.data.length; i++) {
    const current = raw.data[i];

    // Create 4 x 15-minute intervals from each hourly data point
    for (let j = 0; j < 4; j++) {
      const intervalStart = current.start_timestamp + j * 15 * 60 * 1000;
      const intervalEnd = intervalStart + 15 * 60 * 1000;

      interpolated.push({
        start_timestamp: intervalStart,
        end_timestamp: intervalEnd,
        marketprice: current.marketprice,
        renewable_share: null,
        unit: current.unit,
        interpolated: j > 0  // First interval (j=0) is real data, rest are interpolated
      });
    }
  }
  return interpolated;
}

// Main merge logic
try {
  let finalData = [];
  let source = "";

  // Check if Energy Charts data exists
  if (fs.existsSync("public/data/energycharts_temp.json")) {
    const energyChartsData = JSON.parse(fs.readFileSync("public/data/energycharts_temp.json", "utf8"));
    console.log("Energy Charts data available with " + energyChartsData.data.length + " points");

    // Get last timestamp from Energy Charts
    const lastECTimestamp = energyChartsData.data[energyChartsData.data.length - 1].end_timestamp;
    const lastECDate = new Date(lastECTimestamp);
    console.log("Energy Charts last timestamp: " + lastECDate.toISOString());

    // Load aWATTar data (no interpolation)
    if (fs.existsSync("public/data/marketdata_raw.json")) {
      const awattarRaw = JSON.parse(fs.readFileSync("public/data/marketdata_raw.json", "utf8"));
      const awattarData = interpolateAwattarData(awattarRaw);
      console.log("aWATTar data interpolated to " + awattarData.length + " points (15-min intervals)");

      // Get last timestamp from aWATTar
      const lastAWTimestamp = awattarData[awattarData.length - 1].end_timestamp;
      const lastAWDate = new Date(lastAWTimestamp);
      console.log("aWATTar last timestamp: " + lastAWDate.toISOString());

      // Calculate time difference in hours
      const timeDiffMs = lastAWTimestamp - lastECTimestamp;
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
      console.log("Time difference: " + timeDiffHours.toFixed(2) + " hours");

      // Only supplement if difference is >= 3 hours
      if (timeDiffHours >= 3) {
        console.log("Supplementing Energy Charts with aWATTar data (difference >= 3h)");

        // Filter aWATTar data: only data AFTER last Energy Charts timestamp
        // Note: aWATTar data has renewable_share = null (no enrichment)
        const supplementalData = awattarData.filter(item =>
          item.start_timestamp >= lastECTimestamp
        );

        console.log("Adding " + supplementalData.length + " supplemental data points from aWATTar");

        // Merge: Energy Charts + supplemental aWATTar
        finalData = [...energyChartsData.data, ...supplementalData];
        source = "energy-charts";
      } else {
        console.log("No supplement needed (difference < 3h), using Energy Charts only");
        finalData = energyChartsData.data;
        source = "energy-charts";
      }
    } else {
      console.log("aWATTar data not available, using Energy Charts only");
      finalData = energyChartsData.data;
      source = "energy-charts";
    }

    // Clean up temp file
    fs.unlinkSync("public/data/energycharts_temp.json");
  } else {
    // Fallback: Energy Charts failed, use aWATTar only
    console.log("Energy Charts data not available, falling back to aWATTar");
    if (!fs.existsSync("public/data/marketdata_raw.json")) {
      console.error("ERROR: No data available from either source!");
      process.exit(1);
    }
    const awattarRaw = JSON.parse(fs.readFileSync("public/data/marketdata_raw.json", "utf8"));
    finalData = interpolateAwattarData(awattarRaw);
    source = "awattar";
    console.log("Using aWATTar data with " + finalData.length + " points (interpolated to 15-min)");
  }

  // Sort final data
  finalData.sort((a, b) => a.start_timestamp - b.start_timestamp);

  // Merge with existing data to preserve history
  let mergedData = finalData;

  if (fs.existsSync("public/data/marketdata.json")) {
    try {
      const existingData = JSON.parse(fs.readFileSync("public/data/marketdata.json", "utf8"));
      if (existingData.data && Array.isArray(existingData.data)) {
        console.log("Merging with existing " + existingData.data.length + " data points...");

        // Create a map of new data by timestamp for quick lookup
        const newDataMap = new Map();
        finalData.forEach(item => {
          newDataMap.set(item.start_timestamp, item);
        });

        // Keep old data that's not in new data (preserve history)
        const oldDataToKeep = existingData.data.filter(item =>
          !newDataMap.has(item.start_timestamp)
        );

        // Merge: old data + new data
        mergedData = [...oldDataToKeep, ...finalData];

        // Sort by timestamp
        mergedData.sort((a, b) => a.start_timestamp - b.start_timestamp);

        // Limit to last 7 days to avoid unbounded growth
        const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        const cutoffTime = Date.now() - maxAgeMs;
        const beforeCount = mergedData.length;
        mergedData = mergedData.filter(item => item.start_timestamp >= cutoffTime);

        if (beforeCount > mergedData.length) {
          console.log("Removed " + (beforeCount - mergedData.length) + " old data points (> 7 days)");
        }

        console.log("Merged: " + oldDataToKeep.length + " old + " + finalData.length + " new = " + mergedData.length + " total");
      }
    } catch (error) {
      console.log("Could not merge with existing data: " + error.message);
    }
  }

  // Write final output
  fs.writeFileSync("public/data/marketdata_new.json", JSON.stringify({
    object: "list",
    source: source,
    data: mergedData
  }, null, 2));

  console.log("Final dataset: " + mergedData.length + " points, source: " + source);
  console.log("✓ Successfully created marketdata_new.json");

} catch (error) {
  console.error("Error merging data:", error);
  process.exit(1);
} finally {
  // Clean up temporary files
  if (fs.existsSync("public/data/marketdata_raw.json")) {
    fs.unlinkSync("public/data/marketdata_raw.json");
  }
  if (fs.existsSync("public/data/energycharts_temp.json")) {
    fs.unlinkSync("public/data/energycharts_temp.json");
  }
}
