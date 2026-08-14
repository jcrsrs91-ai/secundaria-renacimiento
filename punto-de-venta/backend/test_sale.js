const http = require('http');

const data = JSON.stringify({
  items: [
      { id: "qs_123", name: "Copias", quantity: 2, price: 10 }
  ],
  total: 20
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sales',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  console.log('statusCode: ' + res.statusCode);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
