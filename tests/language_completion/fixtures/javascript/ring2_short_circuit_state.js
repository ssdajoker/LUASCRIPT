let calls = 0;

function mark(value) {
  calls = calls + 1;
  return value;
}

let left = false;
let right = true;
let result = left && mark(true);
let fallback = right || mark(false);

console.log("ring2_short", calls, result, fallback);
