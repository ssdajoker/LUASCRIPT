// Mirror v1: Determinism test
// Validates: reproducible output across runs

function factorial(n) {
  let result = 1;
  let i = 2;
  while (i <= n) {
    result = result * i;
    i = i + 1;
  }
  return result;
}

let fact5 = factorial(5);
let deterministicPass = fact5 === 120;

console.log("mirror_determinism", fact5, deterministicPass);
