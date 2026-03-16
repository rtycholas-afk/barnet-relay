// Barnet HTTP Relay — Vercel Serverless Function v4
const http = require('http');

const RELAY_SECRET = 'barnet_relay_2024';
const BARNET_HOST  = 'barnetnetwork.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Relay-Secret, X-Barnet-Auth, X-Barnet-Path, Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.headers['x-relay-secret'] !== RELAY_SECRET) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  const auth       = req.headers['x-barnet-auth'] || '';
  const barnetPath = req.headers['x-barnet-path'] || '/api/store/products?limit=3&account_id=429&shop_id=119';

  return new Promise((resolve) => {
    const options = {
      hostname: BARNET_HOST,
      port:     80,
      path:     barnetPath,
      method:   'GET',
      headers:  { 'Authorization': auth, 'Accept': 'application/json', 'Host': BARNET_HOST },
    };

    const barnetReq = http.request(options, (barnetRes) => {
      let body = '';
      barnetRes.on('data', chunk => body += chunk);
      barnetRes.on('end', () => {
        res.status(barnetRes.statusCode).setHeader('Content-Type', 'application/json').end(body);
        resolve();
      });
    });

    barnetReq.on('error', (e) => { res.status(502).json({ error: e.message }); resolve(); });
    barnetReq.setTimeout(8000, () => { barnetReq.destroy(); res.status(504).json({ error: 'Timed out' }); resolve(); });
    barnetReq.end();
  });
};
