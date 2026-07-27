verify {
  stdout "meta_features 6";
  feature "verify-blocks";
  feature "for-of";
  no_feature "classes";
  no_feature "try-catch";
}

let values = [1, 2, 3];
let total = 0;

for (let value of values) {
  total = total + value;
}

console.log("meta_features", total);
