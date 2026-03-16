// Barnet HTTP Relay — Vercel Serverless Function v3
const http = require('http');

const RELAY_SECRET = 'barnet_relay_2024';
const BARNET_HOST  = 'barnetnetwork.com';

module.exports = async (req, res) => {
  // CORS — allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Relay-Secret, X-Barnet-Auth, Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // Auth check
  if (req.headers['x-relay-secret'] !== RELAY_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const auth = req.headers['x-barnet-auth'] || '';

  // The target path comes from X-Barnet-Path header
  // e.g. /api/store/products?limit=3&account_id=429&shop_id=119
  const barnetPath = req.headers['x-barnet-path'] || '/api/store/products?limit=3&account_id=429&shop_id=119';

  return new Promise((resolve) => {
    const options = {
      hostname: BARNET_HOST,
      port:     80,
      path:     barnetPath,
      method:   'GET',
      headers:  { 'Authorization': auth, 'Accept': 'application/json', 'Host': BARNET_HOST },
    };

    console.log();

    const barnetReq = http.request(options, (barnetRes) => {
      let body = '';
      barnetRes.on('data', chunk => body += chunk);
      barnetRes.on('end', () => {
        console.log();
        res.status(barnetRes.statusCode).setHeader('Content-Type', 'application/json').end(body);
        resolve();
      });
    });

    barnetReq.on('error', (e) => { res.status(502).json({ error: e.message }); resolve(); });
    barnetReq.setTimeout(8000, () => { barnetReq.destroy(); res.status(504).json({ error: 'Timed out' }); resolve(); });
    barnetReq.end();
  });
};
