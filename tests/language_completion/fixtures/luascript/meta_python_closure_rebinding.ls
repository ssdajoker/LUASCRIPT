verify {
  stdout "python_closure_rebind 24 31";
  python_stdout "python_closure_rebind 24 31";
  lua_stdout "python_closure_rebind 24 31";
  js_stdout "python_closure_rebind 24 31";
  ls_stdout "python_closure_rebind 24 31";
  python_contains "nonlocal current";
  python_not_contains "global current";
}

let seed = 2;

function makeCounter(step) {
  let current = seed;

  function inner(limit) {
    let total = 0;
    while (current < limit) {
      current = current + step;
      total = total + current;
    }
    return total;
  }

  return inner;
}

let counter = makeCounter(3);
let first = counter(10);
let second = counter(16);

console.log("python_closure_rebind", first, second);
