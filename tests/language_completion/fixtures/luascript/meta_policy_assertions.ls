verify {
  stdout "policy_assertions ok bc:10 3";
  lua_policy "requires=lua.goto";
  lua_policy "forbid=js.prototype";
  lua_policy "resolve.continue=label_goto";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "adapters.length=array_length_property";
  lua_policy "adapters.truthiness=js_truthy";
  lua_policy "repairs.slicing=runtime_slice";
  lua_policy "repairs.string_coercion=explicit_tostring";
  ls_not_contains "adapt multiple_returns using packed_array";
  lua_contains "__ls_index(";
  lua_contains "__ls_length(";
  lua_contains "__ls_truthy(";
  lua_contains "__ls_slice(";
  lua_contains "__ls_add(";
}

meta {
  target lua {
    requires lua.goto;
    forbid js.prototype;
    resolve continue using label_goto;
    adapt indexing using zero_based;
    adapt length using array_length_property;
    adapt truthiness using js_truthy;
  }
}

repair {
  target lua {
    lower slicing using runtime_slice;
    lower string_coercion using explicit_tostring;
  }
}

let values = [10, 20, 30];
let word = "abcd";

let label = "bad";
if (0) {
  label = "bad";
} else {
  label = "ok";
}

let joined = word.slice(1, 3) + ":" + values[0];

console.log("policy_assertions", label, joined, values.length);
