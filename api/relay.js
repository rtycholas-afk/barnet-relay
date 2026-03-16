fetch('https://barnet-relay.vercel.app/api/relay', {
  headers: {
    'X-Relay-Secret': 'barnet_relay_2024',
    'X-Barnet-Auth': 'Basic ' + btoa('487f30c4693a4316:aea66d2932ca5bf9'),
    'X-Barnet-Path': '/api/store/products?limit=3&account_id=429&shop_id=119'
  }
}).then(r => { console.log('Status:', r.status); return r.text(); }).then(console.log)
