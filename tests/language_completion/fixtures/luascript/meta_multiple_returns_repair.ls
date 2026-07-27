verify {
  stdout "multi_repair left right 2";
  lua_stdout "multi_repair left right 2";
  python_stdout "multi_repair left right 2";
  lua_repair "multiple_returns=packed_array";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  python_repair "multiple_returns=packed_array";
  python_repair "indexing=zero_based";
  python_repair "length=array_length_property";
  python_policy "repairs.multiple_returns=packed_array";
  python_contains "return [";
  python_contains "len(result)";
  python_not_contains "many(";
}

repair {
  target lua {
    lower multiple_returns using packed_array;
    lower indexing using zero_based;
    lower length using array_length_property;
  }
  target python {
    lower multiple_returns using packed_array;
    lower indexing using zero_based;
    lower length using array_length_property;
  }
}

function pair() {
  return many("left", "right");
}

let result = pair();
console.log("multi_repair", result[0], result[1], result.length);
