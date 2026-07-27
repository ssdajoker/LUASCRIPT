verify {
  stdout "meta_features_ir 7";
  feature "verify-blocks";
  no_feature "classes";
  no_feature "for-of";
}

let base = 3;
let total = base + 4;

console.log("meta_features_ir", total);
