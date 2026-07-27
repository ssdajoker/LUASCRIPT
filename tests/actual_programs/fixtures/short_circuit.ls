let calls = 0;

function mark() {
  calls = calls + 1;
  return true;
}

let result = false && mark();
let result2 = true || mark();

console.log("short_circuit", calls, result, result2);
