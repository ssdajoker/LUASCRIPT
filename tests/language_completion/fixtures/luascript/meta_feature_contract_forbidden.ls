verify {
  no_feature "for-of";
}

let values = [1, 2];
let total = 0;

for (let value of values) {
  total = total + value;
}

console.log("forbidden_feature_contract", total);
