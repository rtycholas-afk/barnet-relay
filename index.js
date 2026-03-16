// Barnet HTTP Relay — Node.js for Render.com
// Proxies HTTPS requests to Barnet's HTTP-only API

const http  = require('http');
const https = require('https');

const RELAY_SECRET  = 'barnet_relay_2024';
const BARNET_HOST   = 'barnetnetwork.com';
const PORT          = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'X-Relay-Secret, X-Barnet-Auth, Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Auth check
  if (req.headers['x-relay-secret'] !== RELAY_SECRET) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  // Build Barnet target URL
  const target = `http://${BARNET_HOST}${req.url}`;
  const auth   = req.headers['x-barnet-auth'] || '';

  const options = {
    hostname: BARNET_HOST,
    path:     req.url,
    method:   'GET',
    headers:  { 'Authorization': auth, 'Accept': 'application/json' },
  };

  console.log(`→ Proxying: ${target}`);

  const barnetReq = http.request(options, (barnetRes) => {
    let body = '';
    barnetRes.on('data', chunk => body += chunk);
    barnetRes.on('end', () => {
      console.log(`← Barnet status: ${barnetRes.statusCode}`);
      res.writeHead(barnetRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    });
  });

  barnetReq.on('error', (e) => {
    console.error('Barnet error:', e.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  });

  barnetReq.setTimeout(8000, () => {
    barnetReq.destroy();
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Barnet request timed out' }));
  });

  barnetReq.end();
});

server.listen(PORT, () => {
  console.log(`Barnet relay running on port ${PORT}`);
});
