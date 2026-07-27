meta profile portable_v1;

meta {
  target lua {
    diagnose async as unsupported "portable override async";
  }
}

verify {
  diagnostic "Missing LUASCRIPT policy assertion for lua: diagnostics.async=async is not supported in LuaScript V0";
  lua_policy "diagnostics.async=async is not supported in LuaScript V0";
}

console.log("meta_profile_override_policy_missing", 1);
