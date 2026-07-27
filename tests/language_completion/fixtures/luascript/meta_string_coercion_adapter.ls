verify {
  stdout "meta_string count: 3 flag=false empty=null numeric=5";
  lua_stdout "meta_string count: 3 flag=false empty=null numeric=5";
  python_stdout "meta_string count: 3 flag=false empty=null numeric=5";
  js_stdout "meta_string count: 3 flag=false empty=null numeric=5";
  ls_stdout "meta_string count: 3 flag=false empty=null numeric=5";
  lua_policy "adapters.string_coercion=explicit_tostring";
  lua_repair "string_coercion=explicit_tostring";
  python_policy "adapters.string_coercion=explicit_tostring";
  python_repair "string_coercion=explicit_tostring";
  ls_policy "adapters.string_coercion=explicit_tostring";
  python_contains "__ls_add";
  python_contains "__ls_to_string";
  python_not_contains " + False";
  ls_contains "portable_semantics_v1";
}

meta profile portable_semantics_v1;

let label = "count: ";
let value = 3;
let flag = false;
let empty = null;
let numeric = 2 + 3;

console.log("meta_string", label + value, "flag=" + flag, "empty=" + empty, "numeric=" + numeric);
