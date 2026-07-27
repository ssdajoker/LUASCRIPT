meta profile portable_v1;
meta profile portable_semantics_v1;

verify {
  stdout "profile_composition b 4 bc 8 9 ok";
  lua_stdout "profile_composition b 4 bc 8 9 ok";
  python_stdout "profile_composition b 4 bc 8 9 ok";
  js_stdout "profile_composition b 4 bc 8 9 ok";
  ls_stdout "profile_composition b 4 bc 8 9 ok";
  feature "meta-profiles";
  profile "portable_v1";
  profile "portable_semantics_v1";
  implicit_profile "portable_semantics_v1";
  no_profile "portable_runtime_v1";
  no_implicit_profile "portable_v1";
  lua_policy "diagnostics.async=async is not supported in LuaScript V0";
  lua_policy "adapters.slicing=runtime_slice";
  js_policy "requires=js.console";
  python_policy "forbid=python.imports";
  ls_policy "forbid=js.prototype";
}

let values = [5, 7, 9];
let word = "abcd";

values[1] = 8;

console.log("profile_composition", word[1], word.length, word.slice(1, 3), values[1], values[2], "ok");
