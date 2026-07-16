verify {
  lua_stdout "verify_runtime 10";
  js_stdout "verify_runtime 10";
  ls_stdout "verify_runtime 10";
  lua_contains "print(";
  js_contains "console.log";
  ls_contains "console.log";
}

let base = 6;
let total = base + 4;
console.log("verify_runtime", total);
