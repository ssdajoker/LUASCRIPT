// Mirror v1: Parity test
// Validates: JavaScript -> Lua semantic equivalence

function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

let fib5 = fibonacci(5);
let parityPass = fib5 === 5;

console.log("mirror_parity", fib5, parityPass);
