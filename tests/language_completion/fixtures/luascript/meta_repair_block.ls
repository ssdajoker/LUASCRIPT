verify {
  stdout "repair_blocks x 4 yz 9 7 ok fallback 0 1";
  lua_stdout "repair_blocks x 4 yz 9 7 ok fallback 0 1";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  lua_repair "slicing=runtime_slice";
  lua_repair "truthiness=js_truthy";
  lua_repair "string_coercion=explicit_tostring";
}

repair {
  target lua {
    lower indexing using zero_based;
    lower length using array_length_property;
    lower slicing using runtime_slice;
    lower truthiness using js_truthy;
    lower string_coercion using explicit_tostring;
  }
}

let values = [3, 5, 7];
let word = "wxyz";

values[1] = 9;

let label = "unset";
if (0) {
  label = "bad";
} else {
  label = "ok";
}

let calls = 0;
function mark(value) {
  calls = calls + 1;
  return value;
}

let both = 0 && mark("bad");
let fallback = "" || "fallback";

if (values) {
  calls = calls + 1;
}

console.log("repair_blocks", word[1], word.length, word.slice(2, 4), values[1], values[2], label, fallback, both, calls);
