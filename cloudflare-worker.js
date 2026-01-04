export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const plz = url.searchParams.get('plz');

    // CORS Headers - Erlaubt Zugriff von überall
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request (Preflight) - Wichtig für CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (!plz) {
      return new Response('Missing "plz" parameter', { status: 400, headers: corsHeaders });
    }

    // Cache Key generation
    const cacheUrl = new URL(request.url);
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = caches.default;

    // 1. Prüfen ob Daten im Cloudflare Cache liegen
    let response = await cache.match(cacheKey);
    if (response) {
      // Response neu verpacken um sicherzustellen, dass CORS Header da sind
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;
    }

    // 2. Daten von Energy Charts holen
    const targetUrl = `https://api.energy-charts.info/signal?country=de&postal_code=${plz}`;
    
    try {
      const apiResponse = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'EnergyPriceGermany-App/1.0'
        }
      });

      if (!apiResponse.ok) {
        return new Response(`Upstream API Error: ${apiResponse.status}`, { status: 502, headers: corsHeaders });
      }

      const data = await apiResponse.json();

      // 3. Antwort erstellen mit Caching-Headern
      response = new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          // Browser-Cache: 15 Min (900s), Cloudflare-Cache: 1 Stunde (3600s)
          'Cache-Control': 'public, max-age=900, s-maxage=3600', 
        },
      });

      // 4. In den Cloudflare Cache speichern (asynchron)
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return response;

    } catch (e) {
      return new Response(`Error fetching data: ${e.message}`, { status: 500, headers: corsHeaders });
    }
  },
};