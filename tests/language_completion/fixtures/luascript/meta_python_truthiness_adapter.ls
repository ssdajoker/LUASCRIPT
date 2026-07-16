verify {
  stdout "python_truthy list_truthy object_truthy zero_false empty_false neg_false ternary_truthy 1 1 2";
  python_stdout "python_truthy list_truthy object_truthy zero_false empty_false neg_false ternary_truthy 1 1 2";
  lua_stdout "python_truthy list_truthy object_truthy zero_false empty_false neg_false ternary_truthy 1 1 2";
  js_stdout "python_truthy list_truthy object_truthy zero_false empty_false neg_false ternary_truthy 1 1 2";
  ls_stdout "python_truthy list_truthy object_truthy zero_false empty_false neg_false ternary_truthy 1 1 2";
  lua_policy "adapters.truthiness=js_truthy";
  lua_repair "truthiness=js_truthy";
  python_policy "adapters.truthiness=js_truthy";
  python_repair "truthiness=js_truthy";
  ls_policy "adapters.truthiness=js_truthy";
  python_contains "__ls_truthy";
  python_contains "__ls_and";
  python_contains "__ls_or";
  ls_contains "portable_semantics_v1";
}

meta profile portable_semantics_v1;

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

let chosen = emptyList || "bad";
let both = emptyList && "kept";
let ternaryFlag = emptyObject ? "ternary_truthy" : "bad_ternary";
let loopCount = 0;
let forCount = 0;
let gate = 0;

while (emptyList && loopCount < 1) {
  loopCount = loopCount + 1;
}

for (let i = 0; emptyObject && i < 1; i = i + 1) {
  forCount = forCount + 1;
}

if (chosen) {
  gate = gate + 1;
}

if (both) {
  gate = gate + 1;
}

console.log("python_truthy", listFlag, objectFlag, zeroFlag, emptyFlag, negFlag, ternaryFlag, loopCount, forCount, gate);
