meta {
  target lua {
    requires lua.goto;
    resolve continue using label_goto;
  }
}

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

console.log("meta_continue", total);
