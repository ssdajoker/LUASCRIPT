// Mirror v1: Performance baseline
// Validates: optimization gains and pipeline efficiency

function sumToN(n) {
  let sum = 0;
  let i = 1;
  while (i <= n) {
    sum = sum + i;
    i = i + 1;
  }
  return sum;
}

let perfSum = sumToN(100);
let perfPass = perfSum === 5050;

console.log("mirror_performance", perfSum, perfPass);
