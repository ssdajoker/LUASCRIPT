let total = 0;
let i = 1;

while (i <= 3) {
  let j = 1;
  while (j <= 2) {
    total = total + i * j;
    j = j + 1;
  }
  i = i + 1;
}

console.log("nested_loops", total);
