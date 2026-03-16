// Barnet HTTP Relay — Vercel Serverless Function
const http = require('http');

const RELAY_SECRET = 'barnet_relay_2024';
const BARNET_HOST  = 'barnetnetwork.com';

module.exports = async (req, res) => {
  // CORS — allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Relay-Secret, X-Barnet-Auth, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Auth check
  if (req.headers['x-relay-secret'] !== RELAY_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const auth = req.headers['x-barnet-auth'] || '';
  // Strip /api/relay prefix if present, keep everything else
  const path = req.url.replace(/^\/api\/relay/, '') || '/';

  return new Promise((resolve) => {
    const options = {
      hostname: BARNET_HOST,
      port:     80,
      path:     path,
      method:   'GET',
      headers:  {
        'Authorization': auth,
        'Accept':        'application/json',
        'Host':          BARNET_HOST,
      },
    };

    console.log(`→ Proxying to: http://${BARNET_HOST}${path}`);

    const barnetReq = http.request(options, (barnetRes) => {
      let body = '';
      barnetRes.on('data', chunk => body += chunk);
      barnetRes.on('end', () => {
        console.log(`← Barnet status: ${barnetRes.statusCode}, body length: ${body.length}`);
        res.status(barnetRes.statusCode)
           .setHeader('Content-Type', 'application/json')
           .end(body);
        resolve();
      });
    });

    barnetReq.on('error', (e) => {
      console.error('Barnet request error:', e.message);
      res.status(502).json({ error: e.message });
      resolve();
    });

    barnetReq.setTimeout(8000, () => {
      barnetReq.destroy();
      res.status(504).json({ error: 'Barnet timed out after 8s' });
      resolve();
    });

    barnetReq.end();
  });
};
