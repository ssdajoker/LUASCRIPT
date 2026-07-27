verify {
  stdout "profile_matrix b 4 bc 8 9 list_truthy zero_false count=3 flag=false Ada 3 7 done";
  lua_stdout "profile_matrix b 4 bc 8 9 list_truthy zero_false count=3 flag=false Ada 3 7 done";
  python_stdout "profile_matrix b 4 bc 8 9 list_truthy zero_false count=3 flag=false Ada 3 7 done";
  js_stdout "profile_matrix b 4 bc 8 9 list_truthy zero_false count=3 flag=false Ada 3 7 done";
  ls_stdout "profile_matrix b 4 bc 8 9 list_truthy zero_false count=3 flag=false Ada 3 7 done";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "adapters.length=array_length_property";
  lua_policy "adapters.slicing=runtime_slice";
  lua_policy "adapters.truthiness=js_truthy";
  lua_policy "adapters.string_coercion=explicit_tostring";
  lua_policy "adapters.multiple_returns=packed_array";
  js_policy "requires=js.console";
  js_policy "adapters.indexing=zero_based";
  js_policy "adapters.length=array_length_property";
  js_policy "adapters.slicing=runtime_slice";
  js_policy "adapters.truthiness=js_truthy";
  js_policy "adapters.string_coercion=explicit_tostring";
  js_policy "adapters.multiple_returns=packed_array";
  python_policy "requires=python.print";
  python_policy "forbid=python.imports";
  python_policy "adapters.indexing=zero_based";
  python_policy "adapters.length=array_length_property";
  python_policy "adapters.slicing=runtime_slice";
  python_policy "adapters.truthiness=js_truthy";
  python_policy "adapters.string_coercion=explicit_tostring";
  python_policy "adapters.multiple_returns=packed_array";
  ls_policy "requires=js.console";
  ls_policy "forbid=js.prototype";
  ls_policy "adapters.indexing=zero_based";
  ls_policy "adapters.length=array_length_property";
  ls_policy "adapters.slicing=runtime_slice";
  ls_policy "adapters.truthiness=js_truthy";
  ls_policy "adapters.string_coercion=explicit_tostring";
  ls_policy "adapters.multiple_returns=packed_array";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  lua_repair "slicing=runtime_slice";
  lua_repair "truthiness=js_truthy";
  lua_repair "string_coercion=explicit_tostring";
  lua_repair "multiple_returns=packed_array";
  js_repair "indexing=zero_based";
  js_repair "length=array_length_property";
  js_repair "slicing=runtime_slice";
  js_repair "truthiness=js_truthy";
  js_repair "string_coercion=explicit_tostring";
  js_repair "multiple_returns=packed_array";
  python_repair "indexing=zero_based";
  python_repair "length=array_length_property";
  python_repair "slicing=runtime_slice";
  python_repair "truthiness=js_truthy";
  python_repair "string_coercion=explicit_tostring";
  python_repair "multiple_returns=packed_array";
  ls_repair "indexing=zero_based";
  ls_repair "length=array_length_property";
  ls_repair "slicing=runtime_slice";
  ls_repair "truthiness=js_truthy";
  ls_repair "string_coercion=explicit_tostring";
  ls_repair "multiple_returns=packed_array";
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
  python_contains "len(";
  python_contains "return [";
  ls_contains "portable_semantics_v1";
}

meta profile portable_semantics_v1;

function pair(name, score) {
  return many(name, score + 1, "done");
}

let values = [5, 7, 9, 11];
let word = "abcd";

values[1] = 8;

let char = word[1];
let wordLength = word.length;
let part = word.slice(1, 3);
let second = values[1];
let third = values[2];

let emptyList = [];
let listFlag = "bad";
if (emptyList) {
  listFlag = "list_truthy";
}

let zeroFlag = "bad";
if (0) {
  zeroFlag = "bad_zero";
} else {
  zeroFlag = "zero_false";
}

let message = "count=" + 3 + " flag=" + false;
let result = pair("Ada", 6);

console.log("profile_matrix", char, wordLength, part, second, third, listFlag, zeroFlag, message, result[0], result.length, result[1], result[2]);
