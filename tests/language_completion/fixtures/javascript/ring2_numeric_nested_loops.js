let total = 0;

for (let outer = 1; outer < 4; outer = outer + 1) {
  let inner = 1;
  while (inner < 4) {
    total = total + outer * inner;
    inner = inner + 1;
  }
}

console.log("ring2_loops", total);
