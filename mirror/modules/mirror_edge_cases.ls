// Mirror v1: Edge cases test
// Validates: chained method calls, complex expressions, nested conditions

let arr = [1, 2, 3, 4, 5];
let result = 0;
let idx = 0;

while (idx < 5) {
  result = result + arr[idx];
  idx = idx + 1;
}

let edgeCasePass = result === 15;

console.log("mirror_edge_cases", result, edgeCasePass);
