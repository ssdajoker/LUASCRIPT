let total = 0;

for (let value = 1; value < 6; value = value + 1) {
  if (value == 2) {
    continue;
  }
  if (value == 5) {
    break;
  }
  total = total + value;
}

console.log("ring2_control", total);
