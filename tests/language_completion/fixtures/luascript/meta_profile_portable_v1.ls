meta profile portable_v1;

verify {
  stdout "meta_profile 7";
  feature "meta-profiles";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "diagnostics.async=async is not supported in LuaScript V0";
  js_policy "requires=js.console";
  python_policy "adapters.multiple_returns=packed_array";
  ls_policy "forbid=js.prototype";
}

let values = [3, 4];
console.log("meta_profile", values[0] + values[1]);
