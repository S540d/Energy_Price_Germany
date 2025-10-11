#!/usr/bin/env node

/**
 * Update market data script
 * Fetches current energy market data and updates marketdata.json
 */

const fs = require('fs');
const path = require('path');

async function updateMarketData() {
  console.log('🔄 Updating market data...');

  try {
    // Try Energy Charts API first
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

    const data = {
      object: "list",
      source: "energy-charts",
      data: merged
    };

    // Write to file
    const filePath = path.join(__dirname, 'public', 'data', 'marketdata.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✅ Updated marketdata.json with ${merged.length} data points from Energy Charts`);

  } catch (error) {
    console.log('⚠️ Energy Charts API failed, trying aWATTar fallback...');

    try {
      const response = await fetch('https://api.awattar.de/v1/marketdata');
      if (!response.ok) {
        throw new Error('aWATTar API not available');
      }

      const raw = await response.json();
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

      const data = {
        object: "list",
        source: "awattar",
        data: interpolated
      };

      const filePath = path.join(__dirname, 'public', 'data', 'marketdata.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      console.log(`✅ Updated marketdata.json with ${interpolated.length} data points from aWATTar`);

    } catch (fallbackError) {
      console.error('❌ Both APIs failed:', fallbackError.message);
      process.exit(1);
    }
  }
}

updateMarketData().catch(console.error);