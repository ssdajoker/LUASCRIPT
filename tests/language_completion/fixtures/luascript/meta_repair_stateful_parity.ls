verify {
  stdout "repair_state x xy 9 12 9 7 kept fallback ternary 9 2 3 idx=2 truth=3";
  lua_stdout "repair_state x xy 9 12 9 7 kept fallback ternary 9 2 3 idx=2 truth=3";
  python_stdout "repair_state x xy 9 12 9 7 kept fallback ternary 9 2 3 idx=2 truth=3";
  js_stdout "repair_state x xy 9 12 9 7 kept fallback ternary 9 2 3 idx=2 truth=3";
  ls_stdout "repair_state x xy 9 12 9 7 kept fallback ternary 9 2 3 idx=2 truth=3";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "adapters.length=array_length_property";
  lua_policy "adapters.slicing=runtime_slice";
  lua_policy "adapters.truthiness=js_truthy";
  lua_policy "adapters.string_coercion=explicit_tostring";
  lua_policy "adapters.multiple_returns=packed_array";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  lua_repair "slicing=runtime_slice";
  lua_repair "truthiness=js_truthy";
  lua_repair "string_coercion=explicit_tostring";
  lua_repair "multiple_returns=packed_array";
  python_policy "adapters.indexing=zero_based";
  python_policy "adapters.length=array_length_property";
  python_policy "adapters.slicing=runtime_slice";
  python_policy "adapters.truthiness=js_truthy";
  python_policy "adapters.string_coercion=explicit_tostring";
  python_policy "adapters.multiple_returns=packed_array";
  python_repair "indexing=zero_based";
  python_repair "length=array_length_property";
  python_repair "slicing=runtime_slice";
  python_repair "truthiness=js_truthy";
  python_repair "string_coercion=explicit_tostring";
  python_repair "multiple_returns=packed_array";
  lua_contains "__ls_index";
  lua_contains "__ls_set_index";
  lua_contains "__ls_length";
  lua_contains "__ls_slice";
  lua_contains "__ls_truthy";
  lua_contains "__ls_add";
  lua_contains "__ls_many";
  python_contains "__ls_index";
  python_contains "__ls_set_index";
  python_contains "__ls_slice";
  python_contains "__ls_truthy";
  python_contains "__ls_add";
  python_contains "return [";
  ls_contains "portable_semantics_v1";
}

meta profile portable_semantics_v1;

let values = [3, 5, 7, 9];
let word = "wxyz";

let indexCalls = [0];
function nextIndex() {
  indexCalls[0] = indexCalls[0] + 1;
  return 1;
}

values[nextIndex()] = values[nextIndex()] + 4;

let truthCalls = [0];
function mark(value) {
  truthCalls[0] = truthCalls[0] + 1;
  return value;
}

let emptyList = [];
let both = emptyList && mark("kept");
let either = "" || mark("fallback");
let ternary = emptyList ? mark("ternary") : "bad";

let char = word[1];
let part = word.slice(1, 3);
let segment = values.slice(1, 3);
values[2] = 12;

function bundle() {
  return many(segment[0], segment.length, truthCalls[0]);
}

let result = bundle();
let message = "idx=" + indexCalls[0] + " truth=" + truthCalls[0];

console.log("repair_state", char, part, values[1], values[2], segment[0], segment[1], both, either, ternary, result[0], result[1], result[2], message);
