function add(a, b) {
  return a + b;
}

let value = add(2, 5);

if (value > 5) {
  console.log("js_branch", "big", value);
} else {
  console.log("js_branch", "small", value);
}
