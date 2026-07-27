meta profile portable_semantics_v1;

function pair(name, score) {
  return many(name, score + 1, "done");
}

let emptyList = [];
let emptyObject = {};

let listFlag = "bad";
if (emptyList) {
  listFlag = "list_truthy";
}

let objectFlag = "bad";
if (emptyObject) {
  objectFlag = "object_truthy";
}

let zeroFlag = "bad";
if (0) {
  zeroFlag = "bad_zero";
} else {
  zeroFlag = "zero_false";
}

let emptyFlag = "bad";
if ("") {
  emptyFlag = "bad_empty";
} else {
  emptyFlag = "empty_false";
}

let negFlag = "bad";
if (!emptyList) {
  negFlag = "bad_neg";
} else {
  negFlag = "neg_false";
}

let gate = 0;
if (emptyList || "bad") {
  gate = gate + 1;
}

if (emptyObject && "kept") {
  gate = gate + 1;
}

let message = "count=" + 3 + " flag=" + false + " empty=" + null;
let result = pair("Ada", 6);

console.log("ring3_semantics", listFlag, objectFlag, zeroFlag, emptyFlag, negFlag, message, gate, result[0], result.length, result[1], result[2]);
