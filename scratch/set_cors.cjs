const https = require('https');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('C:/Users/Servidor/.config/configstore/firebase-tools.json', 'utf8'));
const token = config.tokens.access_token;

const data = JSON.stringify({
  cors: [
    {
      origin: ["*"],
      method: ["GET", "HEAD", "OPTIONS"],
      responseHeader: ["*"],
      maxAgeSeconds: 3600
    }
  ]
});

const options = {
  hostname: 'storage.googleapis.com',
  path: '/storage/v1/b/web-tec-68.appspot.com',
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let resData = '';
  res.on('data', (chunk) => resData += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', resData);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
req.end();
