meta {
  target lua {
    forbid lua.goto;
  }
}

verify {
  diagnostic "lua_continue_no_compatible_lowering";
}

let total = 0;

for (let value = 1; value < 5; value = value + 1) {
  if (value == 2) {
    continue;
  }
  total = total + value;
}

console.log("meta_no_compatible_continue", total);
