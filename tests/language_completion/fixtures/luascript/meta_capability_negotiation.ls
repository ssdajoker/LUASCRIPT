meta {
  target lua {
    requires lua.goto;
    forbid js.prototype;
    resolve continue using label_goto;
  }
}

let total = 0;

for (let value = 1; value < 4; value = value + 1) {
  total = total + value;
}

console.log("meta_caps", total);
