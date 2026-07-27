verify {
  stdout "verify_targets 7";
  lua_contains "print(";
  lua_not_contains "verify {";
  js_contains "console.log";
  js_not_contains "_LS.";
  ls_contains "console.log";
  ls_not_contains "local ";
}

let total = 3 + 4;
console.log("verify_targets", total);
