#!/usr/bin/env node

/**
 * Update market data script
 * Fetches current energy market data and updates marketdata.json
 */

const fs = require('fs');
const path = require('path');

// Helper function to convert aWATTar hourly data to consistent format (NO interpolation)
function convertAwattarData(raw) {
  raw.data.sort((a, b) => a.start_timestamp - b.start_timestamp);
  const converted = [];

  for (let i = 0; i < raw.data.length; i++) {
    const current = raw.data[i];

    // Keep original hourly data without interpolation
    converted.push({
      start_timestamp: current.start_timestamp,
      end_timestamp: current.end_timestamp,
      marketprice: current.marketprice,
      renewable_share: null,
      unit: current.unit,
      interpolated: false  // Mark as real data, not interpolated
    });
  }
  return converted;
}

async function updateMarketData() {
  console.log('🔄 Updating market data...');

  let energyChartsData = null;
  let awattarData = null;

  // Try Energy Charts API first
  try {
    console.log('📡 Fetching from Energy Charts API...');

    const renewableResponse = await fetch('https://api.energy-charts.info/ren_share_forecast?country=de');
    const priceResponse = await fetch('https://api.energy-charts.info/price?country=de');

    if (!renewableResponse.ok || !priceResponse.ok) {
      throw new Error('Energy Charts API not available');
    }

    const renewable = await renewableResponse.json();
    const price = await priceResponse.json();

    // Merge data
    const merged = [];
    const renewableMap = new Map();

    if (renewable.unix_seconds && renewable.ren_share) {
      renewable.unix_seconds.forEach((ts, i) => {
        renewableMap.set(ts * 1000, renewable.ren_share[i]);
      });
    }

    if (price.unix_seconds && price.price) {
      price.unix_seconds.forEach((ts, i) => {
        const timestamp_ms = ts * 1000;
        merged.push({
          start_timestamp: timestamp_ms,
          end_timestamp: timestamp_ms + 15 * 60 * 1000,
          marketprice: price.price[i],
          renewable_share: renewableMap.get(timestamp_ms) || null,
          unit: "Eur/MWh",
          interpolated: false
        });
      });
    }

    merged.sort((a, b) => a.start_timestamp - b.start_timestamp);
    energyChartsData = merged;

    console.log(`✅ Loaded ${merged.length} data points from Energy Charts`);

  } catch (error) {
    console.log('⚠️ Energy Charts API failed:', error.message);
  }

  // Try aWATTar API
  try {
    console.log('📡 Fetching from aWATTar API...');
    const response = await fetch('https://api.awattar.de/v1/marketdata');
    if (!response.ok) {
      throw new Error('aWATTar API not available');
    }

    const raw = await response.json();
    awattarData = convertAwattarData(raw);

    console.log(`✅ Loaded ${awattarData.length} hourly data points from aWATTar (no interpolation)`);

  } catch (error) {
    console.log('⚠️ aWATTar API failed:', error.message);
  }

  // Determine final dataset
  let finalData = [];
  let source = 'none';

  if (energyChartsData && energyChartsData.length > 0) {
    // Energy Charts available
    const lastECTimestamp = energyChartsData[energyChartsData.length - 1].end_timestamp;
    const lastECDate = new Date(lastECTimestamp);
    console.log(`📅 Energy Charts last timestamp: ${lastECDate.toISOString()}`);

    if (awattarData && awattarData.length > 0) {
      const lastAWTimestamp = awattarData[awattarData.length - 1].end_timestamp;
      const lastAWDate = new Date(lastAWTimestamp);
      console.log(`📅 aWATTar last timestamp: ${lastAWDate.toISOString()}`);

      // Calculate time difference in hours
      const timeDiffMs = lastAWTimestamp - lastECTimestamp;
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
      console.log(`⏱️  Time difference: ${timeDiffHours.toFixed(2)} hours`);

      // Only supplement if difference is >= 3 hours
      if (timeDiffHours >= 3) {
        console.log('🔗 Supplementing Energy Charts with aWATTar data (difference >= 3h)');

        // Filter aWATTar data: only data AFTER last Energy Charts timestamp
        const supplementalData = awattarData.filter(item => 
          item.start_timestamp >= lastECTimestamp
        );

        console.log(`➕ Adding ${supplementalData.length} supplemental data points from aWATTar`);

        // Merge: Energy Charts + supplemental aWATTar
        finalData = [...energyChartsData, ...supplementalData];
        source = 'energy-charts';
      } else {
        console.log('✓ No supplement needed (difference < 3h), using Energy Charts only');
        finalData = energyChartsData;
        source = 'energy-charts';
      }
    } else {
      console.log('✓ Using Energy Charts only (aWATTar not available)');
      finalData = energyChartsData;
      source = 'energy-charts';
    }
  } else if (awattarData && awattarData.length > 0) {
    // Fallback: Energy Charts failed, use aWATTar only
    console.log('🔄 Energy Charts not available, using aWATTar as fallback');
    finalData = awattarData;
    source = 'awattar';
  } else {
    console.error('❌ Both APIs failed - no data available');
    process.exit(1);
  }

  // Sort final data
  finalData.sort((a, b) => a.start_timestamp - b.start_timestamp);

  // Merge with existing data to preserve history
  const filePath = path.join(__dirname, 'public', 'data', 'marketdata.json');
  let mergedData = finalData;

  if (fs.existsSync(filePath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (existingData.data && Array.isArray(existingData.data)) {
        console.log(`📂 Merging with existing ${existingData.data.length} data points...`);

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

        // Limit to last 48 hours to avoid unbounded growth
        const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours
        const cutoffTime = Date.now() - maxAgeMs;
        const beforeCount = mergedData.length;
        mergedData = mergedData.filter(item => item.start_timestamp >= cutoffTime);

        if (beforeCount > mergedData.length) {
          console.log(`🧹 Removed ${beforeCount - mergedData.length} old data points (> 48h)`);
        }

        console.log(`✅ Merged: ${oldDataToKeep.length} old + ${finalData.length} new = ${mergedData.length} total`);
      }
    } catch (error) {
      console.log('⚠️ Could not merge with existing data:', error.message);
    }
  }

  // Write to file
  const data = {
    object: "list",
    source: source,
    data: mergedData
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  const firstDate = new Date(mergedData[0].start_timestamp);
  const lastDate = new Date(mergedData[mergedData.length - 1].end_timestamp);
  
  console.log(`\n✅ Updated marketdata.json:`);
  console.log(`   📊 ${mergedData.length} data points`);
  console.log(`   🔌 Source: ${source}`);
  console.log(`   📅 From: ${firstDate.toLocaleString('de-DE')}`);
  console.log(`   📅 To: ${lastDate.toLocaleString('de-DE')}`);

  // Calculate actual coverage (considering mixed 15-min and 60-min intervals)
  const totalMs = lastDate.getTime() - firstDate.getTime();
  const totalHours = totalMs / (1000 * 60 * 60);
  console.log(`   ⏱️  Coverage: ${totalHours.toFixed(1)} hours\n`);
}

updateMarketData().catch(console.error);