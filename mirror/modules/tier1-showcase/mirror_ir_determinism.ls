function factorial(n) {
  let result = 1;
  let i = 2;
  while (i <= n) {
    result = result * i;
    i = i + 1;
  }
  return result;
}
console.log("mirror_ir_determinism", factorial(5));
