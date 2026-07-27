verify {
  diagnostic "lua_continue_no_compatible_lowering";
}

meta {
  target lua {
    forbid lua.goto;
  }
}

let total = 0;

for (let value = 1; value < 4; value = value + 1) {
  if (value == 2) {
    continue;
  }
  total = total + value;
}

console.log("forbid_goto_continue", total);
