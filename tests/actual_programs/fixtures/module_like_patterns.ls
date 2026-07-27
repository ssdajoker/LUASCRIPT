function double(x) {
  return x * 2;
}

function triple(x) {
  return x * 3;
}

let moduleName = "math";
let result = double(6) + triple(2);

console.log("module_like", moduleName, result);
