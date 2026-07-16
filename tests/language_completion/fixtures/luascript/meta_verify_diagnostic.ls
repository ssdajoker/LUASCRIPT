verify {
  diagnostic "async is not supported in LuaScript V0";
}

meta {
  target lua {
    diagnose async as unsupported "async is not supported in LuaScript V0";
  }
}

async function demo() {
  return 1;
}

console.log("meta_async", demo());
