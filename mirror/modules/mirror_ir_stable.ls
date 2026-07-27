// Mirror v1: IR stability test
// Validates: intermediate representation canonicalization

let a = 10;
let b = 20;
let c = a + b;

if (c > 25) {
  c = c - 5;
} else {
  c = c + 5;
}

let irStable = c === 25;

console.log("mirror_ir_stable", c, irStable);
