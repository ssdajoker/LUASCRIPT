verify {
  stdout "no_goto 6";
  lua_not_contains "goto ";
  lua_not_contains "::";
}

meta {
  target lua {
    forbid lua.goto;
  }
}

let total = 0;

for (let value = 1; value < 4; value = value + 1) {
  total = total + value;
}

console.log("no_goto", total);
