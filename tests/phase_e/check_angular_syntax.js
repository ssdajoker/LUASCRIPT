const fs = require('fs');
const path = require('path');

const file = path.join('node_modules/@angular/core/fesm2022/core.mjs');
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

console.log('Lines 36-50 of Angular core.mjs:\n');
lines.slice(35, 50).forEach((line, i) => {
  console.log(`${i + 36}: ${line.slice(0, 100)}`);
});
