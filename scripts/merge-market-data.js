#!/usr/bin/env node

const fs = require("fs");

// Interpolate aWATTar data to 15-minute intervals to match Energy Charts resolution
function interpolateAwattarData(raw) {
  raw.data.sort((a, b) => a.start_timestamp - b.start_timestamp);
  const interpolated = [];

  for (let i = 0; i < raw.data.length; i++) {
    const current = raw.data[i];
    const next = raw.data[i + 1];
    const start = current.start_timestamp;
    const end = current.end_timestamp;
    const currentPrice = current.marketprice;
    const duration = end - start;
    const intervals = Math.floor(duration / (15 * 60 * 1000));

    if (next) {
      const timeDiff = next.start_timestamp - current.start_timestamp;
      const priceDiff = next.marketprice - current.marketprice;

      for (let j = 0; j < intervals; j++) {
        const timeOffset = j * 15 * 60 * 1000;
        const interpolationFactor = timeOffset / timeDiff;
        const interpolatedPrice = currentPrice + (priceDiff * interpolationFactor);

        interpolated.push({
          start_timestamp: start + timeOffset,
          end_timestamp: start + (j + 1) * 15 * 60 * 1000,
          marketprice: Math.round(interpolatedPrice * 100) / 100,
          renewable_share: null,
          unit: current.unit
        });
      }
    } else {
      for (let j = 0; j < intervals; j++) {
        interpolated.push({
          start_timestamp: start + j * 15 * 60 * 1000,
          end_timestamp: start + (j + 1) * 15 * 60 * 1000,
          marketprice: currentPrice,
          renewable_share: null,
          unit: current.unit
        });
      }
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

    // Load and interpolate aWATTar data
    if (fs.existsSync("public/data/marketdata_raw.json")) {
      const awattarRaw = JSON.parse(fs.readFileSync("public/data/marketdata_raw.json", "utf8"));
      const awattarData = interpolateAwattarData(awattarRaw);
      console.log("aWATTar data interpolated to " + awattarData.length + " points");

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
  }

  // Sort final data
  finalData.sort((a, b) => a.start_timestamp - b.start_timestamp);

  // Write final output
  fs.writeFileSync("public/data/marketdata_new.json", JSON.stringify({
    object: "list",
    source: source,
    data: finalData
  }, null, 2));

  console.log("Final dataset: " + finalData.length + " points, source: " + source);
  console.log("✓ Successfully created marketdata_new.json");

} catch (error) {
  console.error("Error merging data:", error);
  process.exit(1);
} finally {
  // Clean up
  if (fs.existsSync("public/data/marketdata_raw.json")) {
    fs.unlinkSync("public/data/marketdata_raw.json");
  }
  if (fs.existsSync("public/data/energycharts_temp.json")) {
    fs.unlinkSync("public/data/energycharts_temp.json");
  }
}
