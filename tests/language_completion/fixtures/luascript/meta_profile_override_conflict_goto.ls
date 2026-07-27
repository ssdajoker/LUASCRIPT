meta profile portable_v1;

meta {
  target lua {
    forbid lua.goto;
  }
}

verify {
  diagnostic "Conflicting capability policy: lua.goto is both required and forbidden";
}

let total = 0;

for (let value = 1; value < 5; value = value + 1) {
  if (value == 2) {
    continue;
  }
  total = total + value;
}

console.log("meta_profile_conflict", total);
