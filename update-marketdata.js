#!/usr/bin/env node

/**
 * Update market data script
 * Fetches current energy market data and updates marketdata.json
 */

const fs = require('fs');
const path = require('path');

// Helper function to interpolate aWATTar data to 15-minute intervals
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
          unit: current.unit,
          interpolated: true
        });
      }
    } else {
      for (let j = 0; j < intervals; j++) {
        interpolated.push({
          start_timestamp: start + j * 15 * 60 * 1000,
          end_timestamp: start + (j + 1) * 15 * 60 * 1000,
          marketprice: currentPrice,
          renewable_share: null,
          unit: current.unit,
          interpolated: true
        });
      }
    }
  }
  return interpolated;
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
          unit: "Eur/MWh"
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
    awattarData = interpolateAwattarData(raw);

    console.log(`✅ Loaded ${awattarData.length} data points from aWATTar`);

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

  // Write to file
  const data = {
    object: "list",
    source: source,
    data: finalData
  };

  const filePath = path.join(__dirname, 'public', 'data', 'marketdata.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  const firstDate = new Date(finalData[0].start_timestamp);
  const lastDate = new Date(finalData[finalData.length - 1].end_timestamp);
  
  console.log(`\n✅ Updated marketdata.json:`);
  console.log(`   📊 ${finalData.length} data points`);
  console.log(`   🔌 Source: ${source}`);
  console.log(`   📅 From: ${firstDate.toLocaleString('de-DE')}`);
  console.log(`   📅 To: ${lastDate.toLocaleString('de-DE')}`);
  console.log(`   ⏱️  Coverage: ${((finalData.length * 15) / 60).toFixed(1)} hours\n`);
}

updateMarketData().catch(console.error);