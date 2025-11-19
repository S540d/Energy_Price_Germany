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

    // Check if we have renewable-only data points (marketprice === null but renewable_share !== null)
    const renewableOnlyPoints = energyChartsData.data.filter(p =>
      p.marketprice === null && p.renewable_share !== null
    );
    const priceAndRenewablePoints = energyChartsData.data.filter(p =>
      p.marketprice !== null
    );

    console.log("- Points with price+renewable: " + priceAndRenewablePoints.length);
    console.log("- Points with renewable only: " + renewableOnlyPoints.length + " (need aWATTar prices)");

    // Load aWATTar data if we have renewable-only points or for fallback
    if (fs.existsSync("public/data/marketdata_raw.json") && renewableOnlyPoints.length > 0) {
      const awattarRaw = JSON.parse(fs.readFileSync("public/data/marketdata_raw.json", "utf8"));
      const awattarData = interpolateAwattarData(awattarRaw);
      console.log("aWATTar data interpolated to " + awattarData.length + " points (15-min intervals)");

      // Create timestamp map for aWATTar prices
      const awattarPriceMap = new Map();
      awattarData.forEach(item => {
        awattarPriceMap.set(item.start_timestamp, {
          price: item.marketprice,
          interpolated: item.interpolated
        });
      });

      // Enrich Energy Charts data with aWATTar prices where marketprice is null
      let enrichedCount = 0;
      const enrichedData = energyChartsData.data.map(item => {
        if (item.marketprice === null && awattarPriceMap.has(item.start_timestamp)) {
          const awPrice = awattarPriceMap.get(item.start_timestamp);
          enrichedCount++;
          return {
            ...item,
            marketprice: awPrice.price,
            interpolated: awPrice.interpolated
          };
        }
        return item;
      });

      console.log("✓ Enriched " + enrichedCount + " renewable-only points with aWATTar prices");
      console.log("Result: " + enrichedData.length + " total points (EC renewable + AW prices for tomorrow)");

      finalData = enrichedData;
      source = "energy-charts";
    } else if (fs.existsSync("public/data/marketdata_raw.json")) {
      // No renewable-only points, but check if we need to supplement beyond EC range
      const awattarRaw = JSON.parse(fs.readFileSync("public/data/marketdata_raw.json", "utf8"));
      const awattarData = interpolateAwattarData(awattarRaw);

      const lastECTimestamp = energyChartsData.data[energyChartsData.data.length - 1].end_timestamp;
      const lastAWTimestamp = awattarData[awattarData.length - 1].end_timestamp;
      const timeDiffHours = (lastAWTimestamp - lastECTimestamp) / (1000 * 60 * 60);

      if (timeDiffHours >= 3) {
        console.log("Supplementing with aWATTar data beyond EC range (+" + timeDiffHours.toFixed(1) + "h)");
        const supplementalData = awattarData.filter(item => item.start_timestamp >= lastECTimestamp);
        finalData = [...energyChartsData.data, ...supplementalData];
      } else {
        finalData = energyChartsData.data;
      }
      source = "energy-charts";
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
