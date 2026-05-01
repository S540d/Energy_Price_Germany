// Allowed origins for CORS – only our own deployments and local dev
const ALLOWED_ORIGINS = [
  'https://s540d.github.io',
  'http://localhost:8080',
  'http://localhost:19006',
  'http://localhost:8081',
];

// German postal code: exactly 5 digits
const PLZ_PATTERN = /^\d{5}$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // Determine CORS origin: allow only our known origins
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : null;

    const corsHeaders = {
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    };

    // Reject preflight from unknown origins
    if (request.method === 'OPTIONS') {
      if (!allowedOrigin) {
        return new Response('Forbidden', { status: 403 });
      }
      return new Response(null, { headers: corsHeaders });
    }

    // Only GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    // Reject requests from unknown origins (browser requests always carry Origin)
    if (!allowedOrigin) {
      return new Response('Forbidden', { status: 403 });
    }

    const plz = url.searchParams.get('plz');

    if (!plz) {
      return new Response('Missing "plz" parameter', { status: 400, headers: corsHeaders });
    }

    // Validate PLZ format before forwarding to upstream
    if (!PLZ_PATTERN.test(plz)) {
      return new Response('Invalid "plz" parameter: must be exactly 5 digits', { status: 400, headers: corsHeaders });
    }

    // Cache Key generation (use only the canonical URL to avoid cache poisoning)
    const cacheUrl = new URL(`https://worker-cache/signal?plz=${plz}`);
    const cacheKey = new Request(cacheUrl.toString());
    const cache = caches.default;

    // 1. Check Cloudflare cache
    let response = await cache.match(cacheKey);
    if (response) {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      return newResponse;
    }

    // 2. Fetch from Energy Charts
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

      // 3. Build response with cache headers
      response = new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          // Browser cache: 15 min, Cloudflare edge cache: 1 hour
          'Cache-Control': 'public, max-age=900, s-maxage=3600',
        },
      });

      // 4. Store in Cloudflare cache (async)
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return response;

    } catch (e) {
      return new Response(`Error fetching data: ${e.message}`, { status: 500, headers: corsHeaders });
    }
  },
};
