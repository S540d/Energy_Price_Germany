async function testMarketData() {
  try {
    console.log('Testing marketdata.json loading...');
    
    // Test aWATTar API (data source for daily updates)
    console.log('\n1. Testing aWATTar API:');
    const awattarUrl = 'https://api.awattar.de/v1/marketdata';
    const awattarResponse = await fetch(awattarUrl);
    console.log('aWATTar API status:', awattarResponse.status);
    if (awattarResponse.ok) {
      const data = await awattarResponse.json();
      console.log('✓ aWATTar data points:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log('  Sample data:', {
          timestamp: new Date(data.data[0].start_timestamp).toISOString(),
          price: data.data[0].marketprice,
          unit: data.data[0].unit
        });
      }
    }

    // Test local marketdata.json
    console.log('\n2. Testing local marketdata.json:');
    const marketdataResponse = await fetch('http://localhost:8081/data/marketdata.json');
    console.log('marketdata.json status:', marketdataResponse.status);
    if (marketdataResponse.ok) {
      const data = await marketdataResponse.json();
      console.log('✓ Local data points:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        const firstItem = data.data[0];
        const lastItem = data.data[data.data.length - 1];
        console.log('  First timestamp:', new Date(firstItem.start_timestamp).toISOString());
        console.log('  Last timestamp:', new Date(lastItem.start_timestamp).toISOString());
        console.log('  Price range:', `${Math.min(...data.data.map(d => d.marketprice)).toFixed(2)} - ${Math.max(...data.data.map(d => d.marketprice)).toFixed(2)} EUR/MWh`);
      }
    }

    console.log('\n✓ All tests completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

testMarketData();