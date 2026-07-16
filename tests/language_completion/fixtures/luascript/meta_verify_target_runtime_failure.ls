verify {
  lua_runtime_error "missingFunction";
  js_runtime_error "missingFunction";
  ls_runtime_error "missingFunction";
  lua_contains "missingFunction";
  js_contains "missingFunction";
  ls_contains "missingFunction";
}

console.log("verify_runtime_failure", "before");
missingFunction();
console.log("verify_runtime_failure", "after");
