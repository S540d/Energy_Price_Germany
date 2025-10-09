async function testAPI() {
  try {
    console.log('Testing Energy Charts API...');
    const renewableUrl = `https://api.energy-charts.info/renewable_power?country=de&start=${Math.floor(Date.now() / 1000) - 48 * 60 * 60}&end=${Math.floor(Date.now() / 1000)}`;
    const priceUrl = `https://api.energy-charts.info/price_spot_market?country=de&start=${Math.floor(Date.now() / 1000) - 48 * 60 * 60}&end=${Math.floor(Date.now() / 1000)}`;

    console.log('Renewable URL:', renewableUrl);
    const renewableResponse = await fetch(renewableUrl);
    console.log('Renewable status:', renewableResponse.status);
    if (renewableResponse.ok) {
      const data = await renewableResponse.json();
      console.log('Renewable data length:', data.data?.length || 0);
    }

    console.log('Price URL:', priceUrl);
    const priceResponse = await fetch(priceUrl);
    console.log('Price status:', priceResponse.status);
    if (priceResponse.ok) {
      const data = await priceResponse.json();
      console.log('Price data length:', data.data?.length || 0);
    }

    console.log('Testing fallback...');
    const fallbackResponse = await fetch('http://localhost:8081/data/marketdata.json');
    console.log('Fallback status:', fallbackResponse.status);
    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      console.log('Fallback data length:', data.data?.length || 0);
      console.log('First item:', data.data[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();