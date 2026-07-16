let sum = 0;
let count = 0;

while (count < 10) {
  sum = sum + count;
  count = count + 1;
}

let whileResult = sum === 45;

let sum2 = 0;
let i = 0;

while (i < 5) {
  sum2 = sum2 + i;
  i = i + 1;
}

let whileResult2 = sum2 === 10;
let final = count === 10 && i === 5;

console.log("mirror_loop_semantics", sum, sum2, whileResult, whileResult2, final);
