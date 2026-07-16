meta profile portable_v1;

meta {
  target lua {
    diagnose async as unsupported "portable override async";
  }
}

verify {
  stdout "meta_profile_override 5";
  feature "meta-profiles";
  lua_policy "diagnostics.async=portable override async";
  python_policy "diagnostics.async=async is not supported in LuaScript V0";
  ls_policy "adapters.slicing=runtime_slice";
}

let values = [2, 3];
console.log("meta_profile_override", values[0] + values[1]);
