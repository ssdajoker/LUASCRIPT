verify {
  diagnostic "resolve continue using label_goto requires lua.goto";
}

meta {
  target lua {
    resolve continue using label_goto;
  }
}

let total = 0;

for (let value = 1; value < 4; value = value + 1) {
  if (value == 2) {
    continue;
  }
  total = total + value;
}

console.log("missing_requires", total);
