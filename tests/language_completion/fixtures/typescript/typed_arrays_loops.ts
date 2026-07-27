let values: number[] = [1, 2, 3, 4];
let total: number = 0;

for (let index: number = 0; index < 4; index = index + 1) {
  total = total + values[index];
}

console.log("ts_array_loop", total, values[2]);
