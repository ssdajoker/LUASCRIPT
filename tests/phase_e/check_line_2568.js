const fs = require('fs');

const lines = fs.readFileSync('node_modules/@angular/core/fesm2022/core.mjs', 'utf-8').split('\n');
console.log('Lines 2560-2575 of Angular core.mjs:\n');
lines.slice(2559, 2575).forEach((l, i) => {
  console.log(`${2560 + i}: ${l.slice(0, 100)}`);
});
