let outer = 100;
let inner = outer + 50;
let x = 0;

if (true) {
  x = x + 1;
}

let y = x;
let funcLocal = 999;
let funcResult = funcLocal;
let isCorrect = funcResult === 999 && y === 1;

console.log("mirror_scope_binding", funcResult, y, isCorrect);
