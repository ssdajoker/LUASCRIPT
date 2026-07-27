
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8787,
  path: '/work-queue?action=list&assignee=gemini',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
