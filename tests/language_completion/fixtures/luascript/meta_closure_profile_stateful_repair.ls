verify {
  stdout "closure_profile step=3 value=11 hit=3 marker=done total=19";
  lua_stdout "closure_profile step=3 value=11 hit=3 marker=done total=19";
  python_stdout "closure_profile step=3 value=11 hit=3 marker=done total=19";
  js_stdout "closure_profile step=3 value=11 hit=3 marker=done total=19";
  ls_stdout "closure_profile step=3 value=11 hit=3 marker=done total=19";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "adapters.length=array_length_property";
  lua_policy "adapters.slicing=runtime_slice";
  lua_policy "adapters.truthiness=js_truthy";
  lua_policy "adapters.string_coercion=explicit_tostring";
  lua_policy "adapters.multiple_returns=packed_array";
  python_policy "adapters.indexing=zero_based";
  python_policy "adapters.length=array_length_property";
  python_policy "adapters.slicing=runtime_slice";
  python_policy "adapters.truthiness=js_truthy";
  python_policy "adapters.string_coercion=explicit_tostring";
  python_policy "adapters.multiple_returns=packed_array";
  js_policy "adapters.indexing=zero_based";
  js_policy "adapters.length=array_length_property";
  js_policy "adapters.slicing=runtime_slice";
  js_policy "adapters.truthiness=js_truthy";
  js_policy "adapters.string_coercion=explicit_tostring";
  js_policy "adapters.multiple_returns=packed_array";
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
  python_contains "nonlocal current";
  python_contains "nonlocal hits";
  python_contains "__ls_index";
  python_contains "__ls_set_index";
  python_contains "__ls_slice";
  python_contains "__ls_truthy";
  python_contains "__ls_add";
  python_contains "len(";
  python_contains "return [";
  python_not_contains "global current";
  python_not_contains "global hits";
  ls_contains "portable_semantics_v1";
}

meta profile portable_semantics_v1;

let values = [2, 4, 6, 8];
let stepSize = 3;

function makeStepper(step) {
  let current = values[0];
  let hits = 0;

  function tick(limit) {
    let buffer = [0, 0, 0, 0];
    while (current < limit) {
      current = current + step;
      hits = hits + 1;
      buffer[hits - 1] = current;
    }

    let window = buffer.slice(0, hits);
    return many(current, hits, window[0] + window.length);
  }

  return tick;
}

let stepper = makeStepper(stepSize);
let result = stepper(10);
let marker = result[1] && "done";
let total = result[0] + result[2];
let summary = "step=" + stepSize + " value=" + result[0] + " hit=" + result[1] + " marker=" + marker + " total=" + total;

console.log("closure_profile", summary);
