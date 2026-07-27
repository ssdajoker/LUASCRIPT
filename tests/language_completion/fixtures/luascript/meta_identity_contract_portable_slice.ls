meta profile portable_v1;
meta profile portable_semantics_v1;

meta {
  target lua {
    requires lua.goto;
    adapt indexing using zero_based;
    adapt length using array_length_property;
    adapt slicing using runtime_slice;
  }
  target javascript {
    requires js.console;
  }
  target python {
    requires python.print;
    forbid python.imports;
  }
  target luascript {
    requires js.console;
    forbid js.prototype;
  }
}

repair {
  target lua {
    lower indexing using zero_based;
    lower length using array_length_property;
    lower slicing using runtime_slice;
  }
  target javascript {
    lower indexing using zero_based;
    lower length using array_length_property;
  }
  target python {
    lower indexing using zero_based;
    lower length using array_length_property;
    lower slicing using runtime_slice;
    lower truthiness using js_truthy;
    lower string_coercion using explicit_tostring;
    lower multiple_returns using packed_array;
  }
}

verify {
  stdout "identity_contract b 4 bc list_truthy zero_false count=3 Ada 3 2 8 done";
  lua_stdout "identity_contract b 4 bc list_truthy zero_false count=3 Ada 3 2 8 done";
  js_stdout "identity_contract b 4 bc list_truthy zero_false count=3 Ada 3 2 8 done";
  python_stdout "identity_contract b 4 bc list_truthy zero_false count=3 Ada 3 2 8 done";
  ls_stdout "identity_contract b 4 bc list_truthy zero_false count=3 Ada 3 2 8 done";
  feature "meta-profiles";
  feature "meta-blocks";
  feature "repair-blocks";
  feature "verify-blocks";
  no_feature "classes";
  no_feature "for-of";
  no_feature "try-catch";
  no_feature "template-literals";
  profile "portable_v1";
  profile "portable_semantics_v1";
  implicit_profile "portable_semantics_v1";
  no_profile "portable_runtime_v1";
  no_implicit_profile "portable_v1";
  lua_policy "requires=lua.goto";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "adapters.length=array_length_property";
  lua_policy "adapters.slicing=runtime_slice";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  lua_repair "slicing=runtime_slice";
  lua_contains "__ls_index";
  lua_contains "__ls_length";
  lua_contains "__ls_slice";
  js_policy "requires=js.console";
  js_repair "indexing=zero_based";
  js_repair "length=array_length_property";
  python_policy "requires=python.print";
  python_policy "forbid=python.imports";
  python_policy "adapters.truthiness=js_truthy";
  python_repair "indexing=zero_based";
  python_repair "length=array_length_property";
  python_repair "slicing=runtime_slice";
  python_repair "truthiness=js_truthy";
  python_repair "string_coercion=explicit_tostring";
  python_repair "multiple_returns=packed_array";
  python_contains "__ls_index";
  python_contains "__ls_slice";
  python_contains "__ls_truthy";
  python_contains "__ls_add";
  python_contains "return [";
  ls_policy "requires=js.console";
  ls_policy "forbid=js.prototype";
  ls_repair "indexing=zero_based";
  ls_repair "length=array_length_property";
  ls_repair "slicing=runtime_slice";
  ls_contains "portable_v1";
  ls_contains "portable_semantics_v1";
}

function pack(name, score) {
  return many(name, score + 1, "done");
}

let values = [5, 7, 9];
let word = "abcd";

values[1] = values[1] + 1;

let char = word[1];
let segment = word.slice(1, 3);
let listFlag = "bad";
if ([]) {
  listFlag = "list_truthy";
}

let zeroFlag = "bad";
if (0) {
  zeroFlag = "bad_zero";
} else {
  zeroFlag = "zero_false";
}

let label = "count=" + values.length;
let result = pack("Ada", 1);

console.log("identity_contract", char, word.length, segment, listFlag, zeroFlag, label, result[0], result.length, result[1], values[1], result[2]);
