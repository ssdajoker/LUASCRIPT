verify {
  stdout "multi_adapter Ada 3 7 done";
  lua_stdout "multi_adapter Ada 3 7 done";
  python_stdout "multi_adapter Ada 3 7 done";
  js_stdout "multi_adapter Ada 3 7 done";
  ls_stdout "multi_adapter Ada 3 7 done";
  lua_policy "adapters.multiple_returns=packed_array";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "adapters.length=array_length_property";
  lua_repair "multiple_returns=packed_array";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  python_policy "adapters.multiple_returns=packed_array";
  python_policy "adapters.indexing=zero_based";
  python_policy "adapters.length=array_length_property";
  python_repair "multiple_returns=packed_array";
  python_repair "indexing=zero_based";
  python_repair "length=array_length_property";
  ls_policy "adapters.multiple_returns=packed_array";
  python_contains "return [";
  python_contains "len(result)";
  python_not_contains "many(";
  ls_contains "portable_semantics_v1";
}

meta profile portable_semantics_v1;

function pair(name, score) {
  return many(name, score + 1, "done");
}

let result = pair("Ada", 6);
console.log("multi_adapter", result[0], result.length, result[1], result[2]);
