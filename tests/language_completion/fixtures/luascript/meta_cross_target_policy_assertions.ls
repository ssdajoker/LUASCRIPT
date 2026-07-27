verify {
  stdout "cross_policy ok 9";
  lua_policy "requires=lua.goto";
  lua_policy "resolve.continue=label_goto";
  js_policy "requires=js.console";
  js_policy "forbid=js.prototype";
  js_policy "resolve.continue=native_continue";
  js_policy "adapters.truthiness=js_truthy";
  ls_not_contains "adapt multiple_returns using packed_array";
  python_policy "requires=python.print";
  python_policy "forbid=python.imports";
  python_policy "repairs.slicing=runtime_slice";
  python_not_policy "resolve.continue=label_goto";
  ls_contains "target javascript";
  ls_contains "target python";
  ls_contains "forbid js.prototype";
  ls_contains "lower slicing using runtime_slice";
}

meta {
  target lua {
    requires lua.goto;
    resolve continue using label_goto;
  }

  target javascript {
    requires js.console;
    forbid js.prototype;
    resolve continue using native_continue;
    adapt truthiness using js_truthy;
  }

  target python {
    requires python.print;
    forbid python.imports;
  }
}

repair {
  target python {
    lower slicing using runtime_slice;
  }
}

let total = 4 + 5;
console.log("cross_policy", "ok", total);
