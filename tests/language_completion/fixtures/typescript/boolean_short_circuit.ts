let calls: number = 0;

function mark(value: boolean): boolean {
  calls = calls + 1;
  return value;
}

let left: boolean = false;
let right: boolean = true;
let result: boolean = left && mark(true);
let fallback: boolean = right || mark(false);

console.log("ts_short", calls, result, fallback);
