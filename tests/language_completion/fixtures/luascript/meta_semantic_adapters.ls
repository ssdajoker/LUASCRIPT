verify {
  stdout "meta_adapters b 4 bc 8 9 zero_false empty_false 0 fallback 1";
}

meta {
  target lua {
    adapt indexing using zero_based;
    adapt length using array_length_property;
    adapt slicing using runtime_slice;
    adapt truthiness using js_truthy;
    adapt string_coercion using explicit_tostring;
  }
}

let values = [5, 7, 9, 11];
let word = "abcd";

values[1] = 8;

let char = word[1];
let part = word.slice(1, 3);
let second = values[1];
let third = values[2];

let zeroFlag = "unset";
if (0) {
  zeroFlag = "bad";
} else {
  zeroFlag = "zero_false";
}

let emptyFlag = "unset";
if ("") {
  emptyFlag = "bad";
} else {
  emptyFlag = "empty_false";
}

let calls = 0;
function mark(value) {
  calls = calls + 1;
  return value;
}

let both = 0 && mark("bad");
let either = "" || "fallback";

if (values) {
  calls = calls + 1;
}

console.log("meta_adapters", char, word.length, part, second, third, zeroFlag, emptyFlag, both, either, calls);
