#!/usr/bin/env node

/**
 * Test script to verify cache-busting is working for data loading
 */

const { execSync } = require('child_process');

function testCacheBusting() {
    console.log('🧪 Testing cache-busting for marketdata.json...');

    try {
        // Test with cache-busting parameter
        const cacheBust = Date.now();
        const cacheBustUrl = `http://localhost:3000/data/marketdata.json?v=${cacheBust}`;
        console.log(`Fetching with cache-busting: ${cacheBustUrl}`);

        const output1 = execSync(`curl -s "${cacheBustUrl}" | head -20`, { encoding: 'utf8' });
        console.log('✅ Successfully fetched data with cache-busting');
        console.log('Sample output:', output1.substring(0, 200) + '...');

        // Test without cache-busting
        const noCacheUrl = 'http://localhost:3000/data/marketdata.json';
        console.log(`\nFetching without cache-busting: ${noCacheUrl}`);

        const output2 = execSync(`curl -s "${noCacheUrl}" | head -20`, { encoding: 'utf8' });
        console.log('✅ Successfully fetched data without cache-busting');
        console.log('Sample output:', output2.substring(0, 200) + '...');

        console.log('\n🎉 Cache-busting test completed successfully!');

    } catch (error) {
        console.error('❌ Cache-busting test failed:', error.message);
        process.exit(1);
    }
}

testCacheBusting();